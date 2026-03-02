import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkModuleIdValue() {
    const attemptId = 'e70ed803-62c5-4a62-9b19-bd4200182cb3';

    const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .select('module_id')
        .eq('id', attemptId)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`module_id for attempt ${attemptId}:`, attempt.module_id);
}

checkModuleIdValue();
