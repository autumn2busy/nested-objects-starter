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
  decisionGuide?: {
    bestFor: string[]
    watchouts: string[]
    compareBy: {
      label: string
      detail: string
    }[]
    nextLinks?: {
      label: string
      href: string
      detail: string
    }[]
  }
}

const comparisonRows = [
  {
    label: 'Best for',
    detail: 'People whose schedule, equipment, and service area already match the assignment type.',
  },
  {
    label: 'Compare against',
    detail: 'Similar firms, adjacent roles, route distance, revision risk, pay timing, and onboarding friction.',
  },
  {
    label: 'Ask before applying',
    detail: 'Which counties are active, what proof is required, how payment works, and how revisions are handled.',
  },
  {
    label: 'Avoid when',
    detail: 'The route is too sparse, requirements are unclear, or the firm asks for sensitive details before explaining the work.',
  },
]

function getDecisionGuide(content: RoleAeoContent) {
  return content.decisionGuide ?? {
    bestFor: content.fitChecks.slice(0, 3),
    watchouts: [
      'The company does not explain active service areas or assignment expectations.',
      'The posted fee ignores route distance, revision risk, or equipment costs.',
      'The onboarding path asks for sensitive details before explaining the work.',
    ],
    compareBy: comparisonRows.slice(0, 3),
    nextLinks: [
      {
        label: 'Hiring firms',
        href: '/hiring-firms',
        detail: 'Compare firms, service areas, reviews, and requirement clues.',
      },
      {
        label: 'Income calculator',
        href: '/tools/income-calculator',
        detail: 'Estimate route pay before accepting scattered assignments.',
      },
      {
        label: 'Membership plans',
        href: '/membership-pricing',
        detail: 'Use Pro when you are ready to compare firms seriously.',
      },
    ],
  }
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
    decisionGuide: {
      bestFor: [
        'Inspectors who can build repeatable county routes for occupancy checks, exterior photos, and condition reports.',
        'People who want beginner-friendly field work before moving into specialty inspections or appointment-heavy assignments.',
        'Contractors who need to compare mortgage field service firms by coverage, pay timing, revision rules, and portal expectations.',
      ],
      watchouts: [
        'The firm lists broad national coverage but does not confirm active work in your counties.',
        'The per-order fee looks good until travel distance, access issues, and photo revisions are included.',
        'The vendor portal or onboarding path asks for documents before explaining assignment type, pay, or payment timing.',
      ],
      compareBy: [
        {
          label: 'Route density',
          detail: 'Look for firms with enough nearby occupancy checks, exterior photos, or condition reports to make trips efficient.',
        },
        {
          label: 'Revision policy',
          detail: 'Check whether the firm explains photo standards, resubmission windows, and who absorbs unpaid return visits.',
        },
        {
          label: 'Payment terms',
          detail: 'Compare per-order fees, trip fees, payout timing, and whether rush or interior work pays differently.',
        },
      ],
      nextLinks: [
        {
          label: 'Mortgage-friendly firms',
          href: '/hiring-firms?industry=Mortgage',
          detail: 'Find field service companies and lender-adjacent firms to compare.',
        },
        {
          label: 'State directories',
          href: '/hiring-firms/texas',
          detail: 'Start with a state page, then compare firms serving nearby counties.',
        },
        {
          label: 'Income calculator',
          href: '/tools/income-calculator',
          detail: 'Estimate net route value before accepting scattered assignments.',
        },
      ],
    },
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
    decisionGuide: {
      bestFor: [
        'Inspectors who are comfortable scheduling appointments and explaining the visit to occupants or business contacts.',
        'Contractors who can document hazards, measurements, protection systems, and underwriting details clearly.',
        'People who want more detailed survey work than basic mortgage field inspections and can handle longer reports.',
      ],
      watchouts: [
        'The assignment does not clarify residential versus commercial scope, report length, or appointment expectations.',
        'The pay does not account for interview time, measuring, interior access, or detailed underwriting notes.',
        'The firm gives carrier-specific requirements only after you have already accepted the survey.',
      ],
      compareBy: [
        {
          label: 'Survey complexity',
          detail: 'Compare residential, small commercial, and commercial surveys by appointment time, report length, and photo requirements.',
        },
        {
          label: 'Access expectations',
          detail: 'Confirm who schedules the visit, what to say on arrival, and how denied access or no-shows are handled.',
        },
        {
          label: 'Carrier standards',
          detail: 'Look for clear instructions on hazards, life-safety items, measurements, diagrams, and revision handling.',
        },
      ],
      nextLinks: [
        {
          label: 'Loss-control firms',
          href: '/hiring-firms?industry=Insurance',
          detail: 'Compare companies with insurance, underwriting, or loss-control lanes.',
        },
        {
          label: 'Resource center',
          href: '/inspector-resource-center',
          detail: 'Review readiness guides, safety notes, and firm-intel resources.',
        },
        {
          label: 'Firm directory',
          href: '/hiring-firms',
          detail: 'Shortlist firms before uploading credentials or accepting surveys.',
        },
      ],
    },
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
    decisionGuide: {
      bestFor: [
        'Mobile notaries who want to compare signing services, title vendors, RON platforms, and adjacent route work.',
        'Signing agents who need to protect net pay after printing, scan-backs, cancellations, mileage, and dead time.',
        'Notaries looking for field inspection add-ons that do not interfere with notary laws, signer privacy, or title instructions.',
      ],
      watchouts: [
        'The signing service does not explain scan-back rules, cancellation policy, credential requirements, or pay timing.',
        'The route fee ignores print costs, appointment gaps, parking, tolls, or last-minute document changes.',
        'Inspection add-ons blur notary duties, privacy expectations, or state-specific notary requirements.',
      ],
      compareBy: [
        {
          label: 'Net signing value',
          detail: 'Compare fee, print costs, scan-backs, distance, cancellation risk, and payment timing before accepting.',
        },
        {
          label: 'Credential fit',
          detail: 'Check commission, bond, E&O, NNA certification, background screening, and RON requirements.',
        },
        {
          label: 'Route compatibility',
          detail: 'Only add field photo or delivery tasks when deadlines and privacy rules fit around signing appointments.',
        },
      ],
      nextLinks: [
        {
          label: 'Notary-friendly firms',
          href: '/hiring-firms?industry=Notary',
          detail: 'Find signing services, vendor programs, and notary-adjacent firms.',
        },
        {
          label: 'Notary calculator',
          href: '/tools/notary-route-calculator',
          detail: 'Check whether a signing route is still profitable after costs.',
        },
        {
          label: 'Company tracker',
          href: '/tools/companies',
          detail: 'Track saved firms, requirements, and application follow-ups.',
        },
      ],
    },
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
    decisionGuide: {
      bestFor: [
        'Inspectors or vendors who can document vacant, distressed, REO, or preservation-related properties carefully.',
        'Contractors who understand safety, access, before-and-after photos, materials, and condition reporting.',
        'People comparing preservation networks by scope, reimbursement, photo proof, and local work volume.',
      ],
      watchouts: [
        'The scope blends inspection, maintenance, securing, debris, or winterization without clear pay and proof rules.',
        'The firm does not explain reimbursement timing, material approval, safety expectations, or access limits.',
        'The route includes distressed properties without enough local volume or clear escalation instructions.',
      ],
      compareBy: [
        {
          label: 'Scope boundaries',
          detail: 'Separate simple inspections from maintenance, securing, debris, winterization, and crew-coordination work.',
        },
        {
          label: 'Proof requirements',
          detail: 'Check before-and-after photo standards, timestamp rules, portal uploads, and unpaid revision risk.',
        },
        {
          label: 'Cost recovery',
          detail: 'Compare trip fees, material reimbursement, approval process, payment timing, and safety expectations.',
        },
      ],
      nextLinks: [
        {
          label: 'Preservation firms',
          href: '/hiring-firms?industry=Property%20Preservation',
          detail: 'Compare preservation, REO, and field-service vendor networks.',
        },
        {
          label: 'State directories',
          href: '/hiring-firms/florida',
          detail: 'Use state pages to check local route and vendor-market signals.',
        },
        {
          label: 'Tools hub',
          href: '/tools',
          detail: 'Use calculators and templates before accepting route work.',
        },
      ],
    },
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
    decisionGuide: {
      bestFor: [
        'Gig workers who already manage routes, apps, photos, deadlines, and customer communication.',
        'Mobile operators who want to layer inspection, notary-adjacent, delivery, and local field-service work.',
        'Contractors who need to compare route density and net pay instead of chasing the highest posted fee.',
      ],
      watchouts: [
        'The opportunity looks flexible but has strict turnaround, revision, or access requirements that clash with other gigs.',
        'The route is too spread out to stack with delivery, notary, or inspection work already on your calendar.',
        'The company does not explain equipment, background checks, portal steps, or payment timing upfront.',
      ],
      compareBy: [
        {
          label: 'Route stacking',
          detail: 'Compare whether assignments fit around existing gigs, appointment windows, and realistic travel time.',
        },
        {
          label: 'Mobile workflow',
          detail: 'Check app requirements, photo rules, upload deadlines, access notes, and revision expectations.',
        },
        {
          label: 'Net weekly value',
          detail: 'Estimate mileage, dead time, cancellations, payout timing, and repeat volume before committing.',
        },
      ],
      nextLinks: [
        {
          label: 'Firm directory',
          href: '/hiring-firms',
          detail: 'Compare field-service firms by work type, route fit, and requirements.',
        },
        {
          label: 'Income calculator',
          href: '/tools/income-calculator',
          detail: 'Model whether stacked assignments improve weekly net pay.',
        },
        {
          label: 'Resource center',
          href: '/inspector-resource-center',
          detail: 'Use readiness guides and templates before applying broadly.',
        },
      ],
    },
  },
  inspector: {
    roleName: 'Inspector',
    path: '/roles/inspector',
    audience: 'home, property, and field inspectors who need clearer firm expectations before they accept route work',
    primaryWork: 'property condition documentation, photo capture, report submission, safety notes, firm-specific checklists, and revision handling',
    quickAnswers: [
      {
        title: 'What inspectors compare first',
        body: 'Inspectors should compare assignment type, required photos, access rules, safety expectations, pay timing, revision policy, and whether the firm sends enough nearby work to justify the route.',
      },
      {
        title: 'Best use of Nested Objects',
        body: 'Use Nested Objects to research hiring firms, read requirement clues, prepare application notes, and keep common inspection workflows organized before you upload documents or accept assignments.',
      },
      {
        title: 'What makes routes smoother',
        body: 'Clear shot lists, realistic turnaround times, good portal instructions, predictable communication, and fewer avoidable revisions usually matter as much as the posted inspection fee.',
      },
    ],
    fitChecks: [
      'You want to compare firms before submitting personal details.',
      'You need concise checklists for photos, access notes, gear, and report requirements.',
      'You want to reduce revisions by understanding expectations before the visit.',
      'You are evaluating inspection work across multiple service lanes or states.',
    ],
    faqs: [
      {
        question: 'What kinds of firms hire inspectors?',
        answer: 'Inspectors may be hired by mortgage field service firms, insurance loss control companies, property preservation vendors, appraisal support firms, and local or national field-service networks.',
      },
      {
        question: 'What should inspectors verify before applying?',
        answer: 'Inspectors should verify coverage area, assignment type, pay structure, background check requirements, insurance expectations, equipment needs, payout timing, and how revisions are handled.',
      },
      {
        question: 'How does Nested Objects help inspectors choose firms?',
        answer: 'Nested Objects organizes firm profiles, role guidance, pay clues, requirement notes, and AI tools so inspectors can compare opportunities before spending time on vendor portals.',
      },
    ],
  },
  'gig-worker': {
    roleName: 'Gig worker',
    path: '/roles/gig-worker',
    audience: 'gig workers, couriers, delivery drivers, and mobile operators who want to add route-compatible field work',
    primaryWork: 'local route work, simple photo tasks, occupancy checks, document delivery, field support assignments, and flexible service-area planning',
    quickAnswers: [
      {
        title: 'Best first field gigs',
        body: 'Gig workers often start with simple photo assignments, occupancy checks, exterior condition notes, document delivery, or inspection-adjacent tasks that fit around routes they already drive.',
      },
      {
        title: 'What to compare',
        body: 'Compare travel distance, pay per stop, revision risk, required gear, deadline windows, onboarding speed, and whether the assignment fits your existing app-based schedule.',
      },
      {
        title: 'How to protect net pay',
        body: 'A higher posted fee can still lose money if stops are far apart, revisions are common, access is unclear, or the firm does not have consistent work in your service area.',
      },
    ],
    fitChecks: [
      'You already manage routes, apps, photos, deadlines, and customer notes.',
      'You want to add inspection-style work without abandoning existing gig income.',
      'You need to understand pay, distance, and assignment rules before accepting work.',
      'You want firm research and application paths in one place.',
    ],
    faqs: [
      {
        question: 'Can gig workers become field inspectors?',
        answer: 'Yes. Gig workers who already understand routing, deadlines, mobile apps, photos, and service-area planning can often transition into basic field inspection or field-support work with the right firm onboarding.',
      },
      {
        question: 'What field work fits gig workers best?',
        answer: 'Simple exterior photos, occupancy verification, document delivery, route-based condition checks, and inspection support tasks can fit gig workers when pay, distance, and deadlines make sense.',
      },
      {
        question: 'How does Nested Objects help gig workers compare opportunities?',
        answer: 'Nested Objects helps gig workers compare firm requirements, service areas, pay clues, route fit, and application notes before they commit time to a new vendor program.',
      },
    ],
  },
  realtor: {
    roleName: 'Realtor',
    path: '/roles/realtor',
    audience: 'real estate agents and licensed professionals evaluating BPO, valuation, REO, and property condition work between closings',
    primaryWork: 'broker price opinions, drive-by valuation support, property condition photos, REO documentation, occupancy checks, and lender-adjacent field assignments',
    quickAnswers: [
      {
        title: 'Where realtors can add field work',
        body: 'Realtors may find adjacent work through BPO companies, asset management vendors, valuation support firms, REO networks, and field-service firms that need local market knowledge.',
      },
      {
        title: 'What to verify first',
        body: 'Verify licensing requirements, assignment scope, photo standards, comparable-sales expectations, turnaround time, pay, portal rules, and whether the firm has active local volume.',
      },
      {
        title: 'How to compare BPO work',
        body: 'BPO and valuation assignments should be compared by net fee, research time, travel distance, revision risk, listing opportunity, and whether the work supports your broader real estate pipeline.',
      },
    ],
    fitChecks: [
      'You want to use local market knowledge between closings.',
      'You are evaluating BPO, REO, valuation, or condition-report vendors.',
      'You need to separate worthwhile vendor programs from low-margin busywork.',
      'You want direct links, requirement clues, and firm comparisons before applying.',
    ],
    faqs: [
      {
        question: 'Can realtors get paid for BPOs and property inspections?',
        answer: 'Yes. Some firms pay licensed agents for broker price opinions, valuation support, REO checks, occupancy photos, and property condition documentation, depending on local rules and firm requirements.',
      },
      {
        question: 'What should realtors compare before accepting BPO work?',
        answer: 'Realtors should compare fee, travel distance, comparable-sales research time, report complexity, turnaround requirements, revision policy, and whether the vendor may lead to future REO or valuation work.',
      },
      {
        question: 'How does Nested Objects help realtors evaluate field-service firms?',
        answer: 'Nested Objects helps realtors review firm profiles, service lanes, requirement clues, pay context, and application paths so they can choose vendor programs that fit their license and schedule.',
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
  const decisionGuide = getDecisionGuide(content)

  return (
    <section className="border-t border-slate-200 bg-white py-10 [content-visibility:auto] [contain-intrinsic-size:0_1280px] sm:py-14">
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

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
              Best-fit summary
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">
              Who should pursue {content.roleName.toLowerCase()} work?
            </h3>
            <ul className="mt-4 space-y-3">
              {decisionGuide.bestFor.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
              Slow down if
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">
              Warning signs before applying
            </h3>
            <ul className="mt-4 space-y-3">
              {decisionGuide.watchouts.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-copper" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
              Firm comparison checklist
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">
              Compare {content.roleName.toLowerCase()} companies by the things that affect net value
            </h3>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {decisionGuide.compareBy.map((item) => (
              <article key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-900">{item.label}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
              Role comparison
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">
              How to decide if {content.roleName.toLowerCase()} work is worth pursuing
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use this comparison before you apply to firms, upload credentials, or accept assignment terms.
            </p>
          </div>
          <dl className="grid divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
            {comparisonRows.map((row) => (
              <div key={row.label} className="p-4 sm:p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{row.label}</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-700">{row.detail}</dd>
              </div>
            ))}
          </dl>
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

        {decisionGuide.nextLinks && decisionGuide.nextLinks.length > 0 ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
              Next pages to use
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {decisionGuide.nextLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-copper hover:shadow-sm"
                >
                  <span className="text-sm font-semibold text-slate-900">{link.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-slate-700">{link.detail}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

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
