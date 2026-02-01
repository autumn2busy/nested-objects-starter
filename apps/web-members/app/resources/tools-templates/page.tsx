'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate' // Assuming Gate is appropriate here, or remove if public
import { Card } from '@/components/ui/card'
import { FileText, Calculator, MessageSquare } from 'lucide-react'

export default function ToolsTemplatesPage() {
    return (
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    marginBottom: '1.75rem',
                }}
            >
                <div>
                    <Link
                        href="/resources"
                        style={{
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            color: '#4b5563',
                            display: 'inline-block',
                            marginBottom: '0.5rem',
                        }}
                    >
                        ← Back to resources
                    </Link>
                    <h1
                        style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            margin: 0,
                        }}
                    >
                        Tools & templates
                    </h1>
                    <p
                        style={{
                            marginTop: '0.4rem',
                            fontSize: '0.95rem',
                            color: '#6b7280',
                        }}
                    >
                        Downloadable forms, AI prompts, and calculators to streamline your field work.
                    </p>
                </div>

                <nav
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        fontSize: '0.9rem',
                        flexWrap: 'wrap',
                    }}
                >
                    <Link href="/" style={{ textDecoration: 'none', color: '#111827' }}>
                        Home
                    </Link>
                    <Link
                        href="/tools"
                        style={{ textDecoration: 'none', color: '#111827', fontWeight: 600 }}
                    >
                        Go to App Tools
                    </Link>
                </nav>
            </header>

            <Gate feature="tools_templates">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Job Packet Builder */}
                    <Card className="p-6 flex flex-col gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Job Packet Builder</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Create print-ready job packets with map views, contact info, and custom notes for your daily route.
                            </p>
                        </div>
                        <div className="mt-auto pt-4">
                            <Link href="/tools" className="text-sm font-semibold text-brand-copper hover:underline">
                                Launch builder →
                            </Link>
                        </div>
                    </Card>

                    {/* Route ROI Worksheet */}
                    <Card className="p-6 flex flex-col gap-4">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Route ROI Worksheet</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                A spreadsheet template to calculate your true profit per mile after fuel and vehicle wear and tear.
                            </p>
                        </div>
                        <div className="mt-auto pt-4">
                            <button className="text-sm font-semibold text-brand-copper hover:underline">
                                Download Excel (.xlsx) ↓
                            </button>
                        </div>
                    </Card>

                    {/* AI Prompt Library */}
                    <Card className="p-6 flex flex-col gap-4">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">AI Prompt Library</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Copy-paste prompts for ChatGPT to help write claim narratives, dispute chargebacks, and draft emails.
                            </p>
                        </div>
                        <div className="mt-auto pt-4">
                            <Link href="/concierge" className="text-sm font-semibold text-brand-copper hover:underline">
                                View prompts →
                            </Link>
                        </div>
                    </Card>
                </div>
            </Gate>
        </main>
    )
}
