import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function simulateGateLogic() {
    const outsetaId = 'QY8J81Mm';

    // 1. Fetch modules like app/challenges/page.tsx
    const { data: modules } = await supabase
        .from('training_modules')
        .select('id, module_number, title')
        .order('module_number');

    // 2. Fetch completed modules like api/training/progress/route.ts
    const { data: passedQuizzes } = await supabase
        .from('quiz_attempts')
        .select('module_id')
        .eq('user_id', outsetaId)
        .eq('passed', true);

    const completedModuleIds = new Set(passedQuizzes?.map((q: any) => q.module_id) || []);
    console.log('--- Simulation for QGereJeW ---');
    console.log('Passed Module IDs:', Array.from(completedModuleIds));

    // 3. Run TrainingModulesGate logic
    const sortedModules = [...(modules || [])].sort((a, b) => a.module_number - b.module_number);

    const isModuleUnlocked = (module: { id: string, module_number: number, title: string }, index: number) => {
        if (index === 0 || module.module_number === 1) return true;

        // Plan logic (Simplified: assume Pro has basic_training)
        // const showPartialLock = false; 

        const previousModuleNum = module.module_number - 1;
        const previousModule = sortedModules.find(m => m.module_number === previousModuleNum);

        if (!previousModule) {
            const idxPrev = sortedModules[index - 1];
            return idxPrev ? completedModuleIds.has(idxPrev.id) : true;
        }

        const hasPassedPrevious = completedModuleIds.has(previousModule.id);
        return hasPassedPrevious;
    }

    sortedModules.forEach((m, i) => {
        const unlocked = isModuleUnlocked(m, i);
        const passed = completedModuleIds.has(m.id);
        console.log(`Module ${m.module_number}: [${passed ? 'PASSED' : '      '}] - Unlocked: ${unlocked} (${m.title})`);
    });
}

simulateGateLogic();
