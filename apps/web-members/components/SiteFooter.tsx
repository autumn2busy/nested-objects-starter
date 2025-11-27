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
      { href: '/resources/checklists', label: 'Checklists' },
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
    <footer className="border-t border-brand-steel/30 bg-white/95 text-brand-dark">
      <div className={`${containerClass} py-10`}>
        <div className="grid gap-8 md:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-3 text-sm text-brand-slate">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Vendor hub</p>
            <p className="text-base font-semibold text-brand-dark">Nested Objects</p>
            <p className="text-sm text-brand-slate">
              Compare firms, prep for routes, and get tools that help inspectors, notaries, and real estate pros plan smarter days on the road.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="space-y-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-slate">
                {section.title}
              </h3>
              <ul className="space-y-2 text-brand-slate">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition hover:text-brand-copper hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-brand-steel/30 pt-6">
          <div className="flex items-center gap-3 rounded-full border border-brand-steel/40 bg-brand-sand px-4 py-2 shadow-brand-soft">
            <Image src="/logo-light.png" alt="Nested Objects logo" width={28} height={28} />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Nested Objects</span>
              <span className="text-sm font-semibold text-brand-dark">Vendor Hub</span>
            </div>
          </div>
          <p className="text-[11px] text-brand-slate">© {new Date().getFullYear()} Nested Objects LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
