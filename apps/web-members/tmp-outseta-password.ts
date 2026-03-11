import * as dotenv from 'dotenv'
import * as https from 'https'

dotenv.config({ path: '.env.local' })

const apiKey = process.env.OUTSETA_API_KEY
const apiSecret = process.env.OUTSETA_API_SECRET
const email = 'clownergirl123@gmail.com'

const payload = JSON.stringify({
    EmailAddess: email // Outseta uses EmailAddess in the reset payload
})

const options = {
    hostname: 'nested-objects.outseta.com',
    path: '/api/v1/profile/password/forgotpassword',
    method: 'POST',
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
