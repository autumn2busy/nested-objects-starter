'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'
import { useAuth } from '@/components/auth-provider'
import { ArrowLeft } from 'lucide-react'

export default function SponsorEquipmentPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        {isAuthenticated && (
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center text-sm text-text-secondary hover:text-brand-copper hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to dashboard
          </Link>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Recommended gear and sponsor partners
        </h1>
        <p className="mt-2 text-lg text-text-secondary">
          Ladders, cameras, tablets, and safety gear vetted for mortgage field and PDC work.
        </p>
      </div>

      <Gate feature="sponsor_equipment_links">
        <section className="prose prose-slate max-w-none rounded-2xl bg-white p-6 shadow-sm border border-border-subtle">
          <p className="mb-4">
            This page will hold sponsor cards with links to recommended inspection gear, along with
            notes about why each item works well in the field.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Feature core gear lists for new inspectors.</li>
            <li>Highlight premium setups for heavy route runners.</li>
            <li>Attach affiliate links or sponsor tracking where appropriate.</li>
          </ul>
        </section>
      </Gate>
    </div>
  )
}

