import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://nestedobjects.com'),
  title: {
    default: 'Nested Objects — Field Inspector Directory, Training & AI Tools',
    template: '%s | Nested Objects',
  },
  description: 'The #1 platform for field inspectors, notaries, and property preservation contractors. Browse 460+ hiring firms, get trained, and level up with AI tools.',
  openGraph: {
    type: 'website',
    siteName: 'Nested Objects',
    locale: 'en_US',
  },
  robots: {
    index: false,
    follow: false,
  },
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Nested<span className="text-brand">Objects</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/guides" className="transition hover:text-brand">Guides</Link>
          <Link href="/pricing" className="transition hover:text-brand">Pricing</Link>
          <Link href="/about" className="transition hover:text-brand">About</Link>
          <a
            href="https://members.nestedobjects.com/hiring-firms"
            className="transition hover:text-brand"
          >
            Directory
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="https://members.nestedobjects.com"
            className="text-sm font-medium text-slate-600 transition hover:text-brand"
          >
            Log in
          </a>
          <a
            href="https://members.nestedobjects.com/membership-pricing"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Join Free
          </a>
        </div>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Nested<span className="text-brand">Objects</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              For inspectors. By inspectors.<br />
              Helping underestimated workers find, learn, and earn in field services.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resources</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/guides" className="hover:text-brand">Guides</Link></li>
              <li><a href="https://members.nestedobjects.com/hiring-firms" className="hover:text-brand">Firm Directory</a></li>
              <li><a href="https://members.nestedobjects.com/training" className="hover:text-brand">Training</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/about" className="hover:text-brand">About</Link></li>
              <li><Link href="/contact" className="hover:text-brand">Contact</Link></li>
              <li><Link href="/pricing" className="hover:text-brand">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Brands</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><a href="https://members.nestedobjects.com" className="hover:text-brand">Member Hub</a></li>
              <li><a href="https://flynerdofficial.com" className="hover:text-brand">Fly Nerd</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Nested Objects LLC. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-5HPX4VTQ');
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-brand-sand text-slate-900 antialiased">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5HPX4VTQ"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
