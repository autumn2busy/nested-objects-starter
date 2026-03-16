
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function findMember() {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing env vars')
        return
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('Searching for "Elite Williams"...')
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', '%Elite Williams%')
    
    if (error) {
        console.error('Error:', error)
        return
    }
    
    if (data && data.length > 0) {
        console.log('Found members:', JSON.stringify(data, null, 2))
        const memberId = data[0].id
        console.log(`Checking resume_workspace for ${memberId}...`)
        const { data: resumeData, error: resumeError } = await supabase
            .from('resume_workspace')
            .select('*')
            .eq('user_id', memberId)
            .maybeSingle()
        
        if (resumeError) console.error('Resume Error:', resumeError)
        console.log('Resume Data:', JSON.stringify(resumeData, null, 2))
    } else {
        console.log('No members found with that name.')
    }

    console.log('Searching for any Elite members...')
    const { data: eliteData } = await supabase
        .from('profiles')
        .select('id, display_name, subscription_tier, is_published')
        .eq('subscription_tier', 'elite')
        .limit(5)
    
    console.log('Elite members sample:', JSON.stringify(eliteData, null, 2))
}

findMember()
