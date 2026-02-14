import Link from 'next/link'

interface DashboardHeaderProps {
  firstName: string
  initials: string
  planName: string
  onLogout: () => void
}

export function DashboardHeader({ firstName, initials, planName, onLogout }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-brand-mist bg-white/80 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-start gap-4 sm:items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-copper text-lg font-bold text-white shadow-sm">
          NO
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-steel">Dashboard</p>
          <div className="flex items-center gap-3 text-lg font-semibold text-brand-slate">
            <span>Nested Objects</span>
            <span className="rounded-full bg-brand-sand px-3 py-1 text-xs font-medium text-brand-steel">{planName} plan</span>
          </div>
          <nav className="flex flex-wrap gap-x-4 text-sm text-brand-steel">
            <Link className="transition hover:text-brand-copper" href="/">
              Home
            </Link>
            <Link className="transition hover:text-brand-copper" href="/hiring-firms">
              Directory
            </Link>
            <Link className="transition hover:text-brand-copper" href="/membership-pricing">
              Membership
            </Link>
            <Link className="transition hover:text-brand-copper" href="/inspector-resource-center">
              Resources
            </Link>
          </nav>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-mist bg-white text-brand-slate shadow-sm transition hover:border-brand-copper hover:text-brand-copper"
        >
          <BellIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Toggle workspace"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-mist bg-white text-brand-slate shadow-sm transition hover:border-brand-copper hover:text-brand-copper"
        >
          <SparkIcon className="h-5 w-5" />
        </button>
        <Link href="/profile" className="group flex items-center gap-3 rounded-full border border-brand-mist bg-white px-3 py-1.5 text-left shadow-sm transition hover:border-brand-copper">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-sand text-sm font-semibold text-brand-slate">
            {initials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-brand-slate group-hover:text-brand-copper">{firstName}</p>
            {planName !== 'Unknown' && (
              <p className="text-xs text-brand-steel">{planName} member</p>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-full bg-brand-copper px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
        >
          Log out
        </button>
      </div>
    </header>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 17H9a3 3 0 0 1-3-3v-2a6 6 0 1 1 12 0v2a3 3 0 0 1-3 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3v6m0 6v6m6-6h-6m-6 0h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8 5 5m11 3 3-3m-3 14 3 3m-13-3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
