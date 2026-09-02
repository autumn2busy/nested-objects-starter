import type { Metadata } from 'next'
import Link from 'next/link'
import { LockKeyhole, MapPin, ShieldCheck } from 'lucide-react'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { StarRating } from '@/components/ui/StarRating'
import { getAuthorizedMemberProfile } from '@/lib/member-profile-access'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Never look up a person's name or private resume to produce public metadata.
export const metadata: Metadata = {
  title: 'Member Profile | Nested Objects',
  description: 'Private professional profile.',
  robots: { index: false, follow: false, noarchive: true },
}

export default async function MemberProfilePage({ params }: { params: { memberId: string } }) {
  const { profile } = await getAuthorizedMemberProfile(params.memberId)
  const fullName = profile.display_name || 'Member'
  const initials = fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const serviceArea = [profile.city, profile.state].filter(Boolean).join(', ')
    || profile.service_areas?.join(', ')
  const primaryServices = profile.primary_services?.split(',').map((service) => service.trim()).filter(Boolean) ?? []

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <Link href="/profile" className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
        ← Back to my profile settings
      </Link>

      <div className="my-6 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <LockKeyhole aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Your profile is private. Only you can view it. Other members and visitors cannot see it. Firm access is not available in this release.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-slate-900 to-teal-900" />
        <div className="px-6 pb-7 sm:px-8">
          <div className="-mt-10 mb-5 flex items-end justify-between gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-3xl font-semibold text-slate-600">
              {initials}
            </div>
            <Link href="/profile" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Edit my profile</Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{fullName}</h1>
            {profile.verified_at && <VerifiedBadge date={profile.verified_at} />}
          </div>
          <p className="mt-2 text-slate-600">{profile.role || profile.experience_level || 'Field professional'}</p>
          {serviceArea && <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><MapPin aria-hidden="true" className="h-4 w-4" />{serviceArea}</p>}
          <div className="mt-4">
            {profile.rating ? <StarRating rating={profile.rating} count={profile.rating_count ?? 0} /> : <span className="text-sm text-slate-500">Not yet rated</span>}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Professional summary</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{profile.bio || 'No professional summary added yet.'}</p>
          </section>
          {primaryServices.length > 0 && <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Primary services</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {primaryServices.map((service, index) => <li key={`${service}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">{service}</li>)}
            </ul>
          </section>}
        </div>
        <aside>
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Profile signals</h2>
            <p className="mt-3 text-sm text-slate-600">Verification and completed training help firms assess qualifications. Membership level is not a verification.</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-500">Training completed</dt><dd className="font-medium text-slate-800">{profile.training_modules_completed ?? 0} modules</dd></div>
              {profile.trust_score != null && <div><dt className="text-slate-500">Trust score</dt><dd className="font-medium text-slate-800">{profile.trust_score}/100</dd></div>}
            </dl>
          </section>
        </aside>
      </div>
    </main>
  )
}
