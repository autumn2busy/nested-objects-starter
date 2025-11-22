import Link from 'next/link'

export function DashboardBreadcrumbs() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-steel">
      <Link className="hover:text-brand-copper" href="/">
        Home
      </Link>
      <span aria-hidden className="text-brand-mist">
        /
      </span>
      <Link className="hover:text-brand-copper" href="/dashboard">
        Dashboard
      </Link>
      <span aria-hidden className="text-brand-mist">
        /
      </span>
      <span className="text-brand-slate">Overview</span>
    </div>
  )
}
