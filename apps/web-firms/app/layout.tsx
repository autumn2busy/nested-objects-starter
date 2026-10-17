import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://firms.nestedobjects.com'),
  title: { default: 'Nested Objects for Firms — Better connections in field services', template: '%s | Nested Objects for Firms' },
  description: 'Meet Nested Objects, explore proposed firm collaborations, and try a clearly labeled sample inspector experience.',
  openGraph: { type: 'website', siteName: 'Nested Objects for Firms', locale: 'en_US' },
  robots: { index: true, follow: true },
}
function Brand() {
  return <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Nested Objects for firms home"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"><Image src="/logo.png" alt="" width={34} height={34} priority /></span><span><span className="block text-sm font-bold sm:text-base">Nested Objects</span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">For firms</span></span></Link>
}
function FirmsHeader() {
  return <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md"><div className="page-shell flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-4"><Brand /><Link href="/partnerships" className="button button-primary order-2 px-4 md:order-3">Let’s connect</Link><nav aria-label="Primary" className="order-3 flex w-full gap-5 overflow-x-auto border-t border-slate-100 pt-3 text-[13px] font-semibold text-slate-600 md:order-2 md:w-auto md:border-0 md:pt-0"><Link className="shrink-0 hover:text-brand" href="/#possibilities">For firms</Link><Link className="shrink-0 hover:text-brand" href="/inspectors">Sample experience</Link><Link className="shrink-0 hover:text-brand" href="/dashboard">The process</Link></nav></div></header>
}
function FirmsFooter() {
  return <footer className="border-t border-slate-200 bg-white"><div className="page-shell grid gap-8 py-12 md:grid-cols-[1.3fr_1fr_1fr]"><div><Brand /><p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">Inspector-first resources. Thoughtful conversations with field-service firms.</p></div><div><h2 className="eyebrow text-brand">Explore</h2><ul className="mt-5 space-y-3 text-sm text-slate-600"><li><Link href="/inspectors">Sample inspector experience</Link></li><li><Link href="/dashboard">Proposed collaboration process</Link></li><li><Link href="/partnerships">Contact & pricing discussion</Link></li></ul></div><div><h2 className="eyebrow text-brand">Nested Objects</h2><ul className="mt-5 space-y-3 text-sm text-slate-600"><li><a href="https://members.nestedobjects.com">Member platform</a></li><li><a href="https://members.nestedobjects.com/about-us">About us</a></li><li><a href="mailto:info@nestedobjects.com">info@nestedobjects.com</a></li></ul></div></div><div className="page-shell border-t border-slate-100 py-6 text-xs leading-6 text-slate-500">© {new Date().getFullYear()} Nested Objects LLC. The firm experience is a demonstration with fictional profiles. Proposed services are subject to an agreed scope.</div></footer>
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><Script id="gtm-script" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5HPX4VTQ');" }} /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /></head><body className="min-h-screen bg-brand-sand text-brand-dark antialiased"><a href="#main-content" className="sr-only focus:not-sr-only focus:block focus:p-4">Skip to main content</a><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5HPX4VTQ" height="0" width="0" style={{display:'none',visibility:'hidden'}} /></noscript><FirmsHeader />{children}<FirmsFooter /></body></html>
}
