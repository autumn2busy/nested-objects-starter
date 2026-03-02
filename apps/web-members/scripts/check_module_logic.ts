import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkModules() {
    const { data: modules, error } = await supabase
        .from('training_modules')
        .select('id, module_number, title, is_active')
        .order('module_number');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- All Training Modules ---');
    modules.forEach(m => {
        console.log(`[${m.module_number}] ${m.title} (${m.id}) - Active: ${m.is_active}`);
    });

    // Check for duplicates
    const counts = {};
    modules.forEach(m => {
        counts[m.module_number] = (counts[m.module_number] || 0) + 1;
    });

    const duplicates = Object.keys(counts).filter(num => counts[num] > 1);
    if (duplicates.length > 0) {
        console.log('\n!!! DUPLICATE MODULE NUMBERS FOUND:', duplicates);
    } else {
        console.log('\nNo duplicate module numbers found.');
    }
}

checkModules();
