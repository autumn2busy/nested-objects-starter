import * as dotenv from 'dotenv'
import * as https from 'https'

dotenv.config({ path: '.env.local' })

const apiKey = process.env.OUTSETA_API_KEY
const apiSecret = process.env.OUTSETA_API_SECRET
const personUid = 'WyJJ3rVm' // dechijob@gmail.com

const options = {
    hostname: 'nested-objects.outseta.com',
    path: `/api/v1/crm/people/${personUid}`,
    method: 'GET',
    headers: {
        'Authorization': `Outseta ${apiKey}:${apiSecret}`,
        'Accept': 'application/json'
    }
}

const req = https.request(options, (res) => {
    let data = ''
    res.on('data', (d) => { data += d })
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`)
        const json = JSON.parse(data)
        console.log(JSON.stringify(json.PersonAccount, null, 2))
    })
})

req.on('error', console.error)
req.end()
