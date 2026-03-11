import * as dotenv from 'dotenv'
import * as https from 'https'

dotenv.config({ path: '.env.local' })
const personUid = 'W4JJD0RQ'

const payload = JSON.stringify({})

const options = {
    hostname: 'nested-objects.outseta.com',
    path: `/api/v1/crm/people/${personUid}/send-confirmation-email`,
    method: 'POST',
    headers: {
        'Authorization': `Outseta ${process.env.OUTSETA_API_KEY}:${process.env.OUTSETA_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
}

const req = https.request(options, (res) => {
    let data = ''
    res.on('data', (d) => { data += d })
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`)
        console.log('Response:', data)
    })
})

req.on('error', console.error)
req.write(payload)
req.end()
