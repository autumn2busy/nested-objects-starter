import Link from 'next/link'

import { SITE_URL, getFAQPageSchema } from '@/lib/seo'

type RoleAeoContent = {
  roleName: string
  path: string
  audience: string
  primaryWork: string
  quickAnswers: {
    title: string
    body: string
  }[]
  fitChecks: string[]
  faqs: {
    question: string
    answer: string
  }[]
}

export const roleAeoContent = {
  'mortgage-field-inspector': {
    roleName: 'Mortgage field inspector',
    path: '/roles/mortgage-field-inspector',
    audience: 'independent inspectors who complete lender, servicer, and mortgage field service assignments',
    primaryWork: 'occupancy checks, exterior photo sets, interior inspections, condition reports, and route-based lender requests',
    quickAnswers: [
      {
        title: 'Best first assignments',
        body: 'Most new mortgage field inspectors start with occupancy checks, exterior photos, property condition notes, and simple verification visits before taking more complex interior or rush assignments.',
      },
      {
        title: 'What firms expect',
        body: 'Firms usually expect reliable transportation, smartphone photos, fast turnaround, clean notes, background checks, and the ability to follow client-specific photo and submission rules.',
      },
      {
        title: 'What to compare',
        body: 'Compare pay per order, revision policy, county coverage, order volume, portal requirements, and whether the firm has active work near your normal route.',
      },
    ],
    fitChecks: [
      'You can complete route-based property visits during predictable windows.',
      'You are comfortable taking clear photos and following shot lists.',
      'You want firm profiles, pay clues, and application notes before applying.',
      'You can manage deadlines, revision requests, and mobile portal submissions.',
    ],
    faqs: [
      {
        question: 'Do mortgage field inspectors need a license?',
        answer: 'Many mortgage field inspection assignments do not require a state license, but firms may require background checks, insurance, training, reliable transportation, and smartphone documentation. Home inspection, appraisal, or insurance work may have separate licensing rules.',
      },
      {
        question: 'How do mortgage field inspectors get paid?',
        answer: 'Most assignments are paid per order, with rates influenced by order type, distance, photo requirements, access difficulty, and revision rules. Inspectors should confirm pay, trip fees, and payout timing before accepting work.',
      },
      {
        question: 'How does Nested Objects help mortgage field inspectors?',
        answer: 'Nested Objects helps inspectors compare firms, understand assignment types, review pay clues, prepare application notes, and use tools that make route planning and firm research easier.',
      },
    ],
  },
  'insurance-loss-control': {
    roleName: 'Insurance loss control inspector',
    path: '/roles/insurance-loss-control',
    audience: 'inspectors who complete underwriting surveys for residential, commercial, and small business risks',
    primaryWork: 'risk surveys, exterior and interior photos, measurements, safety observations, and underwriting-ready reports',
    quickAnswers: [
      {
        title: 'What loss control inspectors do',
        body: 'Loss control inspectors document property conditions, hazards, occupancy details, protection systems, and photos that help carriers evaluate risk before or after a policy is written.',
      },
      {
        title: 'Common requirements',
        body: 'Firms may look for inspection experience, strong written notes, dependable scheduling, photo quality, measuring ability, and comfort speaking with occupants or business contacts.',
      },
      {
        title: 'How to evaluate firms',
        body: 'Compare residential versus commercial work, report complexity, appointment scheduling expectations, pay per survey, territory density, and how revisions are handled.',
      },
    ],
    fitChecks: [
      'You can explain inspection purpose clearly to occupants or business contacts.',
      'You are comfortable documenting hazards, measurements, and protection features.',
      'You want underwriting-friendly templates and carrier-specific expectations.',
      'You can handle appointment windows, access notes, and detailed report submission.',
    ],
    faqs: [
      {
        question: 'Is insurance loss control different from mortgage field inspection?',
        answer: 'Yes. Mortgage field inspection usually focuses on property status for lenders or servicers, while loss control focuses on risk information for insurance underwriting. The photo, report, and appointment requirements can be more detailed.',
      },
      {
        question: 'Can field inspectors move into loss control work?',
        answer: 'Many inspectors use field inspection experience as a bridge into loss control because they already understand routing, photo standards, access notes, and deadline-driven submissions.',
      },
      {
        question: 'What should I check before accepting loss control assignments?',
        answer: 'Confirm the property type, appointment expectations, photo list, report length, measuring requirements, pay, revision process, and whether the territory has enough nearby work.',
      },
    ],
  },
  'mobile-notary': {
    roleName: 'Mobile notary',
    path: '/roles/mobile-notary',
    audience: 'mobile notaries and signing agents comparing signing services, vendor programs, RON platforms, and adjacent route work',
    primaryWork: 'loan signings, title and escrow assignments, RON or hybrid appointments, document handling, route planning, and compatible field photo tasks',
    quickAnswers: [
      {
        title: 'Where to find work',
        body: 'Mobile notaries usually start with signing services, title and escrow vendors, RON platforms, and direct vendor programs before adding compatible field-service assignments.',
      },
      {
        title: 'What to compare',
        body: 'Compare signing fees, print and scan-back requirements, travel distance, cancellation rules, credential requirements, pay timing, and whether the company has real work near your route.',
      },
      {
        title: 'How to stack routes',
        body: 'Inspection, photo, occupancy, and document delivery tasks can work well only when they do not interfere with state notary rules, signer privacy, appointment timing, or title instructions.',
      },
    ],
    fitChecks: [
      'You want to know which signing services and vendor programs are worth applying to.',
      'You need to protect net pay after printing, fuel, scan-backs, and dead time.',
      'You want to add route-compatible work without disrupting notary duties.',
      'You want firm research, application links, and requirement clues before uploading credentials.',
    ],
    faqs: [
      {
        question: 'How do mobile notaries find signing agent work?',
        answer: 'Mobile notaries usually find work by applying to signing services, title or escrow vendor programs, RON platforms, and direct company onboarding pages. They should compare requirements, payout timing, service area fit, and assignment rules before applying broadly.',
      },
      {
        question: 'Can mobile notaries add field inspection work?',
        answer: 'Mobile notaries can often add compatible field work such as occupancy verification, simple photo tasks, document delivery, or lender support, but notary duties should stay separate from inspection tasks and follow state notary rules, privacy expectations, and firm instructions.',
      },
      {
        question: 'How does Nested Objects help mobile notaries?',
        answer: 'Nested Objects helps notaries compare signing services, vendor programs, route-compatible field work, pay clues, requirements, and application paths before they spend time applying or accepting low-margin assignments.',
      },
    ],
  },
  'asset-preservation': {
    roleName: 'Asset preservation specialist',
    path: '/roles/asset-preservation',
    audience: 'inspectors, preservation vendors, crew leads, and coordinators who support vacant or distressed properties',
    primaryWork: 'property preservation checks, REO documentation, winterization support, debris notes, occupancy status, and before-and-after photos',
    quickAnswers: [
      {
        title: 'What asset preservation covers',
        body: 'Asset preservation work protects lender, investor, or servicer assets through condition checks, maintenance documentation, safety notes, photos, and vendor coordination.',
      },
      {
        title: 'Who hires preservation vendors',
        body: 'Mortgage field service firms, property preservation companies, REO vendors, servicers, and national vendor networks may hire inspectors or crews for preservation-related work.',
      },
      {
        title: 'What to verify first',
        body: 'Verify scope, access rules, photo requirements, safety expectations, materials, reimbursement rules, and whether the firm has current work in your counties.',
      },
    ],
    fitChecks: [
      'You can document property condition before and after work is completed.',
      'You understand safety, access, and occupancy questions around distressed assets.',
      'You want to compare vendor networks before onboarding.',
      'You need clear expectations for photos, materials, trip fees, and revisions.',
    ],
    faqs: [
      {
        question: 'Is asset preservation the same as field inspection?',
        answer: 'They overlap, but asset preservation often includes maintenance, securing, winterization, debris, or coordination tasks in addition to inspection photos and condition reports.',
      },
      {
        question: 'What should preservation vendors compare before applying?',
        answer: 'Compare service area, work type, material reimbursement, photo proof standards, pay timing, safety expectations, and whether the firm sends enough local volume to justify the route.',
      },
      {
        question: 'How does Nested Objects support preservation work?',
        answer: 'Nested Objects helps vendors research firms, compare service lanes, review pay clues, organize application notes, and prepare for documentation requirements.',
      },
    ],
  },
  'gig-pro-inspector': {
    roleName: 'Gig pro inspector',
    path: '/roles/gig-pro-inspector',
    audience: 'independent operators who layer inspection, notary, delivery, and local field-service work into one route',
    primaryWork: 'route-based inspections, lender checks, photo assignments, delivery-adjacent tasks, notary support, and local field work',
    quickAnswers: [
      {
        title: 'Best fit for flexible operators',
        body: 'Gig pro inspection fits people who already manage local routes, appointments, photos, deadlines, and mobile apps and want to add higher-intent field-service assignments.',
      },
      {
        title: 'Where to begin',
        body: 'Start with simple occupancy checks, exterior photos, mobile notary-compatible tasks, property condition reports, and firms with clear onboarding steps.',
      },
      {
        title: 'What makes routes profitable',
        body: 'Route density, low revision rates, predictable pay, realistic turnaround times, and nearby assignments usually matter more than the highest single posted fee.',
      },
    ],
    fitChecks: [
      'You already use mobile apps, navigation, photos, and scheduling tools.',
      'You want to compare multiple field-service income paths in one place.',
      'You need route-fit guidance before accepting far-apart assignments.',
      'You want firm profiles, tools, and checklists that support mobile work.',
    ],
    faqs: [
      {
        question: 'What is a gig pro inspector?',
        answer: 'A gig pro inspector is an independent operator who combines inspection-style assignments with other local field work, such as route tasks, notary-adjacent work, photo documentation, or lender support.',
      },
      {
        question: 'Can gig workers become field inspectors?',
        answer: 'Yes. Gig workers who already understand routing, deadlines, mobile apps, and customer communication can often transition into basic field inspection assignments with the right firm requirements and training.',
      },
      {
        question: 'How should gig pro inspectors compare opportunities?',
        answer: 'Compare travel distance, pay per order, revision risk, route density, equipment needs, onboarding speed, and whether each firm has consistent work near your normal service area.',
      },
    ],
  },
} satisfies Record<string, RoleAeoContent>

export function RoleAeoJsonLd({ content }: { content: RoleAeoContent }) {
  const faqSchema = getFAQPageSchema(content.faqs)
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${content.roleName} guide`,
    url: `${SITE_URL}${content.path}`,
    description: `A Nested Objects guide for ${content.audience}, covering ${content.primaryWork}.`,
    about: content.primaryWork,
    audience: {
      '@type': 'Audience',
      audienceType: content.audience,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
    </>
  )
}

export function RoleAeoSection({ content }: { content: RoleAeoContent }) {
  return (
    <section className="border-t border-slate-200 bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
            Quick answers
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            What to know before applying as a {content.roleName.toLowerCase()}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Built for {content.audience}. Use this section to understand the work, compare firms, and decide whether this role fits your route.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {content.quickAnswers.map((answer) => (
            <article key={answer.title} className="rounded-lg border border-slate-200 bg-brand-sand p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-slate-900">{answer.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{answer.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <p className="text-sm font-semibold text-slate-900">Good fit if...</p>
            <ul className="mt-4 space-y-3">
              {content.fitChecks.map((check) => (
                <li key={check} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-copper" aria-hidden="true" />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-semibold text-slate-900">Frequently asked questions</p>
            <div className="mt-4 space-y-4">
              {content.faqs.map((faq) => (
                <div key={faq.question} className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
                  <h3 className="text-sm font-semibold text-slate-900">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/hiring-firms"
            className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            Compare hiring firms
          </Link>
          <Link
            href="/membership-pricing"
            className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50 sm:w-auto"
          >
            Start the 7-day Pro trial
          </Link>
        </div>
      </div>
    </section>
  )
}
