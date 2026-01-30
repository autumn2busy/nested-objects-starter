'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Globe, Trash2, Building2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Company = {
    id: string
    name: string
    website: string
    status: 'Target' | 'Applying' | 'Interviewing' | 'Archived'
    notes: string
    dateAdded: string
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newCompany, setNewCompany] = useState<Partial<Company>>({ status: 'Target' })

    useEffect(() => {
        const saved = localStorage.getItem('tracked_companies')
        if (saved) {
            setCompanies(JSON.parse(saved))
        }
    }, [])

    const saveCompany = () => {
        if (!newCompany.name) return
        const company: Company = {
            id: crypto.randomUUID(),
            name: newCompany.name,
            website: newCompany.website || '',
            status: newCompany.status as any || 'Target',
            notes: newCompany.notes || '',
            dateAdded: new Date().toISOString()
        }
        const updated = [company, ...companies]
        setCompanies(updated)
        localStorage.setItem('tracked_companies', JSON.stringify(updated))
        setNewCompany({ status: 'Target' })
        setIsModalOpen(false)
    }

    const deleteCompany = (id: string) => {
        const updated = companies.filter(c => c.id !== id)
        setCompanies(updated)
        localStorage.setItem('tracked_companies', JSON.stringify(updated))
    }

    return (
        <main className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <Link href="/tools" className="text-sm font-semibold text-brand-copper mb-4 hover:underline block">
                        ← Back to Tools
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Company Tracker</h1>
                            <p className="text-slate-500 mt-1">Keep track of the firms you want to work with.</p>
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-brand-copper hover:bg-brand-copperDark text-white gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Company
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {companies.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-brand-copper/10 text-brand-copper rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No companies saved yet</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">Start building your target list of field service firms.</p>
                        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" /> Add your first company
                        </Button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map(company => (
                            <div key={company.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 bg-brand-mist/50 rounded-lg">
                                        <Building2 className="w-6 h-6 text-brand-dark" />
                                    </div>
                                    <button onClick={() => deleteCompany(company.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 mb-1">{company.name}</h3>
                                {company.website && (
                                    <a href={company.website} target="_blank" rel="noreferrer" className="text-sm text-brand-copper hover:underline flex items-center gap-1 mb-3">
                                        <Globe className="w-3 h-3" /> {company.website.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${company.status === 'Target' ? 'bg-blue-100 text-blue-700' :
                                            company.status === 'Applying' ? 'bg-amber-100 text-amber-700' :
                                                company.status === 'Interviewing' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-slate-100 text-slate-600'
                                        }`}>
                                        {company.status}
                                    </span>
                                </div>
                                {company.notes && (
                                    <p className="text-sm text-slate-500 line-clamp-2 border-t border-slate-100 pt-3 mt-3">
                                        {company.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Add Company</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                <input
                                    autoFocus
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                    value={newCompany.name || ''}
                                    onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                                    placeholder="e.g. Acme Inspections"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                                <input
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                    value={newCompany.website || ''}
                                    onChange={e => setNewCompany({ ...newCompany, website: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                    value={newCompany.status}
                                    onChange={e => setNewCompany({ ...newCompany, status: e.target.value as any })}
                                >
                                    <option value="Target">Target</option>
                                    <option value="Applying">Applying</option>
                                    <option value="Interviewing">Interviewing</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                    value={newCompany.notes || ''}
                                    onChange={e => setNewCompany({ ...newCompany, notes: e.target.value })}
                                    placeholder="Any specific contacts or requirements..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button className="bg-brand-copper text-white hover:bg-brand-copperDark" onClick={saveCompany}>Save Company</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
