import Link from 'next/link'
import { ReactNode } from 'react'
import { Container } from '@/components/ui/container'

const DEFAULT_NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/directory', label: 'Directory' },
  { href: '/membership', label: 'Membership' },
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
    <main className="min-h-screen bg-brand-background text-brand-heading">
      <section className="border-b border-brand-primary/15 bg-gradient-to-b from-brand-soft via-brand-surface to-brand-background">
        <Container className="flex flex-col gap-6 py-10 lg:py-14">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Link
                href={backHref}
                className="inline-flex items-center text-sm font-semibold text-brand-primary transition hover:text-brand-primaryDark"
              >
                ← Back to tools
              </Link>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{eyebrow}</p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
                <p className="max-w-3xl text-base text-brand-muted">{description}</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand-primary">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-brand-primary transition hover:border-brand-primary hover:text-brand-primaryDark"
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>
          </div>
        </Container>
      </section>

      <Container className="space-y-10 py-12 lg:py-16">{children}</Container>
    </main>
  )
}
