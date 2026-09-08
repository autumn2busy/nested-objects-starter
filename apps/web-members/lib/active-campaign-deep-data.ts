import type { ProfileUpdateData } from '@/app/api/webhooks/outseta/route';
import { env } from '@/lib/env';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { AcSyncError, AcSyncRun, type SyncResult } from '@/lib/active-campaign-sync-result';

const AC_API_URL = env.acApiUrl;
const AC_API_KEY = env.acApiKey;
const AC_CONNECTION_ID = env.acConnectionId;
const AC_MEMBERSHIP_RENEWAL_FIELD_ID = env.acMembershipRenewalFieldId || '187';

type BillingInterval = 'MONTHLY' | 'YEARLY';

interface StoredMembershipContext {
    ac_contact_id?: string | null;
    ac_customer_id?: string | null;
    outseta_account_id?: string | null;
    subscription_tier?: ProfileUpdateData['subscription_tier'] | null;
    subscription_start_date?: string | null;
    subscription_end_date?: string | null;
    plan_uid?: string | null;
    plan_name?: string | null;
    billing_renewal_term?: number | null;
}

const PAID_TIERS = new Set(['starter', 'founders', 'pro', 'elite', 'agency']);

function isPaidTier(profile: ProfileUpdateData) {
    return PAID_TIERS.has(profile.subscription_tier);
}

function isStoredPaidTier(tier?: ProfileUpdateData['subscription_tier'] | null) {
    return !!tier && tier !== 'free';
}

function hasConcretePlan(profile: ProfileUpdateData) {
    const subscription = getOutsetaSubscription(profile);
    return Boolean(profile.plan_uid || profile.plan_name || subscription?.Plan?.Uid || subscription?.Plan?.Name);
}

function shouldSyncPlanTag(profile: ProfileUpdateData) {
    return profile.subscription_tier !== 'free' || hasConcretePlan(profile);
}

function getOutsetaSubscription(profile: ProfileUpdateData): any {
    const rawData = profile.outseta_data as any;

    if (rawData?.CurrentSubscription || rawData?.LatestSubscription) {
        return rawData.CurrentSubscription || rawData.LatestSubscription;
    }

    const personAccount = rawData?.PersonAccount?.find((pa: any) => pa.IsPrimary)
        || rawData?.PersonAccount?.[0];
    const account = personAccount?.Account;

    return account?.CurrentSubscription || account?.LatestSubscription || null;
}

function getRecurringPaymentId(profile: ProfileUpdateData) {
    const subscription = getOutsetaSubscription(profile);
    return subscription?.Uid || profile.outseta_account_id || profile.outseta_person_uid;
}

function getOriginOrderId(profile: ProfileUpdateData) {
    return [profile.outseta_account_id || profile.outseta_person_uid, profile.plan_uid || profile.subscription_tier]
        .filter(Boolean)
        .join('-');
}

function getPlanAmount(profile: ProfileUpdateData) {
    switch (profile.subscription_tier) {
        case 'starter': return 99;
        case 'founders': return 37;
        case 'pro': return 49;
        case 'elite': return 97;
        case 'agency': return 297;
        default: return 0;
    }
}

function getBillingCadence(profile: ProfileUpdateData): { interval: BillingInterval; count: number } {
    if (profile.subscription_tier === 'founders') {
        return { interval: 'YEARLY', count: profile.billing_renewal_term || 1 };
    }

    if (profile.subscription_tier === 'starter') {
        return { interval: 'MONTHLY', count: profile.billing_renewal_term || 3 };
    }

    return { interval: 'MONTHLY', count: profile.billing_renewal_term || 1 };
}

function addBillingInterval(startDate: string, cadence: { interval: BillingInterval; count: number }) {
    const date = new Date(startDate);

    if (cadence.interval === 'YEARLY') {
        date.setFullYear(date.getFullYear() + cadence.count);
    } else {
        date.setMonth(date.getMonth() + cadence.count);
    }

    return date.toISOString();
}

function preserveStoredMembershipContext(
    profile: ProfileUpdateData,
    storedProfile: StoredMembershipContext | null | undefined,
    logs: string[]
): ProfileUpdateData {
    if (!storedProfile || hasConcretePlan(profile) || !isStoredPaidTier(storedProfile.subscription_tier)) {
        return profile;
    }

    logs.push("Preserving stored paid membership context for plan-light Outseta payload");

    return {
        ...profile,
        outseta_account_id: profile.outseta_account_id || storedProfile.outseta_account_id || null,
        subscription_tier: storedProfile.subscription_tier!,
        subscription_start_date: profile.subscription_start_date || storedProfile.subscription_start_date || null,
        subscription_end_date: profile.subscription_end_date || storedProfile.subscription_end_date || null,
        plan_uid: storedProfile.plan_uid || null,
        plan_name: storedProfile.plan_name || null,
        billing_renewal_term: profile.billing_renewal_term || storedProfile.billing_renewal_term || null,
    };
}

function getSubscriptionDates(profile: ProfileUpdateData) {
    const subscription = getOutsetaSubscription(profile);
    const startDate = subscription?.StartDate || profile.subscription_start_date || new Date().toISOString();
    const cadence = getBillingCadence(profile);
    const cadenceRenewalDate = addBillingInterval(startDate, cadence);
    const nextPaymentDate =
        subscription?.RenewalDate
        || profile.subscription_end_date
        || subscription?.EndDate
        || cadenceRenewalDate;

    return { startDate, nextPaymentDate };
}

function isFutureDate(value: string | null) {
    if (!value) return false;
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time > Date.now();
}

function getCancellationDate(profile: ProfileUpdateData, nextPaymentDate: string) {
    if (profile.subscription_status !== 'canceled') return null;

    const subscription = getOutsetaSubscription(profile);
    return subscription?.EndDate
        || profile.subscription_end_date
        || subscription?.RenewalDate
        || nextPaymentDate;
}

function getNormalizedRecurringStatus(profile: ProfileUpdateData) {
    switch (profile.subscription_status) {
        case 'canceled': return 'CANCELLED';
        case 'past_due': return 'PAYMENT_FAILED';
        case 'paused': return 'PAUSED';
        case 'trialing': return 'ACTIVE';
        default: return 'ACTIVE';
    }
}

function formatAcDate(value: string) {
    return new Date(value).toISOString().slice(0, 10);
}

/**
 * Keep the existing webhook's contact/tag/ecommerce path. Membership events
 * carry no marketing opt-in, so this path never writes list consent.
 */
export async function syncFullProfileDeepData(profile: ProfileUpdateData): Promise<SyncResult> {
    const run = new AcSyncRun();
    if (!AC_API_URL || !AC_API_KEY || !AC_CONNECTION_ID) {
        run.record('configuration', 'failed', 'missing_configuration');
        return run.result();
    }

    await run.attempt('orchestration', async () => {
        const supabase = createServiceRoleClient();
        const stored = await run.attempt('profile_context', async () => {
            const { data, error } = await supabase.from('profiles')
                .select('ac_contact_id, ac_customer_id, outseta_person_uid, outseta_account_id, subscription_tier, subscription_start_date, subscription_end_date, plan_uid, plan_name, billing_renewal_term')
                .eq('user_email', profile.user_email).single();
            // The route has already saved this profile. PGRST116 may mean zero
            // OR multiple rows, so it cannot authorize an identity fallback.
            if (error || !data) throw new AcSyncError('profile_read_failed');
            if (data?.outseta_person_uid && data.outseta_person_uid !== profile.outseta_person_uid) {
                throw new AcSyncError('profile_identity_conflict');
            }
            return { profile: data as StoredMembershipContext | null };
        });
        if (!stored) {
            run.record('contact', 'blocked', 'profile_context_unavailable');
            return;
        }
        const dbProfile = stored.profile;
        const syncProfile = preserveStoredMembershipContext(profile, dbProfile, run.logs);
        const contactId = await run.attempt('contact', async () => {
            const id = await syncContact(syncProfile);
            if (dbProfile?.ac_contact_id && String(dbProfile.ac_contact_id) !== id) {
                throw new AcSyncError('contact_identity_conflict');
            }
            return id;
        });
        if (!contactId) {
            run.record('contact_dependents', 'blocked', 'contact_unavailable');
            return;
        }
        if (String(dbProfile?.ac_contact_id ?? '') !== contactId) {
            await run.attempt('contact_link', async () => {
                const { error } = await supabase.from('profiles').update({ ac_contact_id: contactId }).eq('user_email', profile.user_email);
                if (error) throw new AcSyncError('profile_write_failed');
            });
        }
        run.record('list_consent', 'skipped', 'membership_is_not_opt_in');

        const customerId = await run.attempt('customer', () => syncEcommerceCustomer(syncProfile, dbProfile?.ac_customer_id));
        if (customerId && String(dbProfile?.ac_customer_id ?? '') !== customerId) {
            await run.attempt('customer_link', async () => {
                const { error } = await supabase.from('profiles').update({ ac_customer_id: customerId }).eq('user_email', profile.user_email);
                if (error) throw new AcSyncError('profile_write_failed');
            });
        }

        // Customer failure must not prevent independent membership tag sync.
        await syncTags(contactId, syncProfile, run);
        if (!isPaidTier(syncProfile) || !syncProfile.plan_uid) {
            run.record('order', 'skipped', 'free_or_no_plan');
            run.record('recurring', 'skipped', 'free_or_no_plan');
        } else if (!customerId) {
            run.record('order', 'blocked', 'customer_unavailable');
            run.record('recurring', 'blocked', 'customer_unavailable');
        } else {
            await run.attempt('order', () => syncEcommerceOrder(syncProfile, customerId));
            if (!syncProfile.subscription_status) {
                run.record('recurring', 'skipped', 'unknown_lifecycle');
            } else {
                // The GraphQL response is a submission receipt, not proof of completion.
                const submitted = await run.attempt('recurring', () => syncRecurringPayment(syncProfile), 'submitted');
                if (submitted) {
                    await run.attempt('renewal_field', () => syncMembershipRenewalField(contactId, getSubscriptionDates(syncProfile).nextPaymentDate));
                } else {
                    run.record('renewal_field', 'blocked', 'recurring_not_submitted');
                }
            }
        }
    });
    return run.result();
}

async function acRequest(path: string, method = 'GET', body?: unknown): Promise<Response> {
    try {
        return await fetch(`${AC_API_URL}/api/3/${path}`, {
            method, redirect: 'error',
            headers: { 'Api-Token': AC_API_KEY!, 'Content-Type': 'application/json' },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            signal: AbortSignal.timeout(10_000),
        });
    } catch {
        // Includes uncertain write outcomes. A caller must read back before retry.
        throw new AcSyncError('transport_failure');
    }
}

async function readJson(response: Response): Promise<any> {
    if (!response.ok) throw new AcSyncError('http_error', response.status);
    try { return await response.json(); }
    catch { throw new AcSyncError('invalid_response'); }
}

async function acJson(path: string, method = 'GET', body?: unknown): Promise<any> {
    return readJson(await acRequest(path, method, body));
}

function requireId(value: unknown): string {
    if (!/^[1-9]\d*$/.test(String(value ?? ''))) throw new AcSyncError('invalid_response_id');
    return String(value);
}

async function syncContact(profile: ProfileUpdateData): Promise<string> {
    const data = await acJson('contact/sync', 'POST', { contact: {
        email: profile.email, firstName: profile.first_name || '',
        lastName: profile.last_name || '', phone: profile.phone || '',
    } });
    return requireId(data.contact?.id);
}

async function syncEcommerceCustomer(profile: ProfileUpdateData, storedId?: string | null): Promise<string> {
    const matchesIdentity = (customer: any) =>
        String(customer?.externalid) === profile.outseta_person_uid &&
        String(customer?.connectionid) === String(AC_CONNECTION_ID);
    const verifyEmailLink = (customer: any) => {
        // AC attaches an ecommerce customer to a contact by email. This is only
        // a transport consistency check, never evidence of membership authority.
        if (typeof customer?.email !== 'string' || customer.email.trim().toLowerCase() !== profile.email.trim().toLowerCase()) {
            throw new AcSyncError('customer_contact_link_conflict');
        }
    };
    if (storedId) {
        const data = await acJson(`ecomCustomers/${requireId(storedId)}`);
        if (!matchesIdentity(data.ecomCustomer)) throw new AcSyncError('customer_identity_conflict');
        verifyEmailLink(data.ecomCustomer);
        // Do not overwrite existing acceptsMarketing, including unknown/opted-out.
        return requireId(data.ecomCustomer.id);
    }
    const path = `ecomCustomers?filters[externalid]=${encodeURIComponent(profile.outseta_person_uid)}&filters[connectionid]=${encodeURIComponent(AC_CONNECTION_ID!)}&limit=100&offset=0`;
    const find = async () => {
        const data = await acJson(path);
        if (!Array.isArray(data.ecomCustomers) || data.meta?.total == null ||
            !/^\d+$/.test(String(data.meta.total)) ||
            Number(data.meta.total) !== data.ecomCustomers.length) {
            throw new AcSyncError('customer_lookup_incomplete');
        }
        if (data.ecomCustomers.length > 1 || data.ecomCustomers.some((item: any) => !matchesIdentity(item))) {
            throw new AcSyncError('customer_identity_conflict');
        }
        if (data.ecomCustomers[0]) verifyEmailLink(data.ecomCustomers[0]);
        return data.ecomCustomers[0] ? requireId(data.ecomCustomers[0].id) : null;
    };
    const existing = await find();
    if (existing) return existing;

    // New mirrors get no asserted marketing permission. Only an explicit,
    // separately approved consent flow may grant it; this webhook never does.
    const response = await acRequest('ecomCustomers', 'POST', { ecomCustomer: {
        connectionid: AC_CONNECTION_ID, externalid: profile.outseta_person_uid,
        email: profile.email, acceptsMarketing: 0,
    } });
    if ([400, 409, 422].includes(response.status)) {
        const concurrent = await find();
        if (concurrent) return concurrent;
    }
    const data = await readJson(response);
    if (!matchesIdentity(data.ecomCustomer)) throw new AcSyncError('customer_identity_conflict');
    return requireId(data.ecomCustomer.id);
}

interface ContactTag { id: string; tag: string; name: string | null }

async function readContactTags(contactId: string): Promise<ContactTag[]> {
    const data = await acJson(`contacts/${contactId}/contactTags?include=tag`);
    if (!Array.isArray(data.contactTags)) throw new AcSyncError('tag_read_invalid');
    const names = new Map<string, string>();
    if (Array.isArray(data.tags)) {
        for (const tag of data.tags) if (typeof tag.tag === 'string') names.set(String(tag.id), tag.tag);
    }
    return data.contactTags.map((tag: any) => {
        if (String(tag.contact) !== contactId) throw new AcSyncError('tag_identity_conflict');
        return { id: requireId(tag.id), tag: requireId(tag.tag), name: names.get(String(tag.tag)) ?? null };
    });
}

async function syncTags(contactId: string, profile: ProfileUpdateData, run: AcSyncRun) {
    const tagTier = profile.subscription_tier === 'founders' ? 'founder' : profile.subscription_tier;
    const expectedTierTag = shouldSyncPlanTag(profile) ? `plan-${tagTier}` : null;
    const expectedStatusTag = profile.subscription_status ? `status-${profile.subscription_status}` : null;
    const existing = await run.attempt('tag_read', () => readContactTags(contactId));
    // Relationship endpoints have no verified pagination total. Positive matches
    // can prevent redundant writes; missing rows never prove absence.
    for (const [dimension, expected] of [['plan', expectedTierTag], ['status', expectedStatusTag]] as const) {
        if (!expected) {
            run.record(`tag_${dimension}`, 'skipped', 'unknown_membership_dimension');
            continue;
        }
        const added = await run.attempt(`tag_${dimension}`, () => addTagToContact(contactId, expected, existing));
        const conflicts = existing?.filter(tag => tag.name?.toLowerCase().startsWith(dimension + '-') &&
            tag.name.toLowerCase() !== expected.toLowerCase()) ?? [];
        if (!added) {
            if (conflicts.length) run.record(`tag_${dimension}_cleanup`, 'blocked', 'replacement_not_confirmed');
            continue;
        }
        // Preserve the existing narrow cleanup path, but never delete first.
        for (const conflict of conflicts) {
            await run.attempt(`tag_${dimension}_cleanup`, async () => {
                const response = await acRequest(`contactTags/${conflict.id}`, 'DELETE');
                if (!response.ok) throw new AcSyncError('http_error', response.status);
            });
        }
    }
    if (existing?.some(tag => !tag.name)) run.record('tag_cleanup_coverage', 'blocked', 'tag_names_unavailable');
    // Do not call partial relationship coverage a complete historical cleanup.
    run.record('tag_history_coverage', 'skipped', 'unverified_relationship_pagination');
    await run.attempt('tag_membership_source', () => addTagToContact(contactId, 'antigravity-subscription', existing));
    await run.attempt('tag_launch', () => addTagToContact(contactId, 'launch-2026-03-01', existing));

    const rawData = profile.outseta_data as any;
    const primaryPa = rawData?.PersonAccount?.find((pa: any) => pa.IsPrimary) || rawData?.PersonAccount?.[0];
    const customFields = rawData?.CustomFields || primaryPa?.Person?.CustomFields;
    if (customFields?.Persona) {
        const rawPersona = customFields.Persona.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
        await run.attempt('tag_persona', () => addTagToContact(contactId, rawPersona.startsWith('persona-') ? rawPersona : `persona-${rawPersona}`, existing));
    }
    if (customFields?.Migration_Source === 'wix') {
        await run.attempt('tag_migration', () => addTagToContact(contactId, 'migrate', existing));
    }
    const referer = rawData?.Referer || rawData?.referer;
    if (typeof referer === 'string') {
        let source: string | null = null;
        try { source = new URL(referer).searchParams.get('utm_source'); } catch { /* Invalid referrer has no source tag. */ }
        if (source) await run.attempt('tag_utm_source', () => addTagToContact(contactId, `utm-${source}`, existing));
    }
}

async function addTagToContact(contactId: string, tagName: string, existing: ContactTag[] | null): Promise<boolean> {
    const known = existing?.find(tag => tag.name?.toLowerCase() === tagName.toLowerCase());
    if (known) return true;
    const search = await acJson(`tags?search=${encodeURIComponent(tagName)}&limit=100`);
    if (!Array.isArray(search.tags)) throw new AcSyncError('tag_lookup_invalid');
    const matches = search.tags.filter((tag: any) => typeof tag.tag === 'string' && tag.tag.toLowerCase() === tagName.toLowerCase());
    if (matches.length > 1) throw new AcSyncError('tag_lookup_ambiguous');
    let tagId = matches[0] ? requireId(matches[0].id) : null;
    if (!tagId) {
        if (search.meta?.total == null || !/^\d+$/.test(String(search.meta.total)) ||
            Number(search.meta.total) !== search.tags.length) throw new AcSyncError('tag_lookup_incomplete');
        const created = await acJson('tags', 'POST', { tag: { tag: tagName, tagType: 'contact', description: 'Auto-created by sync' } });
        tagId = requireId(created.tag?.id);
    }
    if (existing?.some(tag => tag.tag === tagId)) return true;
    const response = await acRequest('contactTags', 'POST', { contactTag: { contact: contactId, tag: tagId } });
    if ([400, 409, 422].includes(response.status)) {
        // 422 may be validation failure. Only exact positive readback proves it
        // was already applied; an unavailable/partial read cannot prove absence.
        const readback = await readContactTags(contactId);
        if (readback.some(tag => tag.tag === tagId)) return true;
        throw new AcSyncError('tag_association_unconfirmed', response.status);
    }
    const data = await readJson(response);
    requireId(data.contactTag?.id);
    if (String(data.contactTag?.contact) !== contactId || String(data.contactTag?.tag) !== tagId) {
        throw new AcSyncError('tag_association_unconfirmed');
    }
    return true;
}

async function syncEcommerceOrder(profile: ProfileUpdateData, customerId: string): Promise<string> {
    // Existing nominal membership mirror; this is not proof of settled revenue.
    const externalId = `${profile.outseta_account_id}-${profile.plan_uid}`;

    // Pricing Map
    const price = getPlanAmount(profile) * 100;

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


    const response = await acRequest('ecomOrders', 'POST', payload);
    if ([400, 409, 422].includes(response.status)) {
        const data = await acJson(`ecomOrders?filters[externalid]=${encodeURIComponent(externalId)}&filters[connectionid]=${encodeURIComponent(AC_CONNECTION_ID!)}&limit=100`);
        if (!Array.isArray(data.ecomOrders) || data.meta?.total == null ||
            !/^\d+$/.test(String(data.meta.total)) || Number(data.meta.total) !== data.ecomOrders.length) {
            throw new AcSyncError('order_lookup_incomplete');
        }
        const matches = data.ecomOrders.filter((item: any) =>
            String(item.externalid) === externalId && String(item.connectionid) === String(AC_CONNECTION_ID) &&
            String(item.customerid) === customerId);
        if (matches.length === 1 && data.ecomOrders.length === 1) return requireId(matches[0].id);
        throw new AcSyncError('order_identity_unconfirmed', response.status);
    }
    const data = await readJson(response);
    return requireId(data.ecomOrder?.id);
}

async function syncRecurringPayment(profile: ProfileUpdateData): Promise<boolean> {
    // ActiveCampaign E-Commerce GraphQL endpoint

    // Mutation: bulkUpsertRecurringPayments takes [RecurringPaymentInput]
    // Discovered via schema introspection on the live AC GraphQL API.
    const mutation = `
        mutation bulkUpsertRecurringPayments($recurringPayments: [RecurringPaymentInput]) {
            bulkUpsertRecurringPayments(recurringPayments: $recurringPayments) {
                recordId
            }
        }
    `;

    const cadence = getBillingCadence(profile);
    const { startDate, nextPaymentDate } = getSubscriptionDates(profile);
    const cancellationDate = getCancellationDate(profile, nextPaymentDate);
    const storeRecurringPaymentId = getRecurringPaymentId(profile);
    const originOrderId = getOriginOrderId(profile);
    const planName = profile.plan_name || 'Membership';
    const legacyConnectionId = Number.parseInt(AC_CONNECTION_ID!, 10);

    if (!Number.isFinite(legacyConnectionId)) {
        throw new AcSyncError('invalid_connection_id');
    }

    const variables = {
        recurringPayments: [{
            legacyConnectionId,
            storeRecurringPaymentId: storeRecurringPaymentId,
            storeCustomerId: profile.outseta_person_uid,
            email: profile.email,
            name: planName,
            normalizedStatus: getNormalizedRecurringStatus(profile),
            storeStatus: profile.subscription_status || 'active',
            originOrderId,
            billingInterval: cadence.interval,
            billingIntervalCount: cadence.count,
            paymentAmount: getPlanAmount(profile),
            currency: 'USD',
            startDate,
            renewalDate: nextPaymentDate,
            nextPaymentDate,
            anchorDate: startDate,
            storeCreatedDate: startDate,
            storeModifiedDate: profile.outseta_updated_at || new Date().toISOString(),
            isTrial: profile.subscription_status === 'trialing',
            cancelledDate: cancellationDate,
            cancelAtPeriodEnd: profile.subscription_status === 'canceled' && isFutureDate(cancellationDate),
            suppressAutomations: false,
            lineItemNames: [planName],
            lineItemStorePrimaryIds: [profile.plan_uid],
        }]
    };


    const data = await acJson('ecom/graphql', 'POST', { query: mutation, variables });
    if (data.errors?.length) throw new AcSyncError('graphql_error');
    const receipt = data.data?.bulkUpsertRecurringPayments;
    const receipts = Array.isArray(receipt) ? receipt : [receipt];
    if (!receipts.length || receipts.some(item => !item?.recordId)) {
        throw new AcSyncError('recurring_receipt_missing');
    }
    return true;
}


async function syncMembershipRenewalField(contactId: string, nextPaymentDate: string): Promise<void> {
    const fieldValue = formatAcDate(nextPaymentDate);
    const data = await acJson(`contacts/${contactId}/fieldValues`);
    if (!Array.isArray(data.fieldValues)) throw new AcSyncError('field_lookup_invalid');
    const matches = data.fieldValues.filter((item: any) => String(item.field) === String(AC_MEMBERSHIP_RENEWAL_FIELD_ID));
    if (matches.length > 1 || matches.some((item: any) => String(item.contact) !== contactId)) {
        throw new AcSyncError('field_identity_conflict');
    }
    const existing = matches[0];
    if (existing?.value === fieldValue) return;
    // A missing relationship in an unverified page is not proof it is absent.
    if (!existing && (data.meta?.total == null || !/^\d+$/.test(String(data.meta.total)) ||
        Number(data.meta.total) !== data.fieldValues.length)) throw new AcSyncError('field_lookup_incomplete');
    const updated = await acJson(existing ? `fieldValues/${requireId(existing.id)}` : 'fieldValues',
        existing ? 'PUT' : 'POST', { fieldValue: { contact: contactId, field: AC_MEMBERSHIP_RENEWAL_FIELD_ID, value: fieldValue } });
    requireId(updated.fieldValue?.id);
    if (String(updated.fieldValue?.contact) !== contactId || String(updated.fieldValue?.field) !== String(AC_MEMBERSHIP_RENEWAL_FIELD_ID)) {
        throw new AcSyncError('field_write_unconfirmed');
    }
}
