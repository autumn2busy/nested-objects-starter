import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    console.log('Bypassing Outseta Email Verification by manually updating Supabase profile...')

    // Update Clownergirl's profile to verified
    const { data, error } = await supabase
        .from('profiles')
        .update({
            email_verified: true,
            updated_at: new Date().toISOString()
        })
        .eq('outseta_person_uid', 'W4JJD0RQ')

    if (error) {
        console.error('Failed to verify user:', error)
    } else {
        console.log('User W4JJD0RQ successfully marked as verified in Supabase.')
    }
}

run()
