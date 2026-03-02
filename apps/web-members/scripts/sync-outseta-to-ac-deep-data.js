/**
 * scripts/sync-outseta-to-ac-deep-data.js
 * 
 * Performs a historical sync of subscription data (Orders & Recurring Payments)
 * from Outseta to ActiveCampaign for the 66 migrated members.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');

// CONFIG
const OUTSETA_DOMAIN = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com';
const OUTSETA_URL = `https://${OUTSETA_DOMAIN}/api/v1`;
const OUTSETA_API_KEY = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY;
const OUTSETA_API_SECRET = process.env.OUTSETA_API_SECRET;
const OUTSETA_AUTH = `${OUTSETA_API_KEY}:${OUTSETA_API_SECRET}`;

const AC_API_URL = process.env.AC_API_URL || 'https://awilliams.api-us1.com';
const AC_API_KEY = process.env.AC_API_KEY;
const AC_CONNECTION_ID = process.env.AC_CONNECTION_ID || '4';

const WIX_CSV_PATH = 'C:/Users/Mother/Projects/nested-objects-starter/contacts (7).csv';

async function fetchOutsetaData(email) {
    const url = `${OUTSETA_URL}/crm/people?Email=${encodeURIComponent(email)}&fields=*,PersonAccount.Account.Uid,PersonAccount.Account.AccountStage,PersonAccount.Account.CurrentSubscription.*,PersonAccount.Account.CurrentSubscription.Plan.*`;
    const res = await fetch(url, {
        headers: { 'Authorization': `Outseta ${OUTSETA_AUTH}` }
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Outseta API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const person = data.items?.[0];
    if (!person) return null;

    const account = person.PersonAccount?.[0]?.Account;
    const subscription = account?.CurrentSubscription;
    const plan = subscription?.Plan;

    // Map to ProfileUpdateData structure
    return {
        outseta_person_uid: person.Uid,
        outseta_account_id: account?.Uid || null,
        email: email,
        first_name: person.FirstName || '',
        last_name: person.LastName || '',
        subscription_tier: 'founders', // Same as migration
        subscription_status: 'active',
        subscription_start_date: subscription?.StartDate || new Date().toISOString(),
        subscription_end_date: subscription?.RenewalDate || null,
        plan_uid: plan?.Uid || 'pWrBRnWn',
        plan_name: plan?.Name || 'Founders Directory Annual. Grandfathered',
        billing_renewal_term: subscription?.BillingRenewalTerm || 1,
        outseta_data: person
    };
}

// REPLICATED AC SYNC LOGIC
async function syncEcommerceCustomer(profile) {
    const url = `${AC_API_URL}/api/3/ecomCustomers`;
    const payload = {
        ecomCustomer: {
            connectionid: AC_CONNECTION_ID,
            externalid: profile.outseta_person_uid,
            email: profile.email,
            acceptsMarketing: 1,
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.ecomCustomer) return data.ecomCustomer.id;

    // Fallback GET - MUST filter by connectionid to avoid legacy Wix customer records (connectionid: 0)
    const getUrl = `${AC_API_URL}/api/3/ecomCustomers?filters[email]=${encodeURIComponent(profile.email)}&filters[connectionid]=${AC_CONNECTION_ID}`;
    const getRes = await fetch(getUrl, { headers: { 'Api-Token': AC_API_KEY } });
    const getData = await getRes.json();
    return getData.ecomCustomers?.[0]?.id || null;
}

async function syncEcommerceOrder(profile, customerId) {
    const url = `${AC_API_URL}/api/3/ecomOrders`;
    const externalId = `${profile.outseta_account_id}-${profile.plan_uid}`;

    // 1. Check if exists
    const getUrl = `${AC_API_URL}/api/3/ecomOrders?filters[externalid]=${encodeURIComponent(externalId)}`;
    const getRes = await fetch(getUrl, { headers: { 'Api-Token': AC_API_KEY } });
    const getData = await getRes.json();
    const existing = getData.ecomOrders?.[0];

    // 2. If exists but WRONG customer/connection, DELETE it
    if (existing && existing.customerid !== customerId.toString()) {
        console.log(`   🔄 Repair: Deleting order ${existing.id} (linked to wrong customer ${existing.customerid})`);
        await fetch(`${AC_API_URL}/api/3/ecomOrders/${existing.id}`, {
            method: 'DELETE',
            headers: { 'Api-Token': AC_API_KEY }
        });
    } else if (existing) {
        return existing.id; // Already correct
    }

    // 3. Create/Re-create
    const payload = {
        ecomOrder: {
            externalid: externalId,
            source: 1,
            email: profile.email,
            orderNumber: externalId,
            totalPrice: 3700, // $37.00
            currency: 'USD',
            connectionid: AC_CONNECTION_ID,
            customerid: customerId,
            orderDate: new Date().toISOString(),
            orderProducts: [{
                name: profile.plan_name,
                price: 3700,
                quantity: 1,
                externalid: profile.plan_uid
            }]
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.ecomOrder?.id || null;
}

async function syncRecurringPayment(profile, customerId, orderId) {
    const gqlUrl = `${AC_API_URL}/api/3/ecom/graphql`;
    const storeRecurringPaymentId = profile.outseta_account_id || profile.outseta_person_uid;

    const mutation = `
        mutation bulkUpsertRecurringPayments($recurringPayments: [RecurringPaymentInput]) {
            bulkUpsertRecurringPayments(recurringPayments: $recurringPayments) {
                recordId
            }
        }
    `;

    const safeStartDate = profile.subscription_start_date;
    let safeEndDate = profile.subscription_end_date;
    if (!safeEndDate) {
        const d = new Date(safeStartDate);
        d.setMonth(d.getMonth() + 1);
        safeEndDate = d.toISOString();
    }

    const variables = {
        recurringPayments: [{
            legacyConnectionId: parseInt(AC_CONNECTION_ID, 10),
            storeRecurringPaymentId: storeRecurringPaymentId,
            storeCustomerId: profile.outseta_person_uid,
            email: profile.email,
            name: profile.plan_name,
            normalizedStatus: 'ACTIVE',
            storeStatus: 'active',
            originOrderId: `${profile.outseta_account_id}-${profile.plan_uid}`,
            billingInterval: 'YEARLY', // Founders are Annual
            billingIntervalCount: 1,
            paymentAmount: 37,
            currency: 'USD',
            startDate: safeStartDate,
            nextPaymentDate: safeEndDate,
            lineItemNames: [profile.plan_name],
            lineItemStorePrimaryIds: [profile.plan_uid],
        }]
    };

    const res = await fetch(gqlUrl, {
        method: 'POST',
        headers: {
            'Api-Token': AC_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: mutation, variables })
    });
    return await res.json();
}

// MAIN LOOP
async function runSync() {
    const emails = [];

    // 1. Get emails from CSV
    await new Promise((resolve) => {
        fs.createReadStream(WIX_CSV_PATH)
            .pipe(csv())
            .on('data', (row) => {
                const email = row['Email 1'] || row['Email 2'];
                const labels = row['Labels'] ? row['Labels'].toLowerCase() : '';
                const lastActivity = row['Last Activity'] ? row['Last Activity'].toLowerCase() : '';
                const position = row['Position'];

                // Same logic as migration script
                const isPaid = (position && position.trim().startsWith('Choice')) &&
                    (labels.includes('vetted firms direcfory') || lastActivity.includes('purchased pricing plan'));

                if (email && isPaid) {
                    emails.push(email.toLowerCase().trim());
                }
            })
            .on('end', resolve);
    });

    console.log(`Found ${emails.length} emails to sync.`);

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        console.log(`[${i + 1}/${emails.length}] Syncing: ${email}`);

        try {
            const profile = await fetchOutsetaData(email);
            if (!profile || !profile.outseta_account_id) {
                console.log(`   ⚠️ Skip: No Outseta account found for ${email}`);
                continue;
            }

            // Sync Customer
            const customerId = await syncEcommerceCustomer(profile);
            if (!customerId) {
                console.log(`   ❌ Fail: No AC Customer ID`);
                continue;
            }

            // Sync Order
            const orderId = await syncEcommerceOrder(profile, customerId);
            if (!orderId) {
                console.log(`   ❌ Fail: No AC Order ID`);
                continue;
            }

            // Sync Recurring Payment
            const rpRes = await syncRecurringPayment(profile, customerId, orderId);
            if (rpRes.data?.bulkUpsertRecurringPayments?.recordId) {
                console.log(`   ✅ Success: Deep Data Synced (RP ID: ${rpRes.data.bulkUpsertRecurringPayments.recordId})`);
            } else {
                console.log(`   ⚠️ Partial: Order synced, but RP failed: ${JSON.stringify(rpRes.errors || rpRes)}`);
            }

        } catch (err) {
            console.error(`   ❌ Error: ${err.message}`);
        }

        // Throttle to avoid AC rate limits
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n--- SYNC COMPLETE ---');
}

runSync();
