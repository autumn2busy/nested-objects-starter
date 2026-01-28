import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
    BookOpen, CheckCircle, ChevronLeft, ChevronRight,
    Layout, PlayCircle, Menu, X, Lock
} from 'lucide-react';

export default async function TrainingModuleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { moduleId: string };
}) {
    const supabase = createClient();
    const { moduleId } = params;

    // 1. Fetch Module Details
    const { data: moduleData, error: moduleError } = await supabase
        .from('training_modules')
        .select('*')
        .eq('id', moduleId)
        .single();

    if (moduleError || !moduleData) {
        redirect('/training');
    }

    // 2. Fetch Lessons
    const { data: lessons } = await supabase
        .from('training_lessons')
        .select('id, title, lesson_number, estimated_minutes, content_type')
        .eq('module_id', moduleId)
        .order('lesson_number');

    // 3. Fetch User Progress (Server-side)
    // Note: For a robust implementation, you might want to fetch this client-side 
    // or use a server action to ensure it's always fresh, but for the layout fetch is okay.
    const { data: { user } } = await supabase.auth.getUser();
    let completedLessonIds: string[] = [];

    if (user) {
        const { data: progress } = await supabase
            .from('user_progress')
            .select('lesson_id, status')
            .eq('user_id', user.id)
            .eq('module_id', moduleId)
            .eq('status', 'completed');

        if (progress) {
            completedLessonIds = progress.map(p => p.lesson_id);
        }
    }

    const progressPercent = lessons && lessons.length > 0
        ? Math.round((completedLessonIds.length / lessons.length) * 100)
        : 0;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-80 bg-white border-r border-slate-200 h-full flex-shrink-0 z-20">
                {/* Sidebar Header */}
                <div className="p-5 border-b border-slate-100">
                    <Link
                        href="/training"
                        className="text-xs font-semibold text-slate-500 hover:text-brand-copper flex items-center gap-1 mb-4 uppercase tracking-wider"
                    >
                        <ChevronLeft className="w-3 h-3" /> Back to Curriculum
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-dark text-white flex items-center justify-center text-xl flex-shrink-0">
                            {moduleData.icon || '📚'}
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-medium">Module {moduleData.module_number}</div>
                            <h2 className="font-bold text-slate-900 leading-tight line-clamp-2">
                                {moduleData.title}
                            </h2>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                            <span>{progressPercent}% Complete</span>
                            <span>{completedLessonIds.length}/{lessons?.length || 0}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Lesson List */}
                <div className="flex-1 overflow-y-auto py-2">
                    <div className="px-3 space-y-1">
                        <Link
                            href={`/training/${moduleId}`}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                        >
                            <Layout className="w-4 h-4 text-slate-400" />
                            Overview
                        </Link>

                        <div className="pt-2 pb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Lessons
                        </div>

                        {lessons?.map((lesson) => {
                            const isCompleted = completedLessonIds.includes(lesson.id);

                            return (
                                <Link
                                    key={lesson.id}
                                    href={`/training/${moduleId}/lesson/${lesson.id}`}
                                    className={`group flex items-start gap-3 px-3 py-3 rounded-lg text-sm transition-all border border-transparent hover:border-slate-100 hover:bg-slate-50`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border ${isCompleted
                                            ? 'bg-emerald-100 border-emerald-200 text-emerald-600'
                                            : 'bg-slate-50 border-slate-200 text-slate-500'
                                        }`}>
                                        {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : lesson.lesson_number}
                                    </div>
                                    <div>
                                        <div className={`font-medium ${isCompleted ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                            {lesson.title}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                            <span>{lesson.estimated_minutes} min</span>
                                            {lesson.content_type === 'video' && (
                                                <span className="flex items-center gap-0.5">
                                                    <PlayCircle className="w-3 h-3" /> Video
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    {progressPercent === 100 ? (
                        <Link
                            href={`/training/${moduleId}/quiz`}
                            className="flex items-center justify-center w-full py-2.5 bg-brand-copper hover:bg-brand-copperDark text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
                        >
                            Take Assessment
                        </Link>
                    ) : (
                        <div className="flex items-center justify-center w-full py-2.5 bg-slate-200 text-slate-400 font-semibold rounded-lg text-sm cursor-not-allowed">
                            <Lock className="w-3.5 h-3.5 mr-2" /> Assessment Locked
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative bg-slate-50 scroll-smooth">
                {children}
            </main>
        </div>
    );
}
