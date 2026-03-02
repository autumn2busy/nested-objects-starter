require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const OUTSETA_DOMAIN = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com';
const OUTSETA_URL = `https://${OUTSETA_DOMAIN}/api/v1`;
const OUTSETA_API_KEY = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY;
const OUTSETA_API_SECRET = process.env.OUTSETA_API_SECRET;
const OUTSETA_AUTH = `${OUTSETA_API_KEY}:${OUTSETA_API_SECRET}`;

const ACCOUNT_UID = 'z9MdxGLQ';
const PLAN_UID = 'pWrBRnWn';
const DISCOUNT_UID = 'ZmNpN292';

async function run() {
    const headers = {
        'Authorization': `Outseta ${OUTSETA_AUTH}`,
        'Content-Type': 'application/json'
    };

    // Attempt 1: PUT account with CurrentSubscription
    console.log('--- Attempt 1: PUT /crm/accounts/{uid} with CurrentSubscription ---');
    const payload1 = {
        CurrentSubscription: {
            Plan: { Uid: PLAN_UID },
            BillingRenewalTerm: 1
        }
    };
    const res1 = await fetch(`${OUTSETA_URL}/crm/accounts/${ACCOUNT_UID}`, {
        method: 'PUT', headers, body: JSON.stringify(payload1)
    });
    console.log('Status:', res1.status);
    const body1 = await res1.text();
    fs.writeFileSync('sub_attempt1.json', body1);

    // Check after
    const check1 = await fetch(`${OUTSETA_URL}/crm/accounts/${ACCOUNT_UID}?fields=CurrentSubscription.*`, {
        headers: { 'Authorization': `Outseta ${OUTSETA_AUTH}` }
    });
    const data1 = await check1.json();
    console.log('CurrentSubscription after PUT:', data1.CurrentSubscription ? 'EXISTS' : 'null');

    // Attempt 2: POST /billing/subscriptions/firsttimesubscription
    console.log('\n--- Attempt 2: POST /billing/subscriptions/firsttimesubscription ---');
    const payload2 = {
        Account: { Uid: ACCOUNT_UID },
        Plan: { Uid: PLAN_UID },
        BillingRenewalTerm: 1
    };
    const res2 = await fetch(`${OUTSETA_URL}/billing/subscriptions/firsttimesubscription`, {
        method: 'PUT', headers, body: JSON.stringify(payload2)
    });
    console.log('Status:', res2.status);
    const body2 = await res2.text();
    fs.writeFileSync('sub_attempt2.json', body2);

    // Attempt 3: PUT /billing/subscriptions with full payload
    console.log('\n--- Attempt 3: PUT /billing/subscriptions ---');
    const payload3 = {
        Account: { Uid: ACCOUNT_UID },
        Plan: { Uid: PLAN_UID },
        BillingRenewalTerm: 1,
        DiscountCouponSubscriptions: [
            { DiscountCoupon: { Uid: DISCOUNT_UID } }
        ]
    };
    const res3 = await fetch(`${OUTSETA_URL}/billing/subscriptions`, {
        method: 'PUT', headers, body: JSON.stringify(payload3)
    });
    console.log('Status:', res3.status);
    const body3 = await res3.text();
    fs.writeFileSync('sub_attempt3.json', body3);

    // Attempt 4: POST /billing/subscriptions/firsttimesubscription
    console.log('\n--- Attempt 4: POST /billing/subscriptions/firsttimesubscription ---');
    const res4 = await fetch(`${OUTSETA_URL}/billing/subscriptions/firsttimesubscription`, {
        method: 'POST', headers, body: JSON.stringify(payload3)
    });
    console.log('Status:', res4.status);
    const body4 = await res4.text();
    fs.writeFileSync('sub_attempt4.json', body4);

    console.log('\nAll responses saved to sub_attempt*.json files');
}

run();
