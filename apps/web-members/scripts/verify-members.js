
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMembers() {
    console.log('Checking profiles table structure...');

    // Just fetch one to see columns
    const { data: sample, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (sampleError) {
        console.error('Error fetching sample profile:', sampleError);
    } else if (sample && sample.length > 0) {
        console.log('Sample profile columns:', Object.keys(sample[0]));
        console.log('Sample profile data:', sample[0]);
    } else {
        console.log('No profiles found or table empty.');
    }

    // Attempt to fetch "public" members
    // We need to guess the "public" flag or just fetch all for now
    const { data, error, count } = await supabase
        .from('profiles')
        .select('id, display_name, created_at, verified_at, rating', { count: 'exact', head: true });

    if (error) {
        console.error('Error fetching profiles count:', error);
    } else {
        console.log(`Total profiles found: ${count}`);
    }
}

checkMembers();
