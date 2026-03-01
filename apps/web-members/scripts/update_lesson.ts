import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function fillChecklist(obj: any, updated = { flag: false }): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => fillChecklist(item, updated));
    }

    const newObj: any = { ...obj };

    if (newObj.title && newObj.title.includes('Camera Setup') && newObj.type === 'checklist') {
        if (!newObj.items || newObj.items.length === 0) {
            console.log('Populating Camera Setup Checklist');
            newObj.items = [
                "Ensure location tags (GPS) are enabled in your camera settings",
                "Set resolution to at least 12 Megapixels",
                "Check that the date/time stamp is accurate",
                "Clean your camera lens",
                "Ensure you have sufficient storage space"
            ];
            updated.flag = true;
        }
    }

    if (newObj.title && newObj.title.includes('Do List')) {
        if (!newObj.data || !newObj.data.rows || newObj.data.rows.length === 0) {
            console.log('Populating Do List table');
            newObj.type = 'comparison-table';
            newObj.data = {
                headers: ["Task", "Description", "Required?"],
                rows: [
                    ["Exterior Photos", "Take clear photos of the front, back, and sides of the property", "Yes"],
                    ["Street Scene", "Photo showing the property from the street, including neighboring houses", "Yes"],
                    ["Address Verification", "Photo of the house number or mailbox to verify the address", "Yes"],
                    ["Damage Assessment", "Detailed photos of any visible damage (broken windows, roof issues, etc.)", "If applicable"],
                    ["Occupancy Check", "Determine if the property appears occupied or vacant based on visual indicators", "Yes"]
                ]
            };
            updated.flag = true;
        }
    }

    for (const key in newObj) {
        newObj[key] = fillChecklist(newObj[key], updated);
    }

    return newObj;
}

async function run() {
    const { data: lessons, error } = await supabase.from('training_lessons').select('id, title, content');

    if (error || !lessons) {
        console.error('Error fetching lessons', error);
        return;
    }

    for (const lesson of lessons) {
        if (lesson.content && (lesson.content.includes('Camera Setup') || lesson.content.includes('Do List'))) {
            try {
                let contentObj = JSON.parse(lesson.content);
                let updated = { flag: false };

                contentObj = fillChecklist(contentObj, updated);

                if (updated.flag) {
                    console.log(`Updating lesson: ${lesson.title} (${lesson.id})`);
                    const { error: updateError } = await supabase.from('training_lessons').update({ content: JSON.stringify(contentObj) }).eq('id', lesson.id);
                    if (updateError) {
                        console.error('Error updating lesson:', updateError);
                    } else {
                        console.log('Successfully updated the lesson!');
                    }
                } else {
                    console.log(`Matched keywords, but no blank tables found in: ${lesson.title}`);
                }
            } catch (e) {
                console.error('Error parsing JSON for lesson:', lesson.id);
            }
        }
    }
}
run();
