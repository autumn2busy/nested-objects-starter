import Link from 'next/link'

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/directory', label: 'Directory' },
  { href: '/membership', label: 'Membership' },
  { href: '/tools', label: 'Tools' },
  { href: '/resources', label: 'Resources' },
  { href: '/profile', label: 'Profile' },
]

export function DashboardSidebar() {
  return (
    <div className="rounded-2xl border border-brand-mist bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-brand-mist px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-copper text-lg font-semibold text-white">
          NO
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-steel">Workspace</p>
          <p className="text-base font-semibold text-brand-slate">Nested Objects</p>
        </div>
      </div>
      <nav className="space-y-1 p-4 text-sm font-medium text-brand-steel">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-brand-sand hover:text-brand-slate"
          >
            <span>{item.label}</span>
            <span aria-hidden className="text-xs text-brand-mist">
              •
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
