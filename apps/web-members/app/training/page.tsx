import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Shield, BookOpen, ChevronRight, Award, Lock, Star } from 'lucide-react';
import { generatePageMetadata, getCourseSchema, SITE_NAME } from '@/lib/seo';
import { PreviewGate } from '@/components/PreviewGate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generatePageMetadata({
    title: 'Training Center | Professional Certification Courses',
    description: 'Master mortgage field services, property inspections, and preservation through enterprise-grade curriculum. Free and premium courses for inspectors, notaries, and appraisers.',
    path: '/training',
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

            <main className="max-w-6xl mx-auto px-6 py-12">
                <PreviewGate
                    feature="basic_training"
                    title="Training Center Locked"
                    description="Join our community to access professional certification courses."
                >
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {modules?.map((module) => (
                            <Link
                                key={module.id}
                                href={`/training/${module.id}`}
                                className="group block h-full"
                            >
                                <div className="bg-white border text-card-foreground shadow-sm rounded-2xl p-6 h-full transition-all hover:border-brand-copper hover:shadow-lg hover:-translate-y-1 relative overflow-hidden">
                                    {module.is_new && (
                                        <span className="absolute top-4 right-4 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                            NEW
                                        </span>
                                    )}

                                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6 text-3xl shadow-inner group-hover:bg-brand-copper/10 transition-colors">
                                        {module.icon || '📘'}
                                    </div>

                                    <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        Module {module.module_number}
                                    </div>

                                    <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-copper transition-colors">
                                        {module.title}
                                    </h2>
                                    <p className="text-slate-500 mb-6 line-clamp-3 text-sm leading-relaxed">
                                        {module.description}
                                    </p>

                                    <div className="flex items-center text-brand-copper font-bold text-sm mt-auto">
                                        Start Module <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {(!modules || modules.length === 0) && (
                            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No training modules available yet.</h3>
                                <p className="text-slate-500">Check back soon for new content.</p>
                            </div>
                        )}
                    </div>
                </PreviewGate>
            </main>
        </div>
    );
}
