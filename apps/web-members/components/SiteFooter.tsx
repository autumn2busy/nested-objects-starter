import Image from 'next/image'
import Link from 'next/link'

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

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-brand-slate text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-3 text-sm text-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Member hub</p>
            <p className="text-base font-semibold text-white">Nested Objects</p>
            <p className="text-sm text-slate-300">
              Compare firms, prep for routes, and get tools that help inspectors, notaries, and real
              estate pros plan smarter days on the road.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="space-y-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                {section.title}
              </h3>
              <ul className="space-y-2 text-slate-200">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition hover:text-white hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 shadow-sm shadow-slate-900/20">
            <Image src="/logo-light.svg" alt="Nested Objects logo" width={28} height={28} />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Nested Objects</span>
              <span className="text-sm font-semibold text-white">Member Hub</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">© {new Date().getFullYear()} Nested Objects LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
