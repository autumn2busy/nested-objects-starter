import Image from 'next/image'
import Link from 'next/link'
import { Container } from './ui/container'
import { logoDataUrl } from '../lib/logoData'

const footerSections = [
  {
    title: 'Product',
    links: [
      { href: '/membership', label: 'Membership plans' },
      { href: '/directory', label: 'Firm directory' },
      { href: '/tools', label: 'AI tools' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/resources/firm-intel', label: 'Firm intel' },
      { href: '/resources', label: 'Learning hub' },
      { href: '/resources/checklists', label: 'Checklists' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Nested Objects' },
      { href: '/contact', label: 'Contact' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
]

export function SiteFooter({ containerClassName }: SiteFooterProps) {
  const containerClass = containerClassName ?? 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

  return (
    <footer className="mt-auto border-t border-brand-border bg-brand-dark text-brand-sand">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-3 text-sm text-brand-sand/90">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-steel">Vendor hub</p>
            <p className="text-base font-semibold text-white">Nested Objects</p>
            <p className="text-sm text-brand-sand/80">
              Compare firms, prep for routes, and get tools that help inspectors, notaries, and real estate pros plan smarter
              days on the road.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="space-y-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-sand/70">{section.title}</h3>
              <ul className="space-y-2 text-brand-sand/90">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="rounded-full transition hover:text-white hover:underline hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sand/60"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-brand-steel/40 pt-6">
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 shadow-sm shadow-slate-900/20">
            <Image src={logoDataUrl} alt="Nested Objects logo" width={28} height={28} />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-steel">Nested Objects</span>
              <span className="text-sm font-semibold text-white">Vendor Hub</span>
            </div>
          </div>
          <p className="text-[11px] text-brand-slate">© {new Date().getFullYear()} Nested Objects LLC. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  )
}
