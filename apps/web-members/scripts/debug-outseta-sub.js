require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const OUTSETA_DOMAIN = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com';
const OUTSETA_URL = `https://${OUTSETA_DOMAIN}/api/v1`;
const OUTSETA_API_KEY = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY;
const OUTSETA_API_SECRET = process.env.OUTSETA_API_SECRET;
const OUTSETA_AUTH = `${OUTSETA_API_KEY}:${OUTSETA_API_SECRET}`;

const PERSON_UID = 'W4JJE1VQ';

async function run() {
    // 1. Get the account UID for this person
    console.log('Step 1: Getting person to find account UID...');
    const personRes = await fetch(`${OUTSETA_URL}/crm/people/${PERSON_UID}?fields=*,PersonAccount.Account.Uid`, {
        headers: { 'Authorization': `Outseta ${OUTSETA_AUTH}` }
    });
    const personData = await personRes.json();

    const accountUid = personData.PersonAccount?.[0]?.Account?.Uid;
    console.log('Account UID:', accountUid);

    if (!accountUid) {
        console.log('No account found. Full person data:');
        fs.writeFileSync('person_debug.json', JSON.stringify(personData, null, 2));
        return;
    }

    // 2. Get the account to see current subscriptions
    console.log('\nStep 2: Getting account to see subscription status...');
    const accountRes = await fetch(`${OUTSETA_URL}/crm/accounts/${accountUid}?fields=*,CurrentSubscription.*`, {
        headers: { 'Authorization': `Outseta ${OUTSETA_AUTH}` }
    });
    const accountData = await accountRes.json();

    console.log('Account Name:', accountData.Name);
    console.log('CurrentSubscription:', JSON.stringify(accountData.CurrentSubscription, null, 2));

    fs.writeFileSync('account_debug.json', JSON.stringify(accountData, null, 2));
    console.log('\nFull account data saved to account_debug.json');

    // 3. Try adding a subscription via the billing/subscriptions endpoint
    console.log('\nStep 3: Adding subscription via billing endpoint...');
    const subPayload = {
        Account: { Uid: accountUid },
        Plan: { Uid: 'pWrBRnWn' },  // Founder Plan
        BillingRenewalTerm: 1
    };

    const subRes = await fetch(`${OUTSETA_URL}/billing/subscriptions`, {
        method: 'POST',
        headers: {
            'Authorization': `Outseta ${OUTSETA_AUTH}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subPayload)
    });

    const subBody = await subRes.text();
    console.log('Subscription Status:', subRes.status);

    fs.writeFileSync('subscription_response.json', JSON.stringify({
        status: subRes.status,
        body: subBody
    }, null, 2));
    console.log('Response saved to subscription_response.json');
}

run();
