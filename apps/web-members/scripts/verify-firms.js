
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFirms() {
    const { data, error, count } = await supabase
        .from('firms')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error fetching firms head:', error);
    } else {
        console.log(`Total firms count: ${count}`);
    }

    const { data: firms, error: fetchError } = await supabase
        .from('firms')
        .select('id, name, is_published')
        .eq('is_published', true)
        .limit(5);

    if (fetchError) {
        console.error('Error fetching published firms:', fetchError);
    } else {
        console.log('Sample published firms:', firms);
    }
}

checkFirms();
