'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Layers, ArrowRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { basicFieldInspectionModules } from '../../modules'
import { cn } from '@/lib/utils'

export default function ResourcesPage() {
    const moduleData = basicFieldInspectionModules.find(m => m.id === 'orientation')!
    const [currentFlashcard, setCurrentFlashcard] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const flashcards = moduleData.flashcards || []

    const handleNextCard = () => {
        setIsFlipped(false)
        setCurrentFlashcard(prev => (prev + 1) % flashcards.length)
    }

    const handlePrevCard = () => {
        setIsFlipped(false)
        setCurrentFlashcard(prev => (prev - 1 + flashcards.length) % flashcards.length)
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-4 lg:p-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href="/training/basic/module-1" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Overview
                    </Link>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Resources & Study Tools</h1>
                    <p className="text-slate-600">Download essential checklists and master the terminology.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Downloads Section */}
                    <div>
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Download Toolkit
                        </h2>
                        <div className="grid gap-3">
                            {moduleData.downloads?.map((doc, i) => (
                                <a
                                    key={i}
                                    href={`/training/module-1/${doc.fileName}`}
                                    download
                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group flex items-start gap-4"
                                >
                                    <div className="bg-slate-100 p-2.5 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <Download className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{doc.title}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                                        <span className="inline-block mt-2 text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                            {doc.fileSize} • {doc.icon.toUpperCase()}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Flashcards Section */}
                    <div>
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-emerald-600" />
                            Flashcards ({flashcards.length})
                        </h2>

                        <div className="bg-white rounded-2xl p-1 border border-slate-200 shadow-sm">
                            <div
                                onClick={() => setIsFlipped(!isFlipped)}
                                className="aspect-[4/3] cursor-pointer group perspective-1000 relative"
                            >
                                <div className={cn(
                                    "w-full h-full transition-all duration-500 transform-style-3d relative",
                                    isFlipped ? "rotate-y-180" : ""
                                )}>
                                    {/* Front */}
                                    <div className="absolute inset-0 backface-hidden bg-slate-50 rounded-xl flex flex-col items-center justify-center p-8 text-center border-2 border-transparent group-hover:border-slate-200 transition-colors">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Term / Question</span>
                                        <p className="text-xl font-medium text-slate-800">{flashcards[currentFlashcard]?.front}</p>
                                        <span className="text-xs text-slate-400 absolute bottom-6">Click to reveal</span>
                                    </div>

                                    {/* Back */}
                                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-emerald-50 rounded-xl flex flex-col items-center justify-center p-8 text-center border-2 border-emerald-100">
                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">Definition / Answer</span>
                                        <p className="text-xl font-medium text-emerald-900">{flashcards[currentFlashcard]?.back}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 flex items-center justify-between border-t border-slate-100 mt-1">
                                <Button variant="ghost" size="sm" onClick={handlePrevCard}>
                                    <RotateCcw className="w-4 h-4 mr-2" /> Prev
                                </Button>
                                <span className="text-sm font-medium text-slate-500">
                                    {currentFlashcard + 1} / {flashcards.length}
                                </span>
                                <Button variant="ghost" size="sm" onClick={handleNextCard}>
                                    Next <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
