'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PlayCircle, CheckCircle, FileText, ChevronLeft, Lock } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { basicFieldInspectionModules } from '../modules'
import { cn } from '@/lib/utils'

export default function ModulePlayerPage() {
    const params = useParams()
    const moduleId = params.moduleId as string

    const currentModule = basicFieldInspectionModules.find(m => m.id === moduleId)
    const currentIndex = basicFieldInspectionModules.findIndex(m => m.id === moduleId)
    const nextModule = basicFieldInspectionModules[currentIndex + 1]

    if (!currentModule) {
        return (
            <div className="flex h-screen items-center justify-center bg-brand-micra">
                <div className="text-center">
                    <h1 className="text-xl font-bold">Module not found</h1>
                    <Link href="/training/basic" className="text-brand-copper hover:underline mt-2 inline-block">Return to Track</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen flex-col lg:flex-row bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-full lg:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <Link href="/training/basic" className="text-slate-400 hover:text-slate-800 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <span className="font-semibold text-sm text-slate-800 tracking-wide">Basic Inspection Track</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {basicFieldInspectionModules.map((module, idx) => {
                        const isActive = module.id === moduleId
                        const isCompleted = idx < currentIndex // Dummy completion logic: assumes sequential

                        return (
                            <Link
                                key={module.id}
                                href={`/training/basic/${module.id}`}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-xl transition-all border border-transparent",
                                    isActive ? "bg-emerald-50 border-emerald-100 ring-1 ring-emerald-200" : "hover:bg-slate-50 hover:border-slate-200",
                                    isCompleted ? "opacity-70" : ""
                                )}
                            >
                                <div className="mt-0.5">
                                    {isActive ? (
                                        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm">
                                            <PlayCircle className="w-3 h-3 text-white fill-current" />
                                        </div>
                                    ) : isCompleted ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <h4 className={cn("text-sm font-semibold leading-tight", isActive ? "text-emerald-900" : "text-slate-700")}>
                                        {module.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">{module.duration}</p>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                        <Lock className="w-3 h-3" />
                        <span>Complete all modules to verify</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50">
                <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12">
                    <div className="mb-6">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full">
                            {currentModule.type}
                        </span>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-3">{currentModule.title}</h1>
                        <p className="text-slate-600 mt-2 text-lg">{currentModule.description}</p>
                    </div>

                    {/* Video Player Shell */}
                    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 mb-8 relative group">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`${currentModule.videoUrl}?autoplay=0&modestbranding=1&rel=0`}
                            title={currentModule.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0"
                        />
                    </div>

                    {/* Action Area */}
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5 text-emerald-600" />
                                    Lesson Syllabus
                                </h3>
                                <ul className="space-y-3">
                                    {currentModule.syllabus.map((item, i) => (
                                        <li key={i} className="flex gap-3 text-slate-700 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-xl">
                                <h3 className="font-bold mb-2">Ready to advance?</h3>
                                <p className="text-emerald-100 text-sm mb-6">
                                    Confirm you have watched the video and reviewed the syllabus notes.
                                </p>

                                {nextModule ? (
                                    <Link
                                        href={`/training/basic/${nextModule.id}`}
                                        className={cn(buttonVariants({ className: "w-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold" }))}
                                    >
                                        Next Lesson →
                                    </Link>
                                ) : (
                                    <Button className="w-full bg-white hover:bg-slate-100 text-emerald-900 font-bold">
                                        Complete Course 🎉
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
