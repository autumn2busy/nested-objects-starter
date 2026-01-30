'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Users, Mail, Phone, FileText, Calendar, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Client = {
    id: string
    name: string
    contactName: string
    email: string
    phone: string
    payFrequency: string
    portalLink: string
    signedDocs: boolean
    notes: string
    active: boolean
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newClient, setNewClient] = useState<Partial<Client>>({ active: true, signedDocs: false })

    useEffect(() => {
        const saved = localStorage.getItem('my_clients')
        if (saved) {
            setClients(JSON.parse(saved))
        }
    }, [])

    const saveClient = () => {
        if (!newClient.name) return
        const client: Client = {
            id: crypto.randomUUID(),
            name: newClient.name,
            contactName: newClient.contactName || '',
            email: newClient.email || '',
            phone: newClient.phone || '',
            payFrequency: newClient.payFrequency || '',
            portalLink: newClient.portalLink || '',
            signedDocs: newClient.signedDocs || false,
            notes: newClient.notes || '',
            active: newClient.active !== false
        }
        const updated = [client, ...clients]
        setClients(updated)
        localStorage.setItem('my_clients', JSON.stringify(updated))
        setNewClient({ active: true, signedDocs: false })
        setIsModalOpen(false)
    }

    const deleteClient = (id: string) => {
        const updated = clients.filter(c => c.id !== id)
        setClients(updated)
        localStorage.setItem('my_clients', JSON.stringify(updated))
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <Link href="/tools" className="text-sm font-semibold text-brand-copper mb-4 hover:underline block">
                        ← Back to Tools
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Clients</h1>
                            <p className="text-slate-500 mt-1">Manage your active vendor relationships and key contacts.</p>
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-brand-copper hover:bg-brand-copperDark text-white gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Client
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {clients.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-brand-copper/10 text-brand-copper rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No clients added</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">Keep track of your vendor contacts, pay dates, and portal links.</p>
                        <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="gap-2">
                            <Plus className="w-4 h-4" /> Add your first client
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {clients.map(client => (
                            <div key={client.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-xl text-slate-900">{client.name}</h3>
                                        {client.signedDocs && (
                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                Docs Signed
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                        {client.contactName && (
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4 text-slate-400" />
                                                {client.contactName}
                                            </div>
                                        )}
                                        {client.email && (
                                            <div className="flex items-center gap-1.5 hover:text-brand-copper">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                <a href={`mailto:${client.email}`}>{client.email}</a>
                                            </div>
                                        )}
                                        {client.phone && (
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                {client.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap md:flex-col lg:flex-row gap-4 md:items-end lg:items-center">
                                    {client.payFrequency && (
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <div className="text-xs font-medium text-slate-600">
                                                Pays: <span className="text-slate-900">{client.payFrequency}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        {client.portalLink && (
                                            <a
                                                href={client.portalLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-sm font-medium text-brand-copper hover:underline bg-brand-mist/30 px-3 py-1.5 rounded-lg transition-colors hover:bg-brand-mist/50"
                                            >
                                                Vendor Portal <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => deleteClient(client.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Client</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                <input
                                    autoFocus
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                    value={newClient.name || ''}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                    placeholder="e.g. Solutionstar"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Point of Contact</label>
                                <input
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                    value={newClient.contactName || ''}
                                    onChange={e => setNewClient({ ...newClient, contactName: e.target.value })}
                                    placeholder="e.g. Jane Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pay Dates / Frequency</label>
                                <input
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                    value={newClient.payFrequency || ''}
                                    onChange={e => setNewClient({ ...newClient, payFrequency: e.target.value })}
                                    placeholder="e.g. Net 30, Every Friday"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                    value={newClient.email || ''}
                                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                    placeholder="contact@firm.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                    value={newClient.phone || ''}
                                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                                    placeholder="(555) 555-5555"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Portal Link</label>
                                <input
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                    value={newClient.portalLink || ''}
                                    onChange={e => setNewClient({ ...newClient, portalLink: e.target.value })}
                                    placeholder="https://portal.example.com"
                                />
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="signedDocs"
                                    className="rounded border-slate-300 text-brand-copper focus:ring-brand-copper"
                                    checked={newClient.signedDocs}
                                    onChange={e => setNewClient({ ...newClient, signedDocs: e.target.checked })}
                                />
                                <label htmlFor="signedDocs" className="text-sm font-medium text-slate-700">Documents Signed & Submitted</label>
                            </div>
                            <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button className="bg-brand-copper text-white hover:bg-brand-copperDark" onClick={saveClient}>Save Client</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
