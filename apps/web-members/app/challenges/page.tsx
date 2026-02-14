import type { Metadata } from 'next';
import { Award } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { generatePageMetadata, getCourseSchema, SITE_NAME } from '@/lib/seo';
import TrainingModulesGate from './TrainingModulesGate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generatePageMetadata({
    title: 'Training Center | Professional Certification Courses',
    description: 'Master mortgage field services, property inspections, and preservation through enterprise-grade curriculum. Free and premium courses for inspectors, notaries, and appraisers.',
    path: '/challenges',
});


export default async function TrainingPage() {
    const supabase = createClient();

    // Fetch Modules
    const { data: modules } = await supabase
        .from('training_modules')
        .select('*')
        .order('module_number');

    // Generate Course Schema
    const courseSchemas = modules?.map(module => getCourseSchema({
        name: module.title,
        description: module.description,
        provider: SITE_NAME
    })) || [];

    // Fetch User Progress (Optional: simpler to just show "Start" for now, or fetch if needed)
    // For now we'll keep it simple and scalable.

    return (
        <div className="min-h-screen bg-slate-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchemas) }}
            />
            <header className="bg-slate-900 text-white py-12 border-b border-slate-800">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex items-center gap-2 text-brand-copper font-bold uppercase tracking-wider text-xs mb-4">
                        <Award className="w-4 h-4" /> Professional Certification
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Training Center</h1>
                    <p className="text-slate-400 max-w-2xl text-lg">
                        Master the skills needed for mortgage field services, inspections, and property preservation through our enterprise-grade curriculum.
                    </p>
                </div>
            </header>

            <TrainingModulesGate modules={modules ?? []} />
        </div>
    );
}
