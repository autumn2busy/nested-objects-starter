import * as dotenv from 'dotenv'
import * as https from 'https'

dotenv.config({ path: '.env.local' })

const apiKey = process.env.OUTSETA_API_KEY
const apiSecret = process.env.OUTSETA_API_SECRET

const personUid = '9P66YMPm'
const payload = JSON.stringify({
    Uid: personUid,
    PersonAccount: [
        {
            Account: { Uid: 'nmD4Dqxm' },
        }
    ],
    CustomFields: {
        role: 'admin',
        roles: 'admin',
        permissions: 'admin:*'
    }
})

const options = {
    hostname: 'nested-objects.outseta.com',
    path: `/api/v1/crm/people/${personUid}`,
    method: 'PUT',
    headers: {
        'Authorization': `Outseta ${apiKey}:${apiSecret}`,
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
