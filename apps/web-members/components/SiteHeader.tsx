'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Container } from './ui/container'
import { useAuth } from './auth-provider'
import { Button, buttonVariants } from './ui/button'

type SiteHeaderProps = {
  containerClassName?: string
}

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

export function SiteHeader({ containerClassName }: SiteHeaderProps) {
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated, logout, planUid, profileDisplayName } = useAuth()
  const [isNavOpen, setIsNavOpen] = useState(false)
  const containerClass = containerClassName ?? 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

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

  const activeLink = (href: string) => (href === '/' ? pathname === href : pathname?.startsWith(href))

  const planLabel = (() => {
    switch (planUid) {
      case 'L9nbKV9Z':
        return 'Starter'
      case 'zWZD0rQp':
        return 'Directory'
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
    <header className="sticky top-0 z-30 border-b border-brand-border/70 bg-brand-surface/95 text-brand-heading backdrop-blur">
      <Container className="flex items-center justify-between py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Nested Objects home">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-brand-soft shadow-brand-soft">
              <Image src="/logo-copper-charcoal.svg" alt="Nested Objects logo" width={28} height={28} priority />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight">Nested Objects</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-brand-muted">Vendor hub</span>
            </div>
          </Link>

          <nav className="relative text-sm font-semibold" aria-label="Primary">
            <button
              type="button"
              aria-expanded={isNavOpen}
              aria-controls="primary-navigation"
              onClick={() => setIsNavOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-heading shadow-sm transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary md:hidden"
            >
              <span className="flex flex-col gap-1" aria-hidden>
                <span className="block h-0.5 w-5 bg-brand-heading" />
                <span className="block h-0.5 w-5 bg-brand-heading" />
                <span className="block h-0.5 w-5 bg-brand-heading" />
              </span>
              Menu
            </Button>

            <div
              id="primary-navigation"
              className={cn(
                'absolute left-0 right-0 top-full z-20 mt-3 flex-col gap-1 rounded-2xl border border-brand-border bg-brand-surface/95 p-2 shadow-brand-card md:static md:mt-0 md:flex md:flex-row md:items-center md:gap-1 md:border-none md:bg-transparent md:p-1 md:shadow-none',
                isNavOpen ? 'flex' : 'hidden md:flex',
              )}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={activeLink(link.href) ? 'page' : undefined}
                  className={cn(
                    'block rounded-full px-3 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary',
                    activeLink(link.href)
                      ? 'bg-brand-highlight text-brand-primary ring-1 ring-brand-primary/30'
                      : 'text-brand-muted hover:bg-brand-soft hover:text-brand-heading',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm font-semibold">
          {isLoading ? (
            <span className="text-xs text-brand-muted">Checking your hub…</span>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface px-3 py-2 shadow-brand-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-highlight text-sm font-semibold text-brand-primary">
                  {initials}
                </div>
                <div className="hidden flex-col text-left text-xs sm:flex">
                  <span className="font-semibold text-brand-heading">{profileDisplayName ?? displayName}</span>
                  {planLabel && <span className="text-[11px] uppercase tracking-wide text-brand-primary">{planLabel} plan</span>}
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="rounded-full border border-brand-border px-3 py-2 text-xs font-semibold text-brand-heading transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                className="rounded-full border border-brand-border bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-heading shadow-sm transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
              >
                Login
              </a>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                className="hidden rounded-full border border-brand-primary bg-brand-primary px-4 py-2 text-xs font-semibold text-white shadow-brand-soft transition hover:bg-brand-primaryDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary sm:inline-flex"
              >
                Join free
              </a>
            </div>
          )}
        </div>
      </Container>
    </header>
  )
}
