'use client'
import { BlurGate } from '@/components/BlurGate'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Users, Mail, Phone, ExternalLink, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/components/auth-provider'


export const dynamic = 'force-dynamic'

type Client = {
    id: string
    user_id: string
    name: string
    primary_contact: string | null
    email: string | null
    phone: string | null
    payment_terms: string | null
    website: string | null
    relationship_status: 'active' | 'inactive' | 'pending'
    notes: string | null
    entity_type: string
}

export default function ClientsPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const [clients, setClients] = useState<Client[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newClient, setNewClient] = useState<Partial<Client>>({
        relationship_status: 'active',
        entity_type: 'firm'
    })

    useEffect(() => {
        if (user) {
            fetchClients()
        }
    }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('client_vendor_tracker')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setClients(data as Client[])
        } catch (error) {
            console.error('Error fetching clients:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const saveClient = async () => {
        if (!newClient.name || !user) return

        try {
            const payload = {
                user_id: user.sub,
                name: newClient.name,
                primary_contact: newClient.primary_contact,
                email: newClient.email,
                phone: newClient.phone,
                payment_terms: newClient.payment_terms,
                website: newClient.website,
                relationship_status: newClient.relationship_status || 'active',
                entity_type: newClient.entity_type || 'firm',
                notes: newClient.notes
            }

            const { data, error } = await supabase
                .from('client_vendor_tracker')
                .insert([payload])
                .select()

            if (error) throw error

            setClients([data[0] as Client, ...clients])
            setNewClient({ relationship_status: 'active', entity_type: 'firm' })
            setIsModalOpen(false)
        } catch (error) {
            console.error('Error saving client:', error)
            alert('Failed to save client')
        }
    }

    const deleteClient = async (id: string) => {
        if (!confirm('Are you sure you want to delete this client?')) return
        try {
            const { error } = await supabase.from('client_vendor_tracker').delete().eq('id', id)
            if (error) throw error
            setClients(clients.filter(c => c.id !== id))
        } catch (error) {
            console.error('Error deleting client:', error)
        }
    }

    return (
        <BlurGate
            feature="job_tracking"
            title="Client Tracker is a paid feature"
            description="Track your vendor relationships, contacts, and pay schedules. Upgrade to access this and all other Vendor Hub tools."
        >
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
                    {clients.length === 0 && !isLoading ? (
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
                                <div key={client.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between hover:shadow-md transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-xl text-slate-900">{client.name}</h3>
                                            {client.relationship_status === 'active' && (
                                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                    Active
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                            {client.primary_contact && (
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    {client.primary_contact}
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
                                        {client.payment_terms && (
                                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <div className="text-xs font-medium text-slate-600">
                                                    Pays: <span className="text-slate-900">{client.payment_terms}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            {client.website && (
                                                <a
                                                    href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 text-sm font-medium text-brand-copper hover:underline bg-brand-mist/30 px-3 py-1.5 rounded-lg transition-colors hover:bg-brand-mist/50"
                                                >
                                                    Portal <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => deleteClient(client.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                                        value={newClient.primary_contact || ''}
                                        onChange={e => setNewClient({ ...newClient, primary_contact: e.target.value })}
                                        placeholder="e.g. Jane Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Pay Dates / Frequency</label>
                                    <input
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                        value={newClient.payment_terms || ''}
                                        onChange={e => setNewClient({ ...newClient, payment_terms: e.target.value })}
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
                                        value={newClient.website || ''}
                                        onChange={e => setNewClient({ ...newClient, website: e.target.value })}
                                        placeholder="https://portal.nestedobjects.com"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper focus:border-transparent outline-none"
                                        value={newClient.relationship_status}
                                        onChange={e => setNewClient({ ...newClient, relationship_status: e.target.value as any })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
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
        </BlurGate>
    )
}
