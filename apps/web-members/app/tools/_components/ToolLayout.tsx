import Link from 'next/link'
import { ReactNode } from 'react'

const DEFAULT_NAV_LINKS = [
  { href: '/inspector-dashboard', label: 'Dashboard' },
  { href: '/hiring-firms', label: 'Directory' },
  { href: '/membership-pricing', label: 'Membership' },
]

interface ToolLayoutProps {
  title: string
  description: string
  eyebrow?: string
  backHref?: string
  navLinks?: { href: string; label: string }[]
  children: ReactNode
}

export function ToolLayout({
  title,
  description,
  eyebrow = 'Tools',
  backHref = '/tools',
  navLinks = DEFAULT_NAV_LINKS,
  children,
}: ToolLayoutProps) {
  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Link
                href={backHref}
                className="inline-flex items-center text-sm font-semibold text-brand-copper transition hover:text-brand-copperDark"
              >
                ← Back to tools
              </Link>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">{eyebrow}</p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
                <p className="max-w-3xl text-base text-slate-700">{description}</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand-copper">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-copper/30 bg-white px-3 py-1.5 text-brand-copper transition hover:border-brand-copper hover:text-brand-copperDark"
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">{children}</div>
    </main>
  )
}
