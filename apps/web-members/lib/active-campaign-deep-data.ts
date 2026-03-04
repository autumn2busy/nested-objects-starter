import { ProfileUpdateData } from '@/app/api/webhooks/outseta/route';
import { env } from '@/lib/env';
import { createServiceRoleClient } from '@/lib/supabase-admin';

const AC_API_URL = env.acApiUrl;
const AC_API_KEY = env.acApiKey;
const AC_CONNECTION_ID = env.acConnectionId;

interface SyncResult {
    logs: string[];
}

/**
 * Main orchestrator: Syncs Contact -> Customer -> Order -> Recurring Payment
 */
export async function syncFullProfileDeepData(profile: ProfileUpdateData): Promise<SyncResult> {
    const logs: string[] = [];
    const supabase = createServiceRoleClient();

    if (!AC_API_URL || !AC_API_KEY || !AC_CONNECTION_ID) {
        logs.push("Missing AC credentials in env.");
        return { logs };
    }

    try {
        // 0. Fetch existing IDs from Supabase
        const { data: dbProfile, error: dbError } = await supabase
            .from('profiles')
            .select('ac_contact_id, ac_customer_id')
            .eq('user_email', profile.user_email)
            .single();

        if (dbError && dbError.code !== 'PGRST116') {
            logs.push(`Error fetching profile from DB: ${dbError.message}`);
        }

        let contactId = dbProfile?.ac_contact_id;
        let customerId = dbProfile?.ac_customer_id;

        // 1. Sync Contact (if missing ID or just to update)
        // We always sync to ensure fields are up to date
        const syncedContactId = await syncContact(profile, logs);
        if (syncedContactId) {
            if (contactId !== syncedContactId) {
                contactId = syncedContactId;
                await supabase.from('profiles').update({ ac_contact_id: contactId }).eq('user_email', profile.user_email);
                logs.push(`Saved AC Contact ID to DB: ${contactId}`);
            }
        } else if (!contactId) {
            logs.push("Failed to sync Contact and no ID in DB. Aborting.");
            return { logs };
        }

        // 1b. Add Contact to List (list=12, status=1)
        await addContactToList(contactId!, 12, 1, logs);

        // 2. Sync Ecommerce Customer
        const syncedCustomerId = await syncEcommerceCustomer(profile, logs);
        if (syncedCustomerId) {
            if (customerId !== syncedCustomerId) {
                customerId = syncedCustomerId;
                await supabase.from('profiles').update({ ac_customer_id: customerId }).eq('user_email', profile.user_email);
                logs.push(`Saved AC Customer ID to DB: ${customerId}`);
            }
        } else if (!customerId) {
            logs.push("Failed to sync Customer and no ID in DB. Aborting.");
            return { logs };
        }

        // 3. Sync Tags
        await syncTags(contactId!, profile, logs);

        // 4. Sync Order (If paid)
        const isPaid = profile.subscription_tier !== 'free';
        let orderId: string | null = null;

        if (isPaid && profile.plan_uid) {
            orderId = await syncEcommerceOrder(profile, customerId!, logs);
        } else {
            logs.push("Skipping Order sync (Free plan or no plan UID)");
        }

        // 5. Sync Recurring Payment (If paid & active & order created)
        if (isPaid && profile.plan_uid && orderId) {
            await syncRecurringPayment(profile, customerId!, orderId, contactId!, logs);
        }

        logs.push("Deep Data sync complete.");

    } catch (error: any) {
        logs.push(`Error in syncFullProfileDeepData: ${error.message}`);
        console.error(error);
    }

    return { logs };
}

async function syncContact(profile: ProfileUpdateData, logs: string[]): Promise<string | null> {
    const url = `${AC_API_URL}/api/3/contact/sync`;

    // Construct payload
    const payload = {
        contact: {
            email: profile.email,
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            phone: profile.phone || '',
        }
    };

    try {
        logs.push(`Syncing Contact: ${profile.email}`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY!, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.contact) {
            return data.contact.id; // Returns ID as string or number
        }
        logs.push(`AC Contact Sync response: ${JSON.stringify(data)}`);
        return null;
    } catch (e) {
        logs.push(`Error syncing contact: ${e}`);
        return null;
    }
}

async function syncEcommerceCustomer(profile: ProfileUpdateData, logs: string[]): Promise<string | null> {
    const url = `${AC_API_URL}/api/3/ecomCustomers`;
    const externalId = profile.outseta_person_uid;

    const payload = {
        ecomCustomer: {
            connectionid: AC_CONNECTION_ID,
            externalid: externalId,
            email: profile.email,
            acceptsMarketing: 1,
        }
    };

    try {
        logs.push(`Syncing Customer: ${profile.email}`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY!, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.ecomCustomer) {
            return data.ecomCustomer.id;
        } else {
            // Customer likely already exists (duplicate). Try GET by email.
            logs.push(`Customer create returned non-standard response, trying GET fallback...`);
            try {
                const getUrl = `${AC_API_URL}/api/3/ecomCustomers?filters[email]=${encodeURIComponent(profile.email)}`;
                const getRes = await fetch(getUrl, {
                    method: 'GET',
                    headers: { 'Api-Token': AC_API_KEY!, 'Content-Type': 'application/json' }
                });
                const getData = await getRes.json();
                if (getData.ecomCustomers && getData.ecomCustomers.length > 0) {
                    logs.push(`Found existing customer via GET: ${getData.ecomCustomers[0].id}`);
                    return getData.ecomCustomers[0].id;
                }
            } catch (fetchErr) {
                logs.push(`Error fetching existing customer: ${fetchErr}`);
            }
            logs.push(`AC Customer Sync failed: ${JSON.stringify(data)}`);
            return null;
        }
    } catch (e) {
        logs.push(`Error syncing customer: ${e}`);
        return null;
    }
}

async function syncTags(contactId: string, profile: ProfileUpdateData, logs: string[]) {
    // 1. Determine correct tags
    // For founders tier, use 'founder' to match AC tag 'plan-founder' exactly
    const tagTier = profile.subscription_tier === 'founders' ? 'founder' : profile.subscription_tier;
    const expectedTierTag = `plan-${tagTier}`;
    const expectedStatusTag = profile.subscription_status ? `status-${profile.subscription_status}` : null;

    // 2. Fetch existing contact tags to remove conflicts
    try {
        const getUrl = `${AC_API_URL}/api/3/contacts/${contactId}/contactTags?include=tag`;
        const res = await fetch(getUrl, {
            headers: { 'Api-Token': AC_API_KEY! }
        });
        const data = await res.json();
        if (data.contactTags && data.tags) {
            // Create map of tag ID to tag name
            const tagsMap = new Map<string, string>();
            for (const t of data.tags) {
                tagsMap.set(t.id, t.tag);
            }

            // Loop associations
            for (const ct of data.contactTags) {
                const tagName = tagsMap.get(ct.tag);
                if (!tagName) continue;

                const nameLower = tagName.toLowerCase();

                // If it's a plan tag but not the expected one, remove it
                if (nameLower.startsWith('plan-') && nameLower !== expectedTierTag.toLowerCase()) {
                    await removeTagFromContact(ct.id, tagName, logs);
                }

                // If it's a status tag but not the expected one, remove it
                if (nameLower.startsWith('status-') && expectedStatusTag && nameLower !== expectedStatusTag.toLowerCase()) {
                    await removeTagFromContact(ct.id, tagName, logs);
                }
            }
        }
    } catch (e) {
        logs.push(`[Tag Cleanup] Error fetching existing tags: ${e}`);
    }

    // 3. Add expected tags
    await addTagToContact(contactId, expectedTierTag, logs);

    if (expectedStatusTag) {
        await addTagToContact(contactId, expectedStatusTag, logs);
    }

    // 4. Generic tags
    await addTagToContact(contactId, 'antigravity-subscription', logs);
    await addTagToContact(contactId, 'launch-2026-03-01', logs);

    // 5. Persona Tag (Passed from Outseta CustomFields)
    const rawData = profile.outseta_data as any;

    // In Person-centric payloads, it's at root. In Account-centric, it's inside PersonAccount
    let customFields = null;
    if (rawData?.CustomFields) {
        customFields = rawData.CustomFields;
    } else if (rawData?.PersonAccount && rawData.PersonAccount.length > 0) {
        // Try to find the primary person
        const primaryPa = rawData.PersonAccount.find((pa: any) => pa.IsPrimary) || rawData.PersonAccount[0];
        if (primaryPa?.Person?.CustomFields) {
            customFields = primaryPa.Person.CustomFields;
        }
    }

    if (customFields?.Persona) {
        // Assume the script already passed it strictly as persona-something
        // Just in case, we format it:
        const rawPersona = customFields.Persona.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

        // If it already starts with persona-, use it, else prepend it
        const personaTag = rawPersona.startsWith('persona-') ? rawPersona : `persona-${rawPersona}`;
        await addTagToContact(contactId, personaTag, logs);
    }

    // Check if this is a migration from Wix (passed as a custom field or similar)
    if (customFields?.Migration_Source === 'wix') {
        await addTagToContact(contactId, 'migrate', logs);
    }

    // 6. Source tag (if available from Outseta referer)
    // Outseta passes IPAddress and Referer in Person payload
    const referer = rawData?.Referer || rawData?.referer;
    if (referer && typeof referer === 'string') {
        try {
            const url = new URL(referer);
            const utmSource = url.searchParams.get('utm_source');
            if (utmSource) {
                await addTagToContact(contactId, `utm-${utmSource}`, logs);
            }
        } catch {
            // Not a valid URL, skip
        }
    }
}

// In-memory tag name → ID cache (lives for the duration of a single sync)
const tagIdCache = new Map<string, string>();

async function addTagToContact(contactId: string, tagName: string, logs: string[]) {
    try {
        // Step 1: Find or create the tag
        let tagId = tagIdCache.get(tagName);

        if (!tagId) {
            // Search for existing tag
            const searchRes = await fetch(
                `${AC_API_URL}/api/3/tags?search=${encodeURIComponent(tagName)}`,
                { headers: { 'Api-Token': AC_API_KEY! } }
            );
            const searchData = await searchRes.json();
            const existingTag = searchData.tags?.find(
                (t: any) => t.tag.toLowerCase() === tagName.toLowerCase()
            );

            if (existingTag) {
                tagId = existingTag.id;
            } else {
                // Create the tag
                const createRes = await fetch(`${AC_API_URL}/api/3/tags`, {
                    method: 'POST',
                    headers: { 'Api-Token': AC_API_KEY!, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tag: { tag: tagName, tagType: 'contact', description: `Auto-created by sync` } })
                });
                const createData = await createRes.json();
                tagId = createData.tag?.id;
            }

            if (tagId) {
                tagIdCache.set(tagName, tagId);
            }
        }

        if (!tagId) {
            logs.push(`[Tag] Could not find/create tag '${tagName}'`);
            return;
        }

        // Step 2: Associate tag with contact
        const assocRes = await fetch(`${AC_API_URL}/api/3/contactTags`, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY!, 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } })
        });

        if (assocRes.ok || assocRes.status === 201) {
            logs.push(`[Tag] Added '${tagName}' to contact ${contactId}`);
        } else {
            const errData = await assocRes.json().catch(() => ({}));
            // 422 often means tag already applied — not an error
            if (assocRes.status === 422) {
                // Not logging already-applied.
            } else {
                logs.push(`[Tag] Failed to add '${tagName}': ${assocRes.status} ${JSON.stringify(errData)}`);
            }
        }
    } catch (e) {
        logs.push(`[Tag] Error adding '${tagName}': ${e}`);
    }
}

async function removeTagFromContact(contactTagId: string, tagName: string, logs: string[]) {
    try {
        const url = `${AC_API_URL}/api/3/contactTags/${contactTagId}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: { 'Api-Token': AC_API_KEY! }
        });

        if (res.ok) {
            logs.push(`[Tag] Removed conflicting tag '${tagName}' (Assoc ID: ${contactTagId})`);
        } else {
            logs.push(`[Tag] Failed to remove '${tagName}': Status ${res.status}`);
        }
    } catch (e) {
        logs.push(`[Tag] Error removing '${tagName}': ${e}`);
    }
}

async function syncEcommerceOrder(profile: ProfileUpdateData, customerId: string, logs: string[]): Promise<string | null> {
    const url = `${AC_API_URL}/api/3/ecomOrders`;
    // Plan UID + Account UID makes a unique "Purchase" ID for this subscription instance
    const externalId = `${profile.outseta_account_id}-${profile.plan_uid}`;

    // Pricing Map
    let price = 0;
    switch (profile.subscription_tier) {
        case 'pro': price = 4900; break;
        case 'elite': price = 9900; break;
        case 'agency': price = 29900; break;
        case 'founders': price = 3700; break;
        default: price = 0;
    }

    const payload = {
        ecomOrder: {
            externalid: externalId,
            source: 1, // 1 = Historical, 0 = Real-time
            email: profile.email,
            orderNumber: externalId,
            totalPrice: price,
            currency: 'USD',
            connectionid: AC_CONNECTION_ID,
            customerid: customerId,
            orderDate: new Date().toISOString(),
            orderProducts: [
                {
                    name: profile.plan_name || 'Membership',
                    price: price,
                    quantity: 1,
                    externalid: profile.plan_uid
                }
            ]
        }
    };

    try {
        logs.push(`Syncing Order: ${externalId}`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY!, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ecomOrder) {
            return data.ecomOrder.id;
        }

        // Order likely already exists (duplicate externalid). Try GET fallback.
        logs.push(`Order create returned non-standard response, trying GET fallback...`);
        try {
            const getUrl = `${AC_API_URL}/api/3/ecomOrders?filters[externalid]=${encodeURIComponent(externalId)}`;
            const getRes = await fetch(getUrl, {
                method: 'GET',
                headers: { 'Api-Token': AC_API_KEY!, 'Content-Type': 'application/json' }
            });
            const getData = await getRes.json();
            if (getData.ecomOrders && getData.ecomOrders.length > 0) {
                logs.push(`Found existing order via GET: ${getData.ecomOrders[0].id}`);
                return getData.ecomOrders[0].id;
            }
        } catch (fetchErr) {
            logs.push(`Error fetching existing order: ${fetchErr}`);
        }

        logs.push(`AC Order Sync failed: ${JSON.stringify(data)}`);
        return null;
    } catch (e) {
        logs.push(`Error syncing order: ${e}`);
        return null;
    }
}

async function syncRecurringPayment(profile: ProfileUpdateData, customerId: string, orderId: string, contactId: string, logs: string[]) {
    // ActiveCampaign E-Commerce GraphQL endpoint
    const gqlUrl = `${AC_API_URL}/api/3/ecom/graphql`;

    // Use outseta_account_id as the unique storeRecurringPaymentId.
    // This ensures the same subscription always maps to the same RP record.
    const storeRecurringPaymentId = profile.outseta_account_id || profile.outseta_person_uid;

    // Mutation: bulkUpsertRecurringPayments takes [RecurringPaymentInput]
    // Discovered via schema introspection on the live AC GraphQL API.
    const mutation = `
        mutation bulkUpsertRecurringPayments($recurringPayments: [RecurringPaymentInput]) {
            bulkUpsertRecurringPayments(recurringPayments: $recurringPayments) {
                recordId
            }
        }
    `;

    // Map subscription status to RecurringPaymentStatus enum
    let normalizedStatus = 'ACTIVE';
    if (profile.subscription_status === 'canceled') normalizedStatus = 'CANCELLED';
    else if (profile.subscription_status === 'past_due') normalizedStatus = 'PAYMENT_FAILED';
    else if (profile.subscription_status === 'paused') normalizedStatus = 'PAUSED';

    // Pricing in dollars (GraphQL paymentAmount uses whole dollars, not cents)
    let amount = 0;
    switch (profile.subscription_tier) {
        case 'pro': amount = 49; break;
        case 'elite': amount = 99; break;
        case 'agency': amount = 299; break;
        case 'founders': amount = 37; break;
    }

    const planName = profile.plan_name || 'Membership';

    // Fallbacks to avoid GraphQL crashing over null required dates
    const safeStartDate = profile.subscription_start_date || new Date().toISOString();

    let safeEndDate = profile.subscription_end_date;
    if (!safeEndDate) {
        // Assume 1 month if Outseta was completely missing RenewalDate
        const d = new Date(safeStartDate);
        d.setMonth(d.getMonth() + 1);
        safeEndDate = d.toISOString();
    }

    const variables = {
        recurringPayments: [{
            legacyConnectionId: parseInt(AC_CONNECTION_ID!, 10),
            storeRecurringPaymentId: storeRecurringPaymentId,
            storeCustomerId: profile.outseta_person_uid,
            email: profile.email,
            name: planName,
            normalizedStatus: normalizedStatus,
            storeStatus: profile.subscription_status || 'active',
            originOrderId: `${profile.outseta_account_id}-${profile.plan_uid}`,
            billingInterval: 'MONTHLY',
            billingIntervalCount: profile.billing_renewal_term || 1,
            paymentAmount: amount,
            currency: 'USD',
            startDate: safeStartDate,
            nextPaymentDate: safeEndDate,
            lineItemNames: [planName],
            lineItemStorePrimaryIds: [profile.plan_uid],
        }]
    };

    try {
        logs.push(`Syncing Recurring Payment (GraphQL) to ${gqlUrl}`);
        logs.push(`storeRecurringPaymentId: ${storeRecurringPaymentId}`);
        const res = await fetch(gqlUrl, {
            method: 'POST',
            headers: {
                'Api-Token': AC_API_KEY!,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: mutation, variables })
        });

        const data = await res.json();
        if (data.errors && data.errors.length > 0) {
            logs.push(`GQL Errors: ${JSON.stringify(data.errors)}`);
        } else if (data.data?.bulkUpsertRecurringPayments?.recordId) {
            logs.push(`Recurring Payment bulk upsert submitted. Record ID: ${data.data.bulkUpsertRecurringPayments.recordId}`);
        } else {
            logs.push(`GQL Response: ${JSON.stringify(data)}`);
        }

    } catch (e) {
        logs.push(`Error syncing Recurring Payment: ${e}`);
    }
}

/**
 * Add a contact to an ActiveCampaign list.
 * @param contactId - AC contact ID
 * @param listId - AC list ID (e.g. 12)
 * @param status - 1 = subscribed, 2 = unsubscribed
 */
async function addContactToList(contactId: string, listId: number, status: number, logs: string[]) {
    const url = `${AC_API_URL}/api/3/contactLists`;
    const payload = {
        contactList: {
            list: listId,
            contact: contactId,
            status: status,
        }
    };

    try {
        logs.push(`Adding contact ${contactId} to list ${listId} (status=${status})`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY!, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.contactList) {
            logs.push(`Contact added to list ${listId} successfully.`);
        } else {
            logs.push(`List subscription response: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        logs.push(`Error adding contact to list: ${e}`);
    }
}
