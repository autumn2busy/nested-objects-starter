import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data: lessons, error } = await supabase.from('training_lessons')
        .select('id, title, content')
        .ilike('content', '%Exterior Flow%');

    if (error || !lessons) {
        console.error('Error fetching lessons', error);
        return;
    }

    for (const lesson of lessons) {
        if (lesson.content) {
            try {
                let contentObj = JSON.parse(lesson.content);
                console.log(`\n\n--- Lesson: ${lesson.title} (${lesson.id}) ---`);

                function printSections(obj: any, indent = '') {
                    if (!obj || typeof obj !== 'object') return;
                    if (Array.isArray(obj)) {
                        obj.forEach(item => printSections(item, indent));
                        return;
                    }
                    if (obj.title) {
                        console.log(`${indent}${obj.title} (Type: ${obj.type})`);
                        if (obj.items) console.log(`${indent}  Items: ${JSON.stringify(obj.items).slice(0, 100)}...`);
                        if (obj.data) console.log(`${indent}  Data: ${JSON.stringify(obj.data).slice(0, 100)}...`);
                    }
                    for (const key in obj) {
                        printSections(obj[key], indent + '  ');
                    }
                }

                printSections(contentObj);
            } catch (e) {
                console.error('Error parsing JSON for lesson:', lesson.id);
            }
        }
    }
}
run();
