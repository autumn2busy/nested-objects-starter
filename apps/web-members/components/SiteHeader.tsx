'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { useAuth } from './auth-provider'
import { useProfile } from '@/lib/use-profile'
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
  const {
    user,
    isLoading,
    isAuthenticated,
    logout,
    planUid,
    profileDisplayName,
    profileAvatarUrl,
  } = useAuth()
  const [isNavOpen, setIsNavOpen] = useState(false)
  const containerClass =
    containerClassName ?? 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

  const userEmail =
    (user?.email as string | undefined) ?? (user?.Email as string | undefined) ?? null

  const { profile } = useProfile(userEmail)

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
  const avatarUrl = profileAvatarUrl ?? profile?.avatar_url ?? null

  const activeLink = (href: string) => {
    if (!pathname) return false
    if (href === '/') return pathname === '/'

    const activeRoot = pathname.replace(/^\/+/, '').split('/')[0]
    const hrefRoot = href.replace(/^\/+/, '').split('/')[0]

    return activeRoot === hrefRoot
  }

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

  const visibleNavLinks = useMemo(
    () =>
      isAuthenticated
        ? navLinks
        : navLinks.filter((link) => link.href !== '/dashboard' && link.href !== '/profile'),
    [isAuthenticated],
  )

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-white/85 text-text-primary backdrop-blur-md shadow-sm">
      <div className={containerClass + ' flex items-center justify-between py-3'}>
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Nested Objects home">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-strong/70 bg-brand-sand shadow-brand-soft">
              <Image
                src="/logo-light.png"
                alt="Nested Objects logo"
                width={36}
                height={36}
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight text-text-primary">
                Nested Objects
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-brand-copper">
                Vendor hub
              </span>
            </div>
          </Link>

          <nav className="relative text-sm font-medium" aria-label="Primary">
            <Button
              type="button"
              aria-expanded={isNavOpen}
              aria-controls="primary-navigation"
              onClick={() => setIsNavOpen((open) => !open)}
              variant="secondary"
              size="sm"
              shape="rounded"
              className="gap-2 md:hidden"
            >
              <span className="flex flex-col gap-1" aria-hidden>
                <span className="block h-0.5 w-5 bg-text-primary" />
                <span className="block h-0.5 w-5 bg-text-primary" />
                <span className="block h-0.5 w-5 bg-text-primary" />
              </span>
              Menu
            </Button>

            <div
              id="primary-navigation"
              className={`${
                isNavOpen ? 'flex' : 'hidden'
              } absolute left-0 right-0 top-full z-20 mt-3 flex-col gap-1 rounded-2xl border border-brand-steel/40 bg-white px-1 py-2 shadow-xl md:static md:mt-0 md:flex md:flex-row md:items-center md:gap-1 md:border-none md:bg-transparent md:px-1 md:py-1 md:shadow-none`}
            >
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={buttonVariants({
                    variant: activeLink(link.href) ? 'primary' : 'ghost',
                    size: 'sm',
                    shape: 'rounded',
                    active: activeLink(link.href),
                    className: 'w-full justify-start md:w-auto md:justify-center',
                  })}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm font-semibold">
          {isLoading ? (
            <span className="text-xs text-text-secondary">Checking your hub…</span>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-white/90 px-3 py-2 shadow-brand-card">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-10 w-10 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-copper/15 text-sm font-semibold text-brand-copperDark">
                    {initials}
                  </div>
                )}
                <div className="hidden flex-col text-left text-xs sm:flex">
                  <span className="font-semibold text-text-primary">
                    {profileDisplayName ?? displayName}
                  </span>
                  {planLabel && (
                    <span className="text-[11px] uppercase tracking-wide text-brand-copper">
                      {planLabel} plan
                    </span>
                  )}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => logout()}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                className={buttonVariants({
                  variant: 'secondary',
                  size: 'sm',
                  className: 'bg-white/80 backdrop-blur',
                })}
              >
                Login
              </a>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                className={buttonVariants({
                  variant: 'primary',
                  size: 'sm',
                  className: 'hidden sm:inline-flex',
                })}
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
