const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function introspect() {
    const url = process.env.AC_API_URL + '/api/3/ecom/graphql';
    const query = `{
        __type(name: "BulkAsync") {
            name
            kind
            fields {
                name
                type {
                    name
                    kind
                    ofType { name kind }
                }
            }
        }
    }`;

    const r = await fetch(url, {
        method: 'POST',
        headers: {
            'Api-Token': process.env.AC_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });
    const d = await r.json();
    console.log(JSON.stringify(d, null, 2));
}

introspect();
