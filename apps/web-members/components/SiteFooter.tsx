import Image from 'next/image'
import Link from 'next/link'

type SiteFooterProps = {
  containerClassName?: string
}

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
      { href: '/resources/readiness-guides', label: 'Readiness guides' },
      { href: '/resources/industry-news', label: 'Industry news' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Nested Objects' },
      { href: '/contact', label: 'Contact' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms-conditions', label: 'Terms & conditions' },
      { href: '/refund-policy', label: 'Refund policy' },
      { href: '/faqs', label: 'FAQs' },
    ],
  },
]

export function SiteFooter({ containerClassName }: SiteFooterProps) {
  const containerClass = containerClassName ?? 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

  return (
    <footer className="border-t border-border-subtle bg-surface-muted/90 text-text-primary">
      <div className={`${containerClass} py-12 md:py-14`}>
        <div className="grid gap-10 md:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-3 text-sm text-text-secondary">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-copper">Vendor hub</p>
            <p className="text-base font-semibold text-text-primary">Nested Objects</p>
            <p className="text-sm text-text-secondary">
              Compare firms, prep for routes, and get tools that help inspectors, notaries, and real estate pros plan smarter days on the road.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="space-y-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {section.title}
              </h3>
              <ul className="space-y-2 text-text-secondary">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition hover:text-text-primary hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border-subtle pt-6 text-xs text-text-secondary">
          <div className="flex items-center gap-3 rounded-full border border-border-strong/70 bg-white px-4 py-2 shadow-brand-soft">
            <Image src="/logo.png" alt="Nested Objects logo" width={28} height={28} />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-copper">Nested Objects</span>
              <span className="text-sm font-semibold text-text-primary">Vendor Hub</span>
            </div>
          </div>
          <p className="text-[11px]">© {new Date().getFullYear()} Nested Objects LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
