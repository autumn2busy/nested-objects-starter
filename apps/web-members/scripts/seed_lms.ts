
import 'dotenv/config'; // Requires npm install dotenv
import { createClient } from '@supabase/supabase-js'

// Load from .env.local if present (dotenv handles this if called correctly, but explicit path helps)
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Replace these with your project credentials if running locally with access
// OR set process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'

if (!supabaseUrl.startsWith('http')) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set or invalid in .env.local');
    // Don't exit process to allow debug print below
}

const supabase = createClient(supabaseUrl, supabaseKey)

const modules = [
    {
        module_number: 1,
        title: 'Industry Foundations - Understanding the Field',
        description: 'Master the mortgage field services ecosystem. Learn who hires inspectors, what they need, how you get paid, and the critical scope boundaries that protect your professional liability.',
        icon: '📊',
        estimated_hours: 2.0,
        unlock_requirement: 'immediate',
        video_url: 'https://youtu.be/w_YEUvaZaOg'
    },
    {
        module_number: 2,
        title: 'Essential Equipment & Tools',
        description: 'Build your professional toolkit without overspending. Learn what equipment is mandatory vs optional, how to set up mobile inspection apps, and which investments generate immediate ROI.',
        icon: '🛠️',
        estimated_hours: 2.0,
        unlock_requirement: 'module_1_quiz_pass',
        video_url: 'https://youtu.be/KtfUM9X5VMg'
    },
    {
        module_number: 3,
        title: 'Photo Documentation Mastery',
        description: 'Master the 6-angle rule and metadata integrity. Learn how to capture legally defensible photos that tell the complete property story and eliminate report rejections.',
        icon: '📸',
        estimated_hours: 2.5,
        unlock_requirement: 'module_2_quiz_pass',
        video_url: 'https://youtu.be/22oUdcEApi0'
    },
    {
        module_number: 4,
        title: 'Occupancy Determination',
        description: 'Master the hierarchy of evidence for occupancy vs vacancy. Learn to document indicators objectively and avoid wrongful lockout liability.',
        icon: '🏠',
        estimated_hours: 2.5,
        unlock_requirement: 'module_3_quiz_pass',
        video_url: 'https://youtu.be/REoW8dINYoI'
    },
    {
        module_number: 5,
        title: 'Report Writing Excellence',
        description: 'Write objective, coordinator-ready reports using clinical language. Eliminate subjective opinions, maintain scope boundaries, and achieve zero-rejection status.',
        icon: '📝',
        estimated_hours: 2.5,
        unlock_requirement: 'module_4_quiz_pass',
        video_url: 'https://youtu.be/B6gCrwPaLyk'
    },
    {
        module_number: 6,
        title: 'The Augmented Field Inspector - AI Tools',
        description: 'Leverage AI to scale from 5 to 8+ inspections per day. Master report generation, photo validation, voice documentation, and chatbot assistants while maintaining human oversight and professional liability boundaries.',
        icon: '🤖',
        estimated_hours: 2.5,
        unlock_requirement: 'module_5_quiz_pass',
        video_url: 'https://youtu.be/4EB3BQ6KB9o'
    },
    {
        module_number: 7,
        title: 'Income Diversification - Specialized Inspection Types',
        description: 'Build a resilient, multi-stream inspection business. Learn mystery shopping, medical courier verification, property preservation, loss draft inspections, FEMA disaster work, and REO services to earn $1,500-2,500/week.',
        icon: '💰',
        estimated_hours: 3.5,
        unlock_requirement: 'module_6_quiz_pass',
        video_url: 'https://youtu.be/24YaMwxp26Q'
    },
    {
        module_number: 8,
        title: 'Advanced Operational Standards',
        description: 'Scale to elite professional status with 50+ stop days. Master route optimization, environmental adaptability, specialized property types, narrative photography, dispute resolution, and preferred vendor strategies.',
        icon: '🚀',
        estimated_hours: 3.5,
        unlock_requirement: 'module_7_quiz_pass',
        video_url: 'https://youtu.be/VSwh4ECowc4'
    }
]

async function seed() {
    console.log('Start seeding...')

    for (const mod of modules) {
        const { data, error } = await supabase
            .from('training_modules')
            .upsert(mod, { onConflict: 'module_number' })
            .select()

        if (error) {
            console.error(`Error upserting module ${mod.module_number}:`, error)
        } else {
            console.log(`Upserted module ${mod.module_number}: ${mod.title}`)
        }
    }

    console.log('Seeding complete.')
}

seed()
