require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const OUTSETA_DOMAIN = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com';
const OUTSETA_URL = `https://${OUTSETA_DOMAIN}/api/v1`;
const OUTSETA_API_KEY = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY;
const OUTSETA_API_SECRET = process.env.OUTSETA_API_SECRET;
const OUTSETA_AUTH = `${OUTSETA_API_KEY}:${OUTSETA_API_SECRET}`;

const PERSON_UID = 'W4JJE1VQ';

async function tryFormats() {
    const results = {};

    // Attempt A: Use Persona as a select option value (the display value)
    console.log('--- Attempt A: Persona as select display value "New Inspector" ---');
    const resA = await fetch(`${OUTSETA_URL}/crm/people/${PERSON_UID}`, {
        method: 'PUT',
        headers: { 'Authorization': `Outseta ${OUTSETA_AUTH}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ Persona: 'New Inspector' })
    });
    results.A = { status: resA.status, body: await resA.text() };
    console.log('Status:', resA.status);

    // Check if it stuck
    const checkA = await fetch(`${OUTSETA_URL}/crm/people/${PERSON_UID}?fields=Persona,FirstName,LastName`, {
        headers: { 'Authorization': `Outseta ${OUTSETA_AUTH}` }
    });
    const dataA = JSON.parse(await checkA.text());
    console.log('Persona after A:', dataA.Persona);
    results.A_check = dataA.Persona;

    // Attempt B: Persona as integer index (1-based, like a select option)
    console.log('\n--- Attempt B: Persona as integer 1 ---');
    const resB = await fetch(`${OUTSETA_URL}/crm/people/${PERSON_UID}`, {
        method: 'PUT',
        headers: { 'Authorization': `Outseta ${OUTSETA_AUTH}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ Persona: 1 })
    });
    results.B = { status: resB.status };
    console.log('Status:', resB.status);

    const checkB = await fetch(`${OUTSETA_URL}/crm/people/${PERSON_UID}?fields=Persona`, {
        headers: { 'Authorization': `Outseta ${OUTSETA_AUTH}` }
    });
    const dataB = JSON.parse(await checkB.text());
    console.log('Persona after B:', dataB.Persona);
    results.B_check = dataB.Persona;

    fs.writeFileSync('custom_field_test.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to custom_field_test.json');
}

tryFormats();
