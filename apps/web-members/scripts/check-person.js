require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const OUTSETA_DOMAIN = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com';
const OUTSETA_URL = `https://${OUTSETA_DOMAIN}/api/v1`;
const OUTSETA_API_KEY = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY;
const OUTSETA_API_SECRET = process.env.OUTSETA_API_SECRET;
const OUTSETA_AUTH = `${OUTSETA_API_KEY}:${OUTSETA_API_SECRET}`;

const PERSON_UID = 'W4JJE1VQ';

async function checkPerson() {
    console.log('Fetching person...');
    const res = await fetch(`${OUTSETA_URL}/crm/people/${PERSON_UID}`, {
        headers: { 'Authorization': `Outseta ${OUTSETA_AUTH}` }
    });
    const data = JSON.parse(await res.text());

    fs.writeFileSync('person_check.json', JSON.stringify({
        FirstName: data.FirstName,
        LastName: data.LastName,
        Email: data.Email,
        Persona: data.Persona,
        AllKeys: Object.keys(data)
    }, null, 2));

    console.log('Saved to person_check.json');
}

checkPerson();
