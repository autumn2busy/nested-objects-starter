
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Polyfill crypto for Supabase
if (!global.crypto) {
    global.crypto = require('crypto').webcrypto;
}


// --- INLINED DEPENDENCIES ---

function createServiceRoleClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase URL or Key");
        // Mock client if missing credentials for test
        // return createClient('https://placeholder.supabase.co', 'placeholder');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

const AC_API_URL = process.env.AC_API_URL;
const AC_API_KEY = process.env.AC_API_KEY;
const AC_CONNECTION_ID = process.env.AC_CONNECTION_ID;

interface SyncResult {
    logs: string[];
}

interface ProfileUpdateData {
    outseta_person_uid: string;
    outseta_account_id: string | null;
    user_email: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    display_name: string | null;
    phone: string | null;
    subscription_tier: 'free' | 'pro' | 'elite' | 'agency';
    subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
    subscription_start_date: string | null;
    subscription_end_date: string | null;
    plan_uid: string | null;
    plan_name: string | null;
    billing_renewal_term: number | null;
    outseta_created_at: string | null;
    outseta_updated_at: string | null;
    outseta_data: object;
    last_login_at: string | null;
    last_active_at: string;
}

// --- SYNC LOGIC ---

async function syncFullProfileDeepData(profile: ProfileUpdateData): Promise<SyncResult> {
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

        // 1. Sync Contact
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
            return data.contact.id;
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
            logs.push(`AC Customer Sync response: ${JSON.stringify(data)}`);
            return null;
        }
    } catch (e) {
        logs.push(`Error syncing customer: ${e}`);
        return null;
    }
}

async function syncTags(contactId: string, profile: ProfileUpdateData, logs: string[]) {
    const tierTag = `plan-${profile.subscription_tier}`;
    await addTagToContact(contactId, tierTag, logs);
    await addTagToContact(contactId, 'antigravity-subscription', logs);
    if (profile.subscription_status) {
        await addTagToContact(contactId, `status-${profile.subscription_status}`, logs);
    }
}

async function addTagToContact(contactId: string, tagName: string, logs: string[]) {
    // logs.push(`Calculated Tag: ${tagName}`);
}

async function syncEcommerceOrder(profile: ProfileUpdateData, customerId: string, logs: string[]): Promise<string | null> {
    const url = `${AC_API_URL}/api/3/ecomOrders`;
    const externalId = `${profile.outseta_account_id}-${profile.plan_uid}`;

    let price = 0;
    switch (profile.subscription_tier) {
        case 'pro': price = 4900; break;
        case 'elite': price = 9900; break;
        case 'agency': price = 29900; break;
        default: price = 0;
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
        logs.push(`AC Order Sync response: ${JSON.stringify(data)}`);
        return null;
    } catch (e) {
        logs.push(`Error syncing order: ${e}`);
        return null;
    }
}

async function syncRecurringPayment(profile: ProfileUpdateData, customerId: string, orderId: string, contactId: string, logs: string[]) {
    const gqlUrl = `${AC_API_URL}/api/3/graphql`;

    // Simplified mutation
    const mutation = `
        mutation CreateRecurringPayment($payment: RecurringPaymentInput!) {
            createRecurringPayment(input: $payment) {
                recurringPayment {
                    id
                }
                errors {
                    message
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
        payment: {
            legacyConnectionId: AC_CONNECTION_ID,
            storeRecurringPaymentId: profile.outseta_account_id,
            storeCustomerId: profile.outseta_person_uid,
            email: profile.email,
            originOrderId: `${profile.outseta_account_id}-${profile.plan_uid}`,
            lineItemStorePrimaryId: profile.plan_uid,
            status: status,
            billingInterval: 'month',
            billingIntervalCount: 1,
            paymentAmount: amount,
            currency: 'USD',
            startDate: profile.subscription_start_date,
            nextPaymentDate: profile.subscription_end_date,
        }
    };

    try {
        logs.push("Syncing Recurring Payment (GraphQL)");
        const res = await fetch(gqlUrl, {
            method: 'POST',
            headers: {
                'Api-Token': AC_API_KEY!,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: mutation, variables })
        });

        const data = await res.json();
        if (data.errors) {
            logs.push(`GQL Errors: ${JSON.stringify(data.errors)}`);
        } else if (data.data) {
            logs.push(`Recurring Payment Synced. ID: ${data.data.createRecurringPayment?.recurringPayment?.id}`);
        } else {
            logs.push(`GQL Response: ${JSON.stringify(data)}`);
        }

    } catch (e) {
        logs.push(`Error syncing Recurring Payment: ${e}`);
    }
}

// --- EXECUTION ---

const mockProfile: ProfileUpdateData = {
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
    console.log("Starting AC Sync Test...");
    console.log("Mock Profile:", mockProfile.email);

    try {
        const result = await syncFullProfileDeepData(mockProfile);
        console.log("Sync Result Logs:");
        result.logs.forEach(log => console.log(`[LOG] ${log}`));
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

runTest();
