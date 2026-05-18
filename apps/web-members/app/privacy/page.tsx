import type { Metadata } from 'next'

const policyHighlights = [
  {
    title: 'Member-first data handling',
    detail:
      'We only collect details needed to authenticate your account, deliver membership benefits, and comply with payment and tax requirements.',
  },
  {
    title: 'Security controls by default',
    detail:
      'Access is restricted by role, transport is encrypted, and vendors must align with our security standards before any data is shared.',
  },
  {
    title: 'No resale or copying of data',
    detail:
      'Member information, training content, and firm intel are never sold, licensed, or copied for third-party distribution.',
  },
]

const dataPractices = [
  {
    heading: 'What we collect',
    copy:
      'Account identifiers, firm affiliation, billing details, usage logs, and device signals that help us secure accounts and personalize recommendations.',
  },
  {
    heading: 'How we use it',
    copy:
      'To authenticate logins, deliver directory insights, improve AI guidance, process payments, prevent fraud, and meet legal obligations.',
  },
  {
    heading: 'What we will not do',
    copy:
      'We do not resell, license, or republish your data. We do not train public models on member content, and we do not allow unauthorized copying.',
  },
  {
    heading: 'Cookies & tracking',
    copy:
      'First-party cookies keep you signed in and remember preferences. Limited analytics help us improve flows without cross-site advertising.',
  },
  {
    heading: 'Data retention',
    copy:
      'Operational data is retained while your account is active and for required recordkeeping. You can request access or deletion where allowed.',
  },
  {
    heading: 'Third-party processors',
    copy:
      'Payment, authentication, and support vendors must follow confidentiality and security obligations consistent with this policy.',
  },
]

const rightsList = [
  'Request access to the data we maintain about you and receive it in a portable format when applicable.',
  'Correct inaccuracies in your profile, membership, or billing records.',
  'Request deletion of non-essential data, subject to legal, security, and fraud-prevention exceptions.',
  'Opt out of non-essential communications and manage cookie preferences in your browser.',
  'Appeal decisions made by automated systems that materially affect your account.',
]

export const metadata: Metadata = {
  title: 'Privacy Policy | Nested Objects member data and usage',
  description:
    'Understand how Nested Objects collects, uses, and protects member data. No resale or copying of your information and transparent rights requests.',
  alternates: {
    canonical: 'https://members.nestedobjects.com/privacy',
  },
  openGraph: {
    type: 'article',
    url: 'https://members.nestedobjects.com/privacy',
    title: 'Privacy Policy | Nested Objects member data and usage',
    description:
      'Details on data collection, security, retention, and your rights. Nested Objects does not resell or copy member information.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Nested Objects member data and usage',
    description:
      'How Nested Objects secures member data, prevents resale or copying, and honors access and deletion rights.',
  },
}

export default function PrivacyPage() {
  const privacySchema = {
    '@context': 'https://schema.org',
    '@type': 'PrivacyPolicy',
    name: 'Nested Objects Privacy Policy',
    url: 'https://members.nestedobjects.com/privacy',
    description:
      'Privacy policy outlining collection, use, retention, and strict no resale or copy practices for Nested Objects members.',
    publisher: {
      '@type': 'Organization',
      name: 'Nested Objects',
      url: 'https://members.nestedobjects.com',
    },
    inLanguage: 'en',
  }

  return (
    <main className="bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/20 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-copper">Privacy</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            Privacy commitments for inspectors, coordinators, and partners.
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-brand-slate">
            This privacy policy is modeled after the live policies we follow at member.nestedobjects.com. It explains what we
            collect, how we protect it, and the controls you have. Our guardrails include strict no resale or copy rules for
            any member data or digital resources.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {policyHighlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-brand-copper/25 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-brand-dark">{item.title}</p>
                <p className="mt-2 text-sm text-brand-slate">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-brand-copper/15 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold text-brand-dark">How we handle your data</h2>
              <p className="text-sm text-brand-slate">
                We gather only what is required to secure accounts, deliver services, and comply with the law. We align this
                page with our operational policy at member.nestedobjects.com so you have a consistent experience across every
                entry point.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {dataPractices.map((practice) => (
                  <div key={practice.heading} className="rounded-2xl border border-brand-copper/20 bg-brand-mist p-4">
                    <p className="text-sm font-semibold text-brand-dark">{practice.heading}</p>
                    <p className="mt-2 text-sm text-brand-slate">{practice.copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-copper/25 bg-brand-dark p-6 text-white shadow-lg shadow-brand-copper/20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-copper">Your rights</p>
              <h3 className="mt-2 text-xl font-semibold">Control and transparency</h3>
              <p className="mt-2 text-sm text-brand-mist">
                You can submit privacy requests by emailing support@nestedobjects.com. We respond based on your location and plan
                requirements.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-brand-mist">
                {rightsList.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-brand-copper" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-brand-mist/80">
                If you close your account, we retain only what is needed for compliance and fraud prevention. Digital resources
                remain protected from copying or redistribution after access ends.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-sand/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-brand-dark">Data security and incidents</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-brand-copper/20 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-brand-dark">Security program</p>
              <p className="mt-2 text-sm text-brand-slate">
                Role-based access, encryption in transit, regular vendor reviews, and monitored authentication keep accounts
                protected.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-copper/20 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-brand-dark">Incident response</p>
              <p className="mt-2 text-sm text-brand-slate">
                We notify affected members of material incidents, include remediation steps, and align with regulator guidance
                when applicable.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-copper/20 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-brand-dark">No resale pledge</p>
              <p className="mt-2 text-sm text-brand-slate">
                Member data, digital goods, and firm intel are never resold or copied for outside distribution, regardless of
                membership status.
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-4xl text-sm text-brand-slate">
            Questions? Email support@nestedobjects.com. If you are based outside the United States, we will route your request to
            the appropriate data handling workflow. We may update this policy and will timestamp revisions.
          </p>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(privacySchema) }} />
    </main>
  )
}
