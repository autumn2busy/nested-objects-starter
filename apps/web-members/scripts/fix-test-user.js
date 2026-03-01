require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const OUTSETA_DOMAIN = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com';
const OUTSETA_URL = `https://${OUTSETA_DOMAIN}/api/v1`;
const OUTSETA_API_KEY = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY;
const OUTSETA_API_SECRET = process.env.OUTSETA_API_SECRET;
const OUTSETA_AUTH = `${OUTSETA_API_KEY}:${OUTSETA_API_SECRET}`;

// Correct person UID (double J)
const PERSON_UID = 'W4JJE1VQ';

async function updatePerson() {
    // Attempt 1: Flat Persona key + FirstName/LastName  
    const payload = {
        FirstName: 'Mary',
        LastName: 'Gonce',
        Persona: 'persona-new-inspector'
    };

    console.log(`Attempt 1: PUT /crm/people/${PERSON_UID} with flat Persona key`);
    const res = await fetch(`${OUTSETA_URL}/crm/people/${PERSON_UID}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Outseta ${OUTSETA_AUTH}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const body = await res.text();
    console.log('Status:', res.status);

    if (res.ok) {
        const parsed = JSON.parse(body);
        console.log('FirstName:', parsed.FirstName);
        console.log('LastName:', parsed.LastName);
        console.log('Persona:', parsed.Persona);

        if (!parsed.Persona) {
            console.log('\n--- Flat Persona key not saved. Now trying Attempt 2... ---\n');

            // Attempt 2: Try getting the person first to see all fields
            console.log('Fetching person to see field structure...');
            const getRes = await fetch(`${OUTSETA_URL}/crm/people/${PERSON_UID}`, {
                headers: { 'Authorization': `Outseta ${OUTSETA_AUTH}` }
            });
            const getParsed = JSON.parse(await getRes.text());

            // Log keys that look like custom fields
            const keys = Object.keys(getParsed);
            console.log('All top-level keys:', keys.join(', '));

            // Save full response for inspection
            fs.writeFileSync('person_full.json', JSON.stringify(getParsed, null, 2));
            console.log('Full person data saved to person_full.json');
        }
    } else {
        console.log('Error:', body.substring(0, 500));
    }
}

updatePerson();
