'use client'

import { MEMBERSHIP_MANAGEMENT_URL, preserveHostedAccountNavigation } from '@/lib/membership-management'

export function MembershipManagementLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={MEMBERSHIP_MANAGEMENT_URL}
      onClickCapture={preserveHostedAccountNavigation}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-center text-sm font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
    >
      Manage or cancel membership
    </a>
  )
}

export function MembershipManagementPanel({ planLabel }: { planLabel: string }) {
  return (
    <section aria-labelledby="membership-management-heading" className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="membership-management-heading" className="font-bold text-slate-900">Membership and billing</h2>
          <p className="mt-1 text-sm text-slate-700">Current plan: {planLabel}</p>
        </div>
        <MembershipManagementLink className="shrink-0 bg-slate-900 text-white hover:bg-slate-700" />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Opens your secure account page. If asked, sign in, then choose Plan and Cancel subscription.
        Review the cancellation details there before confirming.
      </p>
    </section>
  )
}
