import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://firms.nestedobjects.com'),
  title: {
    default: 'Nested Objects for Firms — Source Vetted Field Inspectors Nationwide',
    template: '%s | Nested Objects for Firms',
  },
  description: 'The #1 platform for hiring firms to source, vet, and deploy field inspectors, notaries, and property preservation contractors across all 50 states.',
  openGraph: {
    type: 'website',
    siteName: 'Nested Objects for Firms',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
}

function FirmsHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-indigo-900/30 bg-brand-deeper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
          Nested<span className="text-brand-accent">Objects</span>
          <span className="rounded bg-brand-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-accent">
            Firms
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-indigo-200 md:flex">
          <Link href="/inspectors" className="transition hover:text-white">Browse Inspectors</Link>
          <Link href="/post-a-job" className="transition hover:text-white">Post a Job</Link>
          <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
          <a
            href="https://nestedobjects.com/guides"
            className="transition hover:text-white"
          >
            Resources
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="https://members.nestedobjects.com"
            className="text-sm font-medium text-indigo-200 transition hover:text-white"
          >
            Log in
          </a>
          <Link
            href="/post-a-job"
            className="btn-shimmer rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400"
          >
            Post a Job
          </Link>
        </div>
      </div>
    </header>
  )
}

function FirmsFooter() {
  return (
    <footer className="border-t border-slate-800 bg-brand-deeper text-indigo-200">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-bold text-white">
              Nested<span className="text-brand-accent">Objects</span>
              <span className="ml-2 rounded bg-brand-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-accent">
                Firms
              </span>
            </p>
            <p className="mt-2 text-xs text-indigo-300/70">
              The hiring platform built for field services.<br />
              Source vetted inspectors across all 50 states.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">For Firms</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/post-a-job" className="hover:text-white transition">Post a Job</Link></li>
              <li><Link href="/inspectors" className="hover:text-white transition">Browse Inspectors</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition">Firm Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">For Inspectors</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="https://nestedobjects.com" className="hover:text-white transition">Inspector Hub</a></li>
              <li><a href="https://members.nestedobjects.com" className="hover:text-white transition">Member Portal</a></li>
              <li><a href="https://nestedobjects.com/guides" className="hover:text-white transition">Guides &amp; Training</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="https://nestedobjects.com/about" className="hover:text-white transition">About</a></li>
              <li><a href="https://nestedobjects.com/contact" className="hover:text-white transition">Contact</a></li>
              <li><a href="https://flynerdofficial.com" className="hover:text-white transition">Fly Nerd</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-indigo-800/50 pt-6 text-center text-xs text-indigo-400/60">
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
        <FirmsHeader />
        {children}
        <FirmsFooter />
      </body>
    </html>
  )
}
