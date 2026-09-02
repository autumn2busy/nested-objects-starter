'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState, useRef } from 'react'
import { Camera, Loader2, Menu, X } from 'lucide-react'

import { useAuth } from './auth-provider'
import { Button, buttonVariants } from './ui/button'

type SiteHeaderProps = {
  containerClassName?: string
}

const navLinks = [
  { href: '/inspector-dashboard', label: 'Dashboard' },
  { href: '/hiring-firms', label: 'Firm Directory' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/challenges', label: 'Training' },
  { href: '/tools', label: 'Tools' },
  { href: '/membership-pricing', label: 'Plans' },
  { href: '/about-us', label: 'About' },
  { href: '/contact-us', label: 'Contact' },
  { href: '/profile', label: 'Profile' },
]

const authSlotClass = 'flex h-12 w-[9.75rem] shrink-0 items-center justify-end gap-2 text-sm font-semibold sm:w-[20rem] sm:gap-3'

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
    updateProfileAvatarUrl,
    accessToken,
  } = useAuth()
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const containerClass =
    containerClassName ?? 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

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
  const avatarUrl = profileAvatarUrl

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
        return 'Free'
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
        ? navLinks.filter((link) => link.href !== '/tools')
        : navLinks.filter((link) => link.href !== '/inspector-dashboard' && link.href !== '/profile'),
    [isAuthenticated],
  )

  // Handle avatar upload
  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed')
      return
    }

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const headers: HeadersInit = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      if (data.url) {
        updateProfileAvatarUrl(data.url)
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload avatar')
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
    }
  }

  return (
    <header className="sticky top-0 z-30 min-h-[4.5rem] overflow-x-clip border-b border-border-subtle bg-white/85 text-text-primary shadow-sm backdrop-blur-md">
      <div className={containerClass + ' flex min-h-[4.5rem] min-w-0 items-center justify-between gap-2 py-3'}>
        <div className="flex min-w-0 items-center gap-2 sm:gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Nested Objects home">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-strong/70 bg-brand-sand shadow-brand-soft sm:h-11 sm:w-11">
              <Image
                src="/logo.png"
                alt="Nested Objects logo"
                width={36}
                height={36}
                priority
              />
            </div>
            <div className="hidden min-w-0 flex-col leading-tight min-[360px]:flex">
              <span className="truncate text-sm font-semibold tracking-tight text-text-primary sm:text-base">
                Nested Objects
              </span>
              <span className="truncate text-[10px] uppercase tracking-[0.18em] text-brand-copper sm:text-[11px] sm:tracking-[0.2em]">
                Vendor hub
              </span>
            </div>
          </Link>

          <nav className="relative text-sm font-medium" aria-label="Primary">
            <Button
              type="button"
              aria-label={isNavOpen ? 'Close main navigation' : 'Open main navigation'}
              aria-expanded={isNavOpen}
              aria-controls="primary-navigation"
              onClick={() => setIsNavOpen((open) => !open)}
              variant="secondary"
              size="sm"
              shape="rounded"
              className="gap-2 md:hidden"
            >
              {isNavOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
              Menu
            </Button>

            <div
              id="primary-navigation"
              className={`${isNavOpen ? 'flex' : 'hidden'
                } fixed left-4 right-4 top-20 z-40 flex-col gap-1 rounded-2xl border border-brand-steel/40 bg-white px-2 py-2 shadow-xl md:static md:mt-0 md:flex md:flex-row md:items-center md:gap-1 md:border-none md:bg-transparent md:px-1 md:py-1 md:shadow-none`}
            >
              {visibleNavLinks.map((link) => {
                // Profile now links to /profile page instead of Outseta modal
                return (
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
                )
              })}
            </div>
          </nav>
        </div>

        <div className={authSlotClass}>
          {isLoading ? (
            <div className="flex w-full items-center justify-end gap-2" aria-hidden="true">
              <span className="h-9 w-14 rounded-lg border border-border-strong bg-surface-muted sm:w-20" />
              <span className="h-9 w-20 rounded-lg bg-brand-copper/90 sm:w-24" />
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex w-full items-center justify-end gap-2 sm:gap-3">
              {/* Hidden file input for avatar upload */}
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarChange}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
              />

              <div className="flex h-12 items-center gap-2 rounded-xl border border-border-subtle bg-white/90 p-2 shadow-brand-card sm:gap-3 sm:px-3">
                {/* Clickable Avatar */}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="group relative shrink-0"
                  title="Click to change profile picture"
                >
                  {isUploadingAvatar ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-copper/15">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-copper" />
                    </div>
                  ) : avatarUrl ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-10 w-10 rounded-full object-cover shadow-sm"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-copper/15 text-sm font-semibold text-brand-copperDark">
                      {initials}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>

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
            <div className="flex w-full items-center justify-end gap-2">
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                className={buttonVariants({
                  variant: 'secondary',
                  size: 'sm',
                  className: 'w-14 bg-white/80 backdrop-blur sm:w-auto',
                })}
              >
                Login
              </a>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register&planFamilyUid=L9nbKV9Z&planPaymentTerm=month&skipPlanOptions=true#o-anonymous"
                className={buttonVariants({
                  variant: 'primary',
                  size: 'sm',
                  className: 'w-20 sm:w-auto',
                })}
              >
                Join free
              </a>
              <p className="hidden text-[11px] leading-none text-text-muted sm:block">No credit card required</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
