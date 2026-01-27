import Link from 'next/link';
import { Shield, BookOpen, ChevronRight, Award } from 'lucide-react';

export default function TrainingPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-slate-900 text-white py-12">
                <div className="max-w-6xl mx-auto px-6">
                    <h1 className="text-3xl font-bold mb-4">Training Center</h1>
                    <p className="text-slate-400 max-w-2xl">
                        Master the skills needed for mortgage field services, inspections, and property preservation.
                    </p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Card 1: Field Inspector Certification (New) */}
                    <Link href="/training/field-inspector" className="group block h-full">
                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 h-full transition-all group-hover:border-emerald-500 group-hover:shadow-lg">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-emerald-600" />
                                </div>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                    NEW
                                </span>
                            </div>

                            <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition">
                                Field Inspector Certification
                            </h2>
                            <p className="text-slate-500 mb-6">
                                Complete certification path for new inspectors. Includes photography standards, 6-Angle Rule, and scenario-based training.
                            </p>

                            <div className="flex items-center text-emerald-600 font-semibold text-sm">
                                Start Certification <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: Basic Training (Placeholder) */}
                    <Link href="/training/basic" className="group block h-full">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full transition-all hover:border-blue-500 hover:shadow-md">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>

                            <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition">
                                Basic Training
                            </h2>
                            <p className="text-slate-500 mb-6">
                                Fundamental concepts for property preservation and work order management.
                            </p>

                            <div className="flex items-center text-blue-600 font-semibold text-sm">
                                View Modules <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}
