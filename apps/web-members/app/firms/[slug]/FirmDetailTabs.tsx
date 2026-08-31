'use client'

import {
    Building2, DollarSign, Wrench, Award, Phone, Mail,
    Globe, ExternalLink, Star, ShieldCheck, GraduationCap,
    Laptop, Package, Briefcase, BadgeCheck, MapPin
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { FirmRow } from './page'

type Props = {
    firm: FirmRow
    pay: string | null
    hasCompensation: boolean
    hasRequirements: boolean
    hasReputation: boolean
    hasContact: boolean
    hasCoordinates: boolean
    socialLinks: string[]
}

/* ── Helpers ─────────────────────────────────────────── */

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 py-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand/50" />
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-0.5 text-sm text-text-primary">{value}</p>
            </div>
        </div>
    )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-base font-bold text-text-primary">{title}</h2>
            {children}
        </div>
    )
}

/* ── Component ───────────────────────────────────────── */

export function FirmDetailTabs({
    firm,
    pay,
    hasCompensation,
    hasRequirements,
    hasReputation,
    hasContact,
    hasCoordinates,
    socialLinks,
}: Props) {
    // Determine default tab
    const defaultTab = 'overview'

    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="mb-6 !grid !h-auto w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:!inline-flex sm:flex-nowrap sm:justify-start sm:overflow-x-auto">
                <TabsTrigger value="overview" className="min-w-0 gap-1 text-xs sm:min-w-max sm:gap-1.5 sm:text-sm">
                    <Building2 className="h-3.5 w-3.5" /> Overview
                </TabsTrigger>
                {hasCompensation && (
                    <TabsTrigger value="compensation" className="min-w-0 gap-1 text-xs sm:min-w-max sm:gap-1.5 sm:text-sm">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="sm:hidden">Pay</span>
                        <span className="hidden sm:inline">Pay &amp; Volume</span>
                    </TabsTrigger>
                )}
                {hasRequirements && (
                    <TabsTrigger value="requirements" className="min-w-0 gap-1 text-xs sm:min-w-max sm:gap-1.5 sm:text-sm">
                        <Wrench className="h-3.5 w-3.5" /> Requirements
                    </TabsTrigger>
                )}
                {hasReputation && (
                    <TabsTrigger value="reputation" className="min-w-0 gap-1 text-xs sm:min-w-max sm:gap-1.5 sm:text-sm">
                        <Award className="h-3.5 w-3.5" /> Reputation
                    </TabsTrigger>
                )}
            </TabsList>

            {/* ─── Overview tab ─── */}
            <TabsContent value="overview" className="space-y-6">
                <SectionCard title="Firm snapshot">
                    <div className="grid gap-0 divide-y divide-border-subtle sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
                        {firm.industry_focus && (
                            <InfoRow icon={Briefcase} label="Industry focus" value={firm.industry_focus} />
                        )}
                        {firm.source && (
                            <InfoRow icon={Building2} label="Work Setting" value={firm.source} />
                        )}
                        {firm.company_type && (
                            <InfoRow icon={Building2} label="Company type" value={firm.company_type} />
                        )}
                        {firm.geographic_coverage && (
                            <InfoRow icon={MapPin} label="Coverage / territory" value={firm.geographic_coverage} />
                        )}
                        {firm.company_size && (
                            <InfoRow icon={Building2} label="Company size" value={firm.company_size} />
                        )}
                        {firm.services && (
                            <InfoRow icon={Briefcase} label="Services" value={firm.services} />
                        )}
                        {firm.specializations && (
                            <InfoRow icon={BadgeCheck} label="Specializations" value={firm.specializations} />
                        )}
                        {firm.founded && (
                            <InfoRow icon={Building2} label="Founded" value={firm.founded} />
                        )}
                    </div>
                </SectionCard>

                {/* Description expanded if long */}
                {firm.description && firm.description.length > 200 && (
                    <SectionCard title="About this firm">
                        <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                            {firm.description}
                        </p>
                    </SectionCard>
                )}

                {/* Assignment process */}
                {firm.assignment_process && (
                    <SectionCard title="Assignment process">
                        <p className="text-sm leading-relaxed text-text-secondary">{firm.assignment_process}</p>
                    </SectionCard>
                )}
            </TabsContent>

            {/* ─── Compensation tab ─── */}
            {hasCompensation && (
                <TabsContent value="compensation" className="space-y-6">
                    <SectionCard title="Pay and volume">
                        <div className="space-y-0 divide-y divide-border-subtle">
                            {pay && (
                                <div className="flex items-start gap-3 py-3">
                                    <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Typical pay range</p>
                                        <p className="mt-0.5 text-lg font-bold text-emerald-700">{pay}</p>
                                    </div>
                                </div>
                            )}
                            {firm.compensation_structure && (
                                <InfoRow icon={DollarSign} label="Compensation structure" value={firm.compensation_structure} />
                            )}
                            {firm.payment_frequency && (
                                <InfoRow icon={DollarSign} label="Payment frequency" value={firm.payment_frequency} />
                            )}
                            {firm.pay_type && (
                                <InfoRow icon={DollarSign} label="Pay model" value={firm.pay_type} />
                            )}
                            {firm.job_volume && (
                                <InfoRow icon={Briefcase} label="Job volume" value={firm.job_volume} />
                            )}
                        </div>
                    </SectionCard>

                    {/* Contextual tip */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Pay intel</p>
                        <p className="mt-1 text-sm text-blue-800/80">
                            Pay ranges are based on available data and may vary by region, experience, and order type.
                            Compare the firm profile, requirements, and service area before applying.
                        </p>
                    </div>
                </TabsContent>
            )}

            {/* ─── Requirements tab ─── */}
            {hasRequirements && (
                <TabsContent value="requirements" className="space-y-6">
                    <SectionCard title="Requirements and tools">
                        <div className="space-y-0 divide-y divide-border-subtle">
                            {firm.qualifications && (
                                <InfoRow icon={GraduationCap} label="Qualifications" value={firm.qualifications} />
                            )}
                            {firm.required_technology && (
                                <InfoRow icon={Laptop} label="Required technology" value={firm.required_technology} />
                            )}
                            {firm.equipment_requirements && (
                                <InfoRow icon={Wrench} label="Equipment needed" value={firm.equipment_requirements} />
                            )}
                            {firm.equipment_provision && (
                                <InfoRow icon={Package} label="Equipment provided by firm" value={firm.equipment_provision} />
                            )}
                        </div>
                    </SectionCard>

                    {(firm.training_provided || firm.onboarding_process) && (
                        <SectionCard title="Training and onboarding">
                            <div className="space-y-0 divide-y divide-border-subtle">
                                {firm.training_provided && (
                                    <InfoRow
                                        icon={GraduationCap}
                                        label="Training provided"
                                        value={firm.training_provided === 'TRUE' ? 'Yes — firm offers training' : firm.training_provided}
                                    />
                                )}
                                {firm.onboarding_process && (
                                    <InfoRow icon={Briefcase} label="Onboarding process" value={firm.onboarding_process} />
                                )}
                            </div>
                        </SectionCard>
                    )}
                </TabsContent>
            )}

            {/* ─── Reputation tab ─── */}
            {hasReputation && (
                <TabsContent value="reputation" className="space-y-6">
                    <SectionCard title="Reputation and reviews">
                        <div className="space-y-4">
                            {firm.contractor_rating != null && firm.contractor_rating > 0 && (
                                <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-amber-600">{firm.contractor_rating.toFixed(1)}</p>
                                        <div className="mt-1 flex items-center justify-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-3.5 w-3.5 ${i <= Math.round(firm.contractor_rating!)
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'text-slate-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">contractor rating</p>
                                    </div>
                                    <div className="flex-1 border-l border-border-subtle pl-4">
                                        <p className="text-sm text-text-secondary">
                                            {firm.contractor_rating >= 4
                                                ? 'Highly rated by contractors. This firm has a strong reputation among field workers.'
                                                : firm.contractor_rating >= 3
                                                    ? 'Moderately rated. Check recent reviews and ask other inspectors about current conditions.'
                                                    : 'Lower rated. Proceed with caution and verify pay terms before committing.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-0 divide-y divide-border-subtle">
                                {firm.bbb_status && (
                                    <InfoRow icon={ShieldCheck} label="BBB status" value={firm.bbb_status} />
                                )}
                                {firm.industry_recognition && (
                                    <InfoRow icon={Award} label="Industry recognition" value={firm.industry_recognition} />
                                )}
                                {firm.client_reviews && (
                                    <InfoRow icon={Star} label="Client reviews" value={firm.client_reviews} />
                                )}
                            </div>
                        </div>
                    </SectionCard>
                </TabsContent>
            )}
        </Tabs>
    )
}
