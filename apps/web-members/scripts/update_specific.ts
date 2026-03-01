import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const lessonId = '492e7e0e-b316-4682-9976-d5ebe2b631b0'; // The Complete Photo Sequence
    const { data: lesson, error } = await supabase.from('training_lessons').select('*').eq('id', lessonId).single();

    if (error || !lesson) {
        console.error('Error fetching lesson', error);
        return;
    }

    if (lesson.content) {
        try {
            let contentObj = JSON.parse(lesson.content);
            let updated = false;

            if (contentObj.sections) {
                // Update 'The Exterior Flow' section
                const extIdx = contentObj.sections.findIndex((s: any) => s.title && s.title.includes("The Exterior Flow"));
                if (extIdx !== -1) {
                    console.log('Found The Exterior Flow section, updating...');
                    contentObj.sections[extIdx].type = 'six-angle';
                    contentObj.sections[extIdx].angles = [
                        { "number": "1", "name": "Street Scene", "purpose": "Shows the property in context of the neighborhood.", "tip": "Include neighboring houses and the street itself." },
                        { "number": "2", "name": "Front View", "purpose": "Clear shot of the entire front of the property.", "tip": "Stand back far enough to fit the whole house, including the roof." },
                        { "number": "3", "name": "Address", "purpose": "Verifies you are at the correct location.", "tip": "House numbers on the home itself or on a fixed mailbox." },
                        { "number": "4", "name": "Left Side", "purpose": "Shows the condition of the left exterior wall.", "tip": "Capture from the front corner looking back." },
                        { "number": "5", "name": "Rear View", "purpose": "Shows the back of the property and yard.", "tip": "Include any outbuildings or significant landscaping." },
                        { "number": "6", "name": "Right Side", "purpose": "Shows the condition of the right exterior wall.", "tip": "Capture from the front corner looking back." }
                    ];
                    updated = true;
                }

                // Update 'Context is King' section
                const ctxIdx = contentObj.sections.findIndex((s: any) => s.title && s.title.includes("Context is King"));
                if (ctxIdx !== -1) {
                    console.log('Found Context is King section, updating...');
                    contentObj.sections[ctxIdx].type = 'tips';
                    contentObj.sections[ctxIdx].tips = [
                        { "title": "Don't crop the roof", "content": "Get the sky and the ground. We need to see the roofline and the grading." },
                        { "title": "Step back", "content": "If you can't fit the house in the frame, cross the street." },
                        { "title": "No obstructed views", "content": "Avoid taking photos behind large trees or vehicles if possible. Step to the side to get a clear angle." }
                    ];
                    updated = true;
                }
            }

            if (updated) {
                const { error: updateError } = await supabase.from('training_lessons').update({ content: JSON.stringify(contentObj) }).eq('id', lesson.id);
                if (updateError) {
                    console.error('Error updating lesson:', updateError);
                } else {
                    console.log('Successfully updated the lesson!');
                }
            }
        } catch (e) {
            console.error('Error parsing JSON for lesson:', lesson.title);
        }
    }
}
run();
