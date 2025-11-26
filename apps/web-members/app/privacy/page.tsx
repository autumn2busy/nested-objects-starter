import Link from 'next/link'
import { Container } from '@/components/ui/container'

export const metadata = {
  title: 'Privacy policy',
  description: 'How Nested Objects handles member data, analytics, and third-party services.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-brand-background text-brand-heading">
      <section className="border-b border-brand-border bg-brand-surface">
        <Container className="py-10 sm:py-12 lg:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Policies</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Privacy policy</h1>
          <p className="mt-2 max-w-3xl text-sm text-brand-muted">
            We respect your time and data. This page outlines what information we collect, how we use it, and the choices you
            have about your profile inside the member hub.
          </p>
        </Container>
      </section>

      <section className="bg-brand-background">
        <Container className="space-y-6 py-10 lg:py-14">
          <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-heading">Information we collect</h2>
            <p className="text-sm text-brand-muted">
              We collect account information you provide (name, email, location, service lanes), usage data for analytics, and
              optional details you add to your directory profile. Payment data is processed by our billing partners and never
              stored on Nested Objects servers.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-heading">How we use your data</h2>
            <p className="text-sm text-brand-muted">
              Profile details help match you with firms and power AI-driven recommendations. Aggregated, de-identified data may
              be used to improve the hub experience. We do not sell your personal information.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-heading">Your choices</h2>
            <p className="text-sm text-brand-muted">
              You can update or delete your profile anytime, toggle directory visibility, and opt out of marketing emails. For
              data removal requests, contact us at <a className="font-semibold text-brand-primary" href="mailto:privacy@nested-objects.com">privacy@nested-objects.com</a>.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-soft p-5 text-sm text-brand-muted shadow-sm">
            <p className="font-semibold text-brand-heading">Questions?</p>
            <p className="mt-1">
              We respond to privacy inquiries within two business days. Read more about platform safeguards in our{' '}
              <Link className="text-brand-primary underline" href="/about">
                About page
              </Link>{' '}
              or reach out via the <Link className="text-brand-primary underline" href="/contact">contact form</Link>.
            </p>
          </div>
        </Container>
      </section>
    </main>
  )
}
