'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useAuth } from './auth-provider'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/membership', label: 'Membership' },
  { href: '/directory', label: 'Directory' },
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
    <header className="sticky top-0 z-30 border-b border-brand-slate/30 bg-brand-dark/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Nested Objects home">
            <div className="flex h-10 w-10 items-center justify-center border border-brand-steel/40 bg-brand-slate/60">
              <Image src="/logo-light.svg" alt="Nested Objects logo" width={28} height={28} priority />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight">Nested Objects</span>
              <span className="text-[11px] uppercase tracking-[0.24em] text-brand-steel">Member hub</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium md:flex" aria-label="Primary">
            <div className="flex items-center gap-1 border border-brand-steel/40 bg-brand-slate/60 px-1 py-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal ${
                    activeLink(link.href)
                      ? 'bg-brand-copper text-black'
                      : 'text-white/80 hover:bg-brand-slate/80 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm font-semibold">
          {isLoading ? (
            <span className="text-xs text-brand-steel">Checking your hub…</span>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 border border-brand-steel/40 bg-brand-slate/60 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center bg-brand-teal/20 text-xs font-semibold text-brand-tealDark">
                  {initials}
                </div>
                <div className="hidden flex-col text-left text-xs sm:flex">
                  <span className="font-semibold text-white">{user.name || user.email}</span>
                  {planLabel && <span className="text-[11px] uppercase tracking-wide text-brand-steel">{planLabel} plan</span>}
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="border border-brand-steel/50 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-slate/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                className="border border-brand-steel/50 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-slate/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
              >
                Login
              </a>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                className="hidden border border-brand-copper bg-brand-copper px-4 py-2 text-xs font-semibold text-black shadow-sm transition hover:border-brand-copperDark hover:bg-brand-copperDark hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal sm:inline-flex"
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
