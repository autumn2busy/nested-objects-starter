'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth-provider'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/profile', label: 'Profile' },
  { href: '/about', label: 'About' },
  { href: '/membership', label: 'Membership' },
  { href: '/directory', label: 'Directory' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated, logout, planUid, profileDisplayName } = useAuth()
  const [isNavOpen, setIsNavOpen] = useState(false)

  const displayName = useMemo(() => {
    return (
      (profileDisplayName as string | null) ??
      ((user as any)?.first_name as string | undefined) ??
      ((user as any)?.FirstName as string | undefined) ??
      (user?.name ? user.name.split(' ')[0] : undefined) ??
      (user?.email ? user.email.split('@')[0] : undefined) ??
      'Member'
    )
  }, [profileDisplayName, user])

  const initials = displayName.charAt(0).toUpperCase()

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

  useEffect(() => {
    setIsNavOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-30 border-b border-brand-copper/30 bg-gradient-to-r from-brand-dark via-brand-slate to-brand-dark text-brand-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Nested Objects home">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-brand-copper/60 bg-brand-dark/70 shadow-inner">
              <Image src="/logo-copper-charcoal.svg" alt="Nested Objects logo" width={28} height={28} priority />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight text-white">Nested Objects</span>
              <span className="text-[11px] uppercase tracking-[0.24em] text-brand-copper/90">Member hub</span>
            </div>
          </Link>

          <nav className="relative text-sm font-medium" aria-label="Primary">
            <button
              type="button"
              aria-expanded={isNavOpen}
              aria-controls="primary-navigation"
              onClick={() => setIsNavOpen((open) => !open)}
              className="flex items-center gap-2 rounded border border-brand-copper/50 bg-brand-dark/70 px-3 py-2 text-xs font-semibold text-brand-sand transition hover:bg-brand-dark/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper md:hidden"
            >
              <span className="flex flex-col gap-1" aria-hidden>
                <span className="block h-0.5 w-5 bg-white" />
                <span className="block h-0.5 w-5 bg-white" />
                <span className="block h-0.5 w-5 bg-white" />
              </span>
              Menu
            </button>

            <div
              id="primary-navigation"
              className={`${isNavOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full z-20 mt-3 flex-col gap-1 border border-brand-copper/40 bg-brand-dark/95 px-1 py-2 shadow-lg md:static md:mt-0 md:flex md:flex-row md:items-center md:gap-1 md:bg-transparent md:px-1 md:py-1 md:shadow-none`}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded px-3 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper ${
                    activeLink(link.href)
                      ? 'bg-brand-copper text-brand-dark shadow-sm'
                      : 'text-brand-sand/80 hover:bg-brand-dark/70 hover:text-white'
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
            <span className="text-xs text-brand-copper/80">Checking your hub…</span>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded border border-brand-copper/30 bg-brand-dark/70 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-brand-copper/20 text-xs font-semibold text-brand-copper">
                  {initials}
                </div>
                <div className="hidden flex-col text-left text-xs sm:flex">
                  <span className="font-semibold text-white">{profileDisplayName ?? displayName}</span>
                  {planLabel && <span className="text-[11px] uppercase tracking-wide text-brand-copper/80">{planLabel} plan</span>}
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="rounded border border-brand-copper/50 px-3 py-2 text-xs font-semibold text-brand-sand transition hover:bg-brand-dark/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                className="rounded border border-brand-copper/50 px-3 py-2 text-xs font-semibold text-brand-sand transition hover:bg-brand-dark/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
              >
                Login
              </a>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                className="hidden rounded border border-brand-copper bg-brand-copper px-4 py-2 text-xs font-semibold text-brand-dark shadow-sm transition hover:border-brand-copperDark hover:bg-brand-copperDark hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper sm:inline-flex"
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
