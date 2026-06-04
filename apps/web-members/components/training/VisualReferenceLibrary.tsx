import Link from 'next/link'
import Image from 'next/image'
import { FileText, Image as ImageIcon, Paperclip } from 'lucide-react'
import { TrainingResource } from '@/types/training'

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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-brand-dark mb-1 flex items-center gap-2">
                    Visual Reference Library <span className="text-xs font-normal text-slate-500 bg-white border px-2 py-0.5 rounded-full">Optional Support</span>
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                    Reinforce your learning with these visual aids. These materials are <strong>not required</strong> for the quiz but help clarify complex concepts.
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
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-l-4 border-brand-copper pl-3">
                                {groupName}
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {groupedResources[groupName].map(res => {
                                    const isImageResource = res.file_type === 'image' || res.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                    const isLocalImage = res.file_path.startsWith('/')

                                    return (
                                        <div
                                            key={res.id}
                                            className="group relative border border-slate-200 rounded-lg p-3 hover:border-brand-copper/50 transition-colors bg-white flex flex-col gap-3 shadow-sm hover:shadow-md"
                                        >
                                            <div className="aspect-video bg-slate-100 rounded-md flex items-center justify-center overflow-hidden relative group-hover:ring-2 ring-brand-copper/20 transition-all">
                                                {/* Preview Logic */}
                                                {isImageResource ? (
                                                    <Image
                                                        src={res.file_path}
                                                        alt={res.title}
                                                        fill
                                                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
                                                        unoptimized={!isLocalImage}
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className={`flex flex-col items-center gap-2 ${res.file_type === 'pdf' ? 'text-red-500' :
                                                        res.file_type === 'docx' ? 'text-blue-600' :
                                                            res.file_type === 'xlsx' ? 'text-green-600' :
                                                                'text-slate-400'
                                                        }`}>
                                                        {res.file_type === 'pdf' ? <FileText className="w-10 h-10" /> :
                                                            res.file_type === 'docx' ? <FileText className="w-10 h-10" /> :
                                                                <Paperclip className="w-10 h-10" />}
                                                        <span className="text-[10px] uppercase font-bold text-slate-500">{res.file_type}</span>
                                                    </div>
                                                )}

                                                {/* Overlay Action */}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                                    View Resource
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold text-slate-700 text-sm leading-tight group-hover:text-brand-copper mb-1">
                                                    {res.title}
                                                </h4>
                                                {/* Description or Type */}
                                                <p className="text-xs text-slate-500 line-clamp-2">
                                                    {res.description || "Visual aid for this concept."}
                                                </p>
                                            </div>

                                            <a href={res.file_path} target="_blank" rel="noopener noreferrer" className="absolute inset-0" aria-label={`View ${res.title}`} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
