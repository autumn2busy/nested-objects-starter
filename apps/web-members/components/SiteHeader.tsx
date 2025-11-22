'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useAuth } from './auth-provider'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/membership', label: 'Membership' },
  { href: '/directory', label: 'Directory' },
  { href: '/tools', label: 'Tools' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated, logout, planUid, profileDisplayName } = useAuth()

  const initials = useMemo(() => {
    const name =
      (profileDisplayName as string | null) ??
      ((user as any)?.first_name as string | undefined) ??
      ((user as any)?.FirstName as string | undefined) ??
      (user?.name ? user.name.split(' ')[0] : undefined) ??
      (user?.email ? user.email.split('@')[0] : undefined) ??
      'Member'

    return name.charAt(0).toUpperCase()
  }, [profileDisplayName, user])

  const activeLink = (href: string) =>
    href === '/' ? pathname === href : pathname?.startsWith(href)

  const planLabel = (() => {
    switch (planUid) {
      case 'L9nbKV9Z':
        return 'Starter'
      case 'rQVqlLm6':
        return 'Pro'
      case 'NmdnNO90':
        return 'Elite'
      case 'rmk5Xk9g':
        return 'Agency'
      default:
        return null
    }
  })()

  return (
    <header className="sticky top-0 z-30 border-b border-brand-copper/20 bg-brand-sand/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 rounded-full border border-brand-copper/30 bg-white/80 px-3 py-1.5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-copper text-sm font-semibold text-white shadow-inner">
              {`{}`}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-brand-dark">Nested Objects</span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-brand-steel">Member hub</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            <div className="flex items-center gap-1 rounded-full border border-brand-copper/25 bg-white/80 px-2 py-1 shadow-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    activeLink(link.href)
                      ? 'bg-brand-copper text-white shadow'
                      : 'text-brand-dark/80 hover:bg-brand-mist hover:text-brand-dark'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <span className="text-xs text-brand-steel">Checking your hub…</span>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-brand-copper/25 bg-white/80 px-3 py-1 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-copper/15 text-xs font-semibold text-brand-copperDark">
                  {initials}
                </div>
                <div className="hidden flex-col items-start text-xs sm:flex">
                  <span className="font-semibold text-brand-dark">{user.name || user.email}</span>
                  {planLabel && (
                    <span className="text-[11px] uppercase tracking-wide text-brand-steel">{planLabel} plan</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="rounded-full border border-brand-copper/40 px-3 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-mist"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                className="rounded-full border border-brand-copper/40 px-3 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-mist"
              >
                Login
              </a>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                className="hidden rounded-full bg-brand-copper px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-copperDark sm:inline-flex"
              >
                Join free
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
