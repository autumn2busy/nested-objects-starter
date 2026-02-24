const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

// 1. Read Env
const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of lines) {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.substring('NEXT_PUBLIC_SUPABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
    } else if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
        supabaseKey = line.substring('SUPABASE_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
    }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getOrCreateProfile(supabase, outsetaId, user) {
    let { data: profile } = await supabase
        .from('profiles')
        .select('id, user_id, outseta_person_uid, trust_score, trust_score_breakdown, training_modules_completed, background_check_status')
        .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`)
        .limit(1)
        .single()

    if (!profile && user.email) {
        const { data: emailProfile } = await supabase
            .from('profiles')
            .select('id, user_id, outseta_person_uid, trust_score, trust_score_breakdown, training_modules_completed, background_check_status')
            .eq('email', user.email)
            .single()

        if (emailProfile) {
            const updatePayload = {}
            if (!emailProfile.outseta_person_uid) updatePayload.outseta_person_uid = outsetaId
            if (!emailProfile.user_id) updatePayload.user_id = outsetaId

            if (Object.keys(updatePayload).length > 0) {
                await supabase.from('profiles').update(updatePayload).eq('id', emailProfile.id)
            }
            profile = emailProfile
        }
    }

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
            .single()

        if (createError || !newProfile) {
            console.error('[TEST] Failed to create profile:', createError)
            return null
        }
        profile = newProfile
    }

    return profile
}

async function runTest() {
    console.log('--- STARTING MOCK AUTH & PROGRESS SAVE TEST ---');

    // MOCK USER
    const mockOutsetaId = 'test_user_' + crypto.randomUUID().substring(0, 8);
    const mockUser = {
        email: mockOutsetaId + '@test.com',
        name: 'Automated API Test User'
    };

    console.log(`\n▶ 1. Fetching/Creating Profile for ${mockOutsetaId}...`);
    const profile = await getOrCreateProfile(supabase, mockOutsetaId, mockUser);

    if (!profile) {
        console.error('❌ MOCK FAILED: Could not auto-provision profile.');
        return;
    }

    console.log(`✅ Profile ready! UUID: ${profile.id}`);

    const MOCK_MODULE_ID = 'e632b504-8902-4217-bcc5-c1e1ec0fc00a'; // Must be a valid UUID format

    console.log(`\n▶ 2. Simulating POST /api/training/progress (Lesson Complete)...`);
    const { error: progressError } = await supabase
        .from('training_progress')
        .upsert({
            user_id: mockOutsetaId,
            profile_id: profile.id,
            module_id: MOCK_MODULE_ID,
            lesson_id: 'test_lesson_1',
            resource_type: 'lesson',
            status: 'completed',
            updated_at: new Date().toISOString()
        });

    if (progressError) {
        console.error('❌ MOCK FAILED: Could not save training progress:', progressError);
        return;
    }
    console.log(`✅ Training Progress successfully saved using Profile UUID.`);

    console.log(`\n▶ 3. Simulating POST /api/training/quiz-complete (Assessment Passed)...`);
    const { error: qaError } = await supabase
        .from('quiz_attempts')
        .upsert({
            profile_id: profile.id,
            user_id: mockOutsetaId,
            module_id: MOCK_MODULE_ID,
            passed: true,
            score: 100,
            completed_at: new Date().toISOString()
        });

    if (qaError) {
        console.error('❌ MOCK FAILED: Could not save quiz attempt:', qaError);
        return;
    }
    console.log(`✅ Quiz Attempt successfully saved using Profile UUID.`);


    console.log(`\n▶ 4. Simulating GET /api/training/progress (Fetching completed modules)...`);
    const { data: passedQuizzes, error: getErr } = await supabase
        .from('quiz_attempts')
        .select('module_id')
        .or(`profile_id.eq.${profile.id},user_id.eq.${mockOutsetaId}`)
        .eq('passed', true);

    if (getErr) {
        console.error('❌ MOCK FAILED: Could not fetch completed quizzes:', getErr);
    } else {
        const completedModuleIds = Array.from(new Set(passedQuizzes?.map((q) => q.module_id) || []));
        console.log(`✅ Successfully fetched completed modules! IDs:`, completedModuleIds);

        if (completedModuleIds.includes(MOCK_MODULE_ID)) {
            console.log(`\n🎉 TEST PASSED! The data flow completely works from empty user -> database insertion -> fetching progress array.`);
        } else {
            console.error(`\n❌ TEST FAILED! The completed module ID was not returned in the array.`);
        }
    }


    console.log('\n--- CLEANING UP TEST DATA ---');
    await supabase.from('training_progress').delete().eq('user_id', mockOutsetaId);
    await supabase.from('quiz_attempts').delete().eq('user_id', mockOutsetaId);
    await supabase.from('profiles').delete().eq('id', profile.id);
    console.log('✅ Cleanup finished.');
}

runTest();
