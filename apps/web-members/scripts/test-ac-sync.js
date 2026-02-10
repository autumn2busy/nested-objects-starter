const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Polyfill crypto for Supabase
if (!global.crypto) {
    try { global.crypto = require('crypto').webcrypto; } catch (e) { }
}

// --- CONFIG ---

function createServiceRoleClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase URL or Key");
        return null;
    }
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

const AC_API_URL = process.env.AC_API_URL;
const AC_API_KEY = process.env.AC_API_KEY;
const AC_CONNECTION_ID = process.env.AC_CONNECTION_ID;

// --- SYNC LOGIC ---

async function syncFullProfileDeepData(profile) {
    const logs = [];
    const supabase = createServiceRoleClient();

    if (!AC_API_URL || !AC_API_KEY || !AC_CONNECTION_ID) {
        logs.push("Missing AC credentials in env.");
        return { logs };
    }

    try {
        // 0. Fetch existing IDs from Supabase
        let contactId = null;
        let customerId = null;
        if (supabase) {
            const { data: dbProfile, error: dbError } = await supabase
                .from('profiles')
                .select('ac_contact_id, ac_customer_id')
                .eq('user_email', profile.user_email)
                .single();
            if (dbError && dbError.code !== 'PGRST116') {
                logs.push(`Error fetching profile from DB: ${dbError.message}`);
            }
            contactId = dbProfile?.ac_contact_id;
            customerId = dbProfile?.ac_customer_id;
        }

        // 1. Sync Contact
        const syncedContactId = await syncContact(profile, logs);
        if (syncedContactId) {
            if (contactId !== syncedContactId) {
                contactId = syncedContactId;
                if (supabase) {
                    await supabase.from('profiles').update({ ac_contact_id: contactId }).eq('user_email', profile.user_email);
                }
                logs.push(`Saved AC Contact ID: ${contactId}`);
            }
        } else if (!contactId) {
            logs.push("Failed to sync Contact. Aborting.");
            return { logs };
        }

        // 1b. Add Contact to List (list=12, status=1)
        await addContactToList(contactId, 12, 1, logs);

        // 2. Sync Ecommerce Customer
        const syncedCustomerId = await syncEcommerceCustomer(profile, logs);
        if (syncedCustomerId) {
            if (customerId !== syncedCustomerId) {
                customerId = syncedCustomerId;
                if (supabase) {
                    await supabase.from('profiles').update({ ac_customer_id: customerId }).eq('user_email', profile.user_email);
                }
                logs.push(`Saved AC Customer ID: ${customerId}`);
            }
        } else if (!customerId) {
            logs.push("Failed to sync Customer. Aborting.");
            return { logs };
        }

        // 3. Sync Tags (placeholder)
        await syncTags(contactId, profile, logs);

        // 4. Sync Order (If paid)
        const isPaid = profile.subscription_tier !== 'free';
        let orderId = null;
        if (isPaid && profile.plan_uid) {
            orderId = await syncEcommerceOrder(profile, customerId, logs);
        } else {
            logs.push("Skipping Order sync (Free plan or no plan UID)");
        }

        // 5. Sync Recurring Payment
        if (isPaid && profile.plan_uid && orderId) {
            await syncRecurringPayment(profile, customerId, orderId, contactId, logs);
        }

        logs.push("Deep Data sync complete.");
    } catch (error) {
        logs.push(`Error: ${error.message}`);
        console.error(error);
    }

    return { logs };
}

async function syncContact(profile, logs) {
    const url = `${AC_API_URL}/api/3/contact/sync`;
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
            headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.contact) return data.contact.id;
        logs.push(`Contact response: ${JSON.stringify(data)}`);
        return null;
    } catch (e) {
        logs.push(`Error syncing contact: ${e}`);
        return null;
    }
}

async function addContactToList(contactId, listId, status, logs) {
    const url = `${AC_API_URL}/api/3/contactLists`;
    const payload = {
        contactList: { list: listId, contact: contactId, status: status }
    };
    try {
        logs.push(`Adding contact ${contactId} to list ${listId} (status=${status})`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.contactList) {
            logs.push(`Contact added to list ${listId} successfully.`);
        } else {
            logs.push(`List response: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        logs.push(`Error adding to list: ${e}`);
    }
}

async function syncEcommerceCustomer(profile, logs) {
    const url = `${AC_API_URL}/api/3/ecomCustomers`;
    const payload = {
        ecomCustomer: {
            connectionid: AC_CONNECTION_ID,
            externalid: profile.outseta_person_uid,
            email: profile.email,
            acceptsMarketing: 1,
        }
    };
    try {
        logs.push(`Syncing Customer: ${profile.email}`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ecomCustomer) return data.ecomCustomer.id;
        // Fallback: fetch existing customer
        logs.push(`Customer create failed, trying GET fallback...`);
        const getUrl = `${AC_API_URL}/api/3/ecomCustomers?filters[email]=${encodeURIComponent(profile.email)}`;
        const getRes = await fetch(getUrl, {
            method: 'GET',
            headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' }
        });
        const getData = await getRes.json();
        if (getData.ecomCustomers && getData.ecomCustomers.length > 0) {
            logs.push(`Found existing customer: ${getData.ecomCustomers[0].id}`);
            return getData.ecomCustomers[0].id;
        }
        logs.push(`Customer sync failed: ${JSON.stringify(data)}`);
        return null;
    } catch (e) {
        logs.push(`Error syncing customer: ${e}`);
        return null;
    }
}

async function syncTags(contactId, profile, logs) {
    // Tag application placeholder
}

async function syncEcommerceOrder(profile, customerId, logs) {
    const url = `${AC_API_URL}/api/3/ecomOrders`;
    const externalId = `${profile.outseta_account_id}-${profile.plan_uid}`;
    let price = 0;
    switch (profile.subscription_tier) {
        case 'pro': price = 4900; break;
        case 'elite': price = 9900; break;
        case 'agency': price = 29900; break;
    }
    const payload = {
        ecomOrder: {
            externalid: externalId,
            source: 1,
            email: profile.email,
            orderNumber: externalId,
            totalPrice: price,
            currency: 'USD',
            connectionid: AC_CONNECTION_ID,
            customerid: customerId,
            orderDate: new Date().toISOString(),
            orderProducts: [{
                name: profile.plan_name || 'Membership',
                price: price,
                quantity: 1,
                externalid: profile.plan_uid
            }]
        }
    };
    try {
        logs.push(`Syncing Order: ${externalId}`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ecomOrder) return data.ecomOrder.id;
        // Fallback: fetch existing order by externalid
        logs.push(`Order create failed, trying GET fallback...`);
        const getUrl = `${AC_API_URL}/api/3/ecomOrders?filters[externalid]=${encodeURIComponent(externalId)}`;
        const getRes = await fetch(getUrl, {
            method: 'GET',
            headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' }
        });
        const getData = await getRes.json();
        if (getData.ecomOrders && getData.ecomOrders.length > 0) {
            logs.push(`Found existing order: ${getData.ecomOrders[0].id}`);
            return getData.ecomOrders[0].id;
        }
        logs.push(`Order sync failed: ${JSON.stringify(data)}`);
        return null;
    } catch (e) {
        logs.push(`Error syncing order: ${e}`);
        return null;
    }
}

async function syncRecurringPayment(profile, customerId, orderId, contactId, logs) {
    // GraphQL endpoint: same base URL as REST + /graphql
    const gqlUrl = `${AC_API_URL}/graphql`;

    // Use outseta_account_id as the unique storeRecurringPaymentId
    const storeRecurringPaymentId = profile.outseta_account_id || profile.outseta_person_uid;

    const mutation = `
        mutation ecomOrderRecurringPaymentCreate($recurringPayment: EcomOrderRecurringPaymentCreateInput!) {
            ecomOrderRecurringPaymentCreate(input: $recurringPayment) {
                recurringPayment {
                    id
                    storeRecurringPaymentId
                    status
                }
                errors {
                    message
                    path
                }
            }
        }
    `;

    let status = 'ACTIVE';
    if (profile.subscription_status === 'canceled') status = 'CANCELLED';
    if (profile.subscription_status === 'past_due') status = 'PAYMENT_FAILED';
    if (profile.subscription_status === 'paused') status = 'PAUSED';

    let amount = 0;
    switch (profile.subscription_tier) {
        case 'pro': amount = 4900; break;
        case 'elite': amount = 9900; break;
        case 'agency': amount = 29900; break;
    }

    const variables = {
        recurringPayment: {
            legacyConnectionId: AC_CONNECTION_ID,
            storeRecurringPaymentId: storeRecurringPaymentId,
            storeCustomerId: profile.outseta_person_uid,
            email: profile.email,
            originOrderId: `${profile.outseta_account_id}-${profile.plan_uid}`,
            lineItems: [{
                storePrimaryId: profile.plan_uid,
                name: profile.plan_name || 'Membership',
                price: amount,
                quantity: 1,
                currency: 'USD',
            }],
            status: status,
            billingInterval: 'month',
            billingIntervalCount: profile.billing_renewal_term || 1,
            paymentAmount: amount,
            currency: 'USD',
            startDate: profile.subscription_start_date,
            nextPaymentDate: profile.subscription_end_date,
        }
    };

    try {
        logs.push(`Syncing Recurring Payment (GraphQL) to ${gqlUrl}`);
        logs.push(`storeRecurringPaymentId: ${storeRecurringPaymentId}`);
        const res = await fetch(gqlUrl, {
            method: 'POST',
            headers: {
                'Api-Token': AC_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: mutation, variables })
        });
        const data = await res.json();
        if (data.errors && data.errors.length > 0) {
            logs.push(`GQL Errors: ${JSON.stringify(data.errors)}`);
        } else if (data.data?.ecomOrderRecurringPaymentCreate?.recurringPayment) {
            const rp = data.data.ecomOrderRecurringPaymentCreate.recurringPayment;
            logs.push(`Recurring Payment Synced. ID: ${rp.id}, Status: ${rp.status}`);
        } else if (data.data?.ecomOrderRecurringPaymentCreate?.errors?.length > 0) {
            logs.push(`GQL Mutation Errors: ${JSON.stringify(data.data.ecomOrderRecurringPaymentCreate.errors)}`);
        } else {
            logs.push(`GQL Response: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        logs.push(`Error syncing Recurring Payment: ${e}`);
    }
}

// --- EXECUTION ---

const mockProfile = {
    outseta_person_uid: 'test-person-123',
    outseta_account_id: 'test-account-456',
    user_email: 'antigravity-test@example.com',
    email: 'antigravity-test@example.com',
    first_name: 'Antigravity',
    last_name: 'TestUser',
    full_name: 'Antigravity TestUser',
    display_name: 'Antigravity TestUser',
    phone: '555-0199',
    subscription_tier: 'pro',
    subscription_status: 'active',
    subscription_start_date: new Date().toISOString(),
    subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    plan_uid: 'plan-pro-monthly',
    plan_name: 'Pro Monthly',
    billing_renewal_term: 1,
    outseta_created_at: new Date().toISOString(),
    outseta_updated_at: new Date().toISOString(),
    outseta_data: {},
    last_login_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
};

async function runTest() {
    console.log("=== AC SYNC TEST ===");
    console.log(`Profile: ${mockProfile.email}`);
    console.log(`AC_API_URL: ${AC_API_URL}`);
    console.log();

    try {
        const result = await syncFullProfileDeepData(mockProfile);
        console.log("=== SYNC LOGS ===");
        result.logs.forEach(log => console.log(`  ${log}`));
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

runTest();
