require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const OUTSETA_DOMAIN = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com';
const OUTSETA_URL = `https://${OUTSETA_DOMAIN}/api/v1`;
const OUTSETA_API_KEY = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY;
const OUTSETA_API_SECRET = process.env.OUTSETA_API_SECRET;
const OUTSETA_AUTH = `${OUTSETA_API_KEY}:${OUTSETA_API_SECRET}`;

// Minimal test payload
const testPayload = {
    Account: {
        Name: "Test Migration User",
        AccountStage: 3
    },
    Person: {
        Email: "test-migration-delete-me@example.com",
        FirstName: "Test",
        LastName: "Migration"
    },
    Subscriptions: [
        {
            Plan: { Uid: "pWrBRnWn" },
            Discount: { Uid: "ZmNpN292" }
        }
    ],
    SendWelcomeEmail: false
};

async function testApi() {
    const apiUrl = `${OUTSETA_URL}/crm/accounts`;
    console.log("Testing POST to:", apiUrl);
    console.log("Auth header:", `Outseta ${OUTSETA_AUTH.substring(0, 10)}...`);
    console.log("Payload:", JSON.stringify(testPayload, null, 2));

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Outseta ${OUTSETA_AUTH}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
    });

    const body = await res.text();

    // Write to file to avoid terminal truncation
    fs.writeFileSync('outseta_test_response.json', JSON.stringify({
        status: res.status,
        statusText: res.statusText,
        body: body
    }, null, 2));

    console.log("\nStatus:", res.status, res.statusText);
    console.log("Full response saved to outseta_test_response.json");
}

testApi();
