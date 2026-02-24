const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of lines) {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
    } else if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
        supabaseKey = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
    }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Testing Profile Provisioning...');

    const outsetaId = 'test_user_' + Date.now();
    const user = { email: outsetaId + '@example.com', name: 'Test User' };

    let { data: profile, error } = await supabase
        .from('profiles')
        .select('id, user_id, outseta_person_uid, trust_score, trust_score_breakdown, training_modules_completed, background_check_status')
        .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`)
        .limit(1)
        .single();

    console.log('1. Initial Lookup:', !!profile, error?.message || 'Success');

    if (!profile) {
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
                user_id: outsetaId,
                outseta_person_uid: outsetaId,
                email: user.email,
                full_name: user.name || 'Unknown User',
                updated_at: new Date().toISOString()
            })
            .select('id, user_id, outseta_person_uid, trust_score, trust_score_breakdown, training_modules_completed, background_check_status')
            .single();

        if (createError || !newProfile) {
            console.log('Failed to create test profile:', createError);
        } else {
            profile = newProfile;
            console.log('3. Created Test Profile:', profile.id);
        }
    }

    if (profile) {
        console.log('Testing Training Progress Insertion...');
        const { error: pErr } = await supabase.from('training_progress').insert({
            user_id: outsetaId,
            profile_id: profile.id,
            module_id: '11111111-1111-1111-1111-111111111111',
            lesson_id: 'test_lesson_1',
            resource_type: 'lesson',
            status: 'completed',
            updated_at: new Date().toISOString()
        });
        console.log('Training Progress Insert:', pErr ? 'FAILED: ' + pErr.message : 'SUCCESS');

        console.log('Testing Quiz Attempts Insertion...');
        const { error: qErr } = await supabase.from('quiz_attempts').insert({
            profile_id: profile.id,
            user_id: outsetaId,
            module_id: '11111111-1111-1111-1111-111111111111',
            passed: true,
            score: 100,
            completed_at: new Date().toISOString()
        });
        console.log('Quiz Attempts Insert:', qErr ? 'FAILED: ' + qErr.message : 'SUCCESS');

        await supabase.from('training_progress').delete().eq('user_id', outsetaId);
        await supabase.from('quiz_attempts').delete().eq('user_id', outsetaId);
        await supabase.from('profiles').delete().eq('id', profile.id);
        console.log('Cleanup complete.');
    }
}

run();
