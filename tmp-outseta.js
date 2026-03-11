require('dotenv').config({ path: 'apps/web-members/.env.local' });
const apiKey = process.env.OUTSETA_API_KEY;
const apiSecret = process.env.OUTSETA_API_SECRET;

async function getProfile() {
    const res = await fetch('https://nestedobjects.outseta.com/api/v1/crm/people?Email=autumn.s.williams@gmail.com', {
        headers: {
            'Authorization': `Outseta ${apiKey}:${apiSecret}`,
            'Accept': 'application/json'
        }
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

getProfile();
