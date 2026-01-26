import Link from 'next/link'
import { FileText, Image, Paperclip } from 'lucide-react'

export type TrainingResource = {
    id: string
    title: string
    description: string
    file_path: string
    file_type: string
    lesson_number?: number
}

interface VisualReferenceLibraryProps {
    resources: TrainingResource[]
}

export default function VisualReferenceLibrary({ resources }: VisualReferenceLibraryProps) {
    // Group resources by lesson_number if available, otherwise 'General'
    const groupedResources: Record<string, TrainingResource[]> = resources.reduce((acc, res) => {
        const key = res.lesson_number ? `Lesson ${res.lesson_number}` : 'General Reference'
        if (!acc[key]) acc[key] = []
        acc[key].push(res)
        return acc
    }, {} as Record<string, TrainingResource[]>)

    // Sort keys to ensure Lesson 1 comes before Lesson 2, etc.
    const sortedKeys = Object.keys(groupedResources).sort((a, b) => {
        if (a === 'General Reference') return -1
        if (b === 'General Reference') return 1
        const numA = parseInt(a.replace('Lesson ', ''))
        const numB = parseInt(b.replace('Lesson ', ''))
        return numA - numB
    })

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-brand-dark mb-1">Visual Reference Library</h2>
                <p className="text-slate-500 text-sm">
                    Support materials to reinforce your understanding. These are not required for the quiz.
                </p>
            </div>

            <div className="divide-y divide-slate-100">
                {resources.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic">
                        No visual references available for this module yet.
                    </div>
                ) : (
                    sortedKeys.map(groupName => (
                        <div key={groupName} className="p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                                {groupName}
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {groupedResources[groupName].map(res => (
                                    <div
                                        key={res.id}
                                        className="group relative border border-slate-200 rounded-lg p-3 hover:border-brand-copper/50 transition-colors bg-white flex flex-col gap-3"
                                    >
                                        <div className="aspect-video bg-slate-100 rounded-md flex items-center justify-center overflow-hidden relative">
                                            {/* Placeholder for actual image preview if available */}
                                            {res.file_type === 'image' || res.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                <img
                                                    src={res.file_path}
                                                    alt={res.title}
                                                    className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                                                />
                                            ) : (
                                                <div className="text-slate-300">
                                                    {res.file_type === 'pdf' ? <FileText className="w-8 h-8" /> : <Paperclip className="w-8 h-8" />}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-slate-700 text-sm leading-tight group-hover:text-brand-copper mb-1">
                                                {res.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {res.description}
                                            </p>
                                        </div>

                                        {/* Non-interactive per requirements, but maybe link to full view? 
                                            "Visuals are not interactive" likely means standard HTML, no complex interactions. 
                                            Opening a lightbox or file is valid. */}
                                        <a href={res.file_path} target="_blank" rel="noopener noreferrer" className="absolute inset-0" aria-label={`View ${res.title}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
