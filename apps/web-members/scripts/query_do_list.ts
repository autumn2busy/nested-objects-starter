import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('training_lessons').select('id, module_id, title, content');
    if (error) {
        console.error(error);
        return;
    }

    console.log(`Scanning ${data.length} lessons...`);

    data.forEach(d => {
        if (d.content) {
            if (d.content.includes('What You Do')) console.log('Found "What You Do" in lesson:', d.title, d.id);
            if (d.content.includes('comparison-table')) console.log('Found "comparison-table" in lesson:', d.title, d.id);
            if (d.content.includes('What You Do (The')) console.log('Found "What You Do (The" in lesson:', d.title, d.id);
            if (d.content.includes('What')) console.log('Found "What" in lesson:', d.title, d.id);
        }
    });
}
run();
