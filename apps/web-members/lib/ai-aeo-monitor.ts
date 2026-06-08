import { SITE_URL } from '@/lib/seo'

type SourceStatus = 'configured' | 'missing_config' | 'error'

type SourceRun = {
  name: string
  status: SourceStatus
  detail: string
  count?: number
}

type AnswerSnapshot = {
  prompt: string
  answerSummary: string
  citedBrands: string[]
  citedTopics: string[]
  nestedObjectsMentioned: boolean
}

export type AiAeoOpportunity = {
  id: string
  prompt: string
  intent: 'career_research' | 'vendor_selection' | 'pay_requirements' | 'route_operations' | 'notary_visibility'
  priority: 'high' | 'medium' | 'low'
  score: number
  recommendedAction: 'owned_answer_refresh' | 'supporting_blog_candidate' | 'directory_language_update' | 'faq_expansion'
  targetPage: string
  answerGap: string
  recommendedAnswerElements: string[]
  internalLinks: { label: string; href: string }[]
  observedBrands: string[]
  workflowStatus: 'candidate'
}

export type AiAeoMonitorReport = {
  generatedAt: string
  cadence: 'weekly'
  workflowBoundary: string
  dataSources: SourceRun[]
  promptSet: {
    prompt: string
    intent: AiAeoOpportunity['intent']
    targetPage: string
  }[]
  answerSnapshots: AnswerSnapshot[]
  opportunities: AiAeoOpportunity[]
}

const PROMPT_SET: AiAeoMonitorReport['promptSet'] = [
  {
    prompt: 'How do I become a mortgage field inspector?',
    intent: 'career_research',
    targetPage: '/roles/mortgage-field-inspector',
  },
  {
    prompt: 'What companies hire field inspectors near me?',
    intent: 'vendor_selection',
    targetPage: '/hiring-firms',
  },
  {
    prompt: 'How much do field inspectors get paid per inspection?',
    intent: 'pay_requirements',
    targetPage: '/tools/income-calculator',
  },
  {
    prompt: 'What is the difference between mortgage field inspection and property preservation?',
    intent: 'career_research',
    targetPage: '/blog/mortgage-field-inspection-vs-property-preservation',
  },
  {
    prompt: 'How can a mobile notary find signing services and RON platforms?',
    intent: 'notary_visibility',
    targetPage: '/roles/mobile-notary',
  },
  {
    prompt: 'Can mobile notaries add field inspection or photo assignments to their route?',
    intent: 'route_operations',
    targetPage: '/tools/notary-route-calculator',
  },
  {
    prompt: 'What do insurance loss control inspectors do?',
    intent: 'career_research',
    targetPage: '/roles/insurance-loss-control',
  },
  {
    prompt: 'Which field inspection firms are reliable for new contractors?',
    intent: 'vendor_selection',
    targetPage: '/hiring-firms',
  },
]

const OWNED_ANSWER_ELEMENTS: Record<AiAeoOpportunity['intent'], string[]> = {
  career_research: [
    'plain-English role definition',
    'requirements and tools',
    'pay-fit caveats',
    'beginner next steps',
    'link to relevant role page',
  ],
  vendor_selection: [
    'territory fit',
    'pay and volume signals',
    'application readiness',
    'directory/filter CTA',
    'save or track firms workflow',
  ],
  pay_requirements: [
    'fee range caveats',
    'mileage and unpaid admin time',
    'route density',
    'calculator CTA',
    'examples by assignment type',
  ],
  route_operations: [
    'route batching',
    'second-trip avoidance',
    'scope separation',
    'calculator CTA',
    'firm comparison CTA',
  ],
  notary_visibility: [
    'signing services',
    'title and escrow vendors',
    'RON platforms',
    'credential upload cautions',
    'notary route calculator CTA',
  ],
}

function generatedAt() {
  return new Date().toISOString()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
}

async function fetchAnswerSnapshotsFromWebhook(): Promise<{ snapshots: AnswerSnapshot[]; source: SourceRun }> {
  const webhookUrl = process.env.AEO_MONITOR_WEBHOOK_URL || process.env.AI_AEO_MONITOR_WEBHOOK_URL

  if (!webhookUrl) {
    return {
      snapshots: [],
      source: {
        name: 'AI answer snapshot webhook',
        status: 'missing_config',
        detail:
          'Set AEO_MONITOR_WEBHOOK_URL to compare prompts against external AI answer snapshots. Local owned-answer scoring still runs.',
      },
    }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: SITE_URL,
        prompts: PROMPT_SET,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        snapshots: [],
        source: {
          name: 'AI answer snapshot webhook',
          status: 'error',
          detail: `Webhook returned ${response.status}.`,
        },
      }
    }

    const data = (await response.json()) as { snapshots?: Partial<AnswerSnapshot>[] }
    const snapshots = (data.snapshots || [])
      .map((snapshot) => ({
        prompt: snapshot.prompt || '',
        answerSummary: snapshot.answerSummary || '',
        citedBrands: Array.isArray(snapshot.citedBrands) ? snapshot.citedBrands.filter(Boolean) : [],
        citedTopics: Array.isArray(snapshot.citedTopics) ? snapshot.citedTopics.filter(Boolean) : [],
        nestedObjectsMentioned: Boolean(snapshot.nestedObjectsMentioned),
      }))
      .filter((snapshot) => snapshot.prompt)

    return {
      snapshots,
      source: {
        name: 'AI answer snapshot webhook',
        status: 'configured',
        detail: `Pulled ${snapshots.length} external AI answer snapshots.`,
        count: snapshots.length,
      },
    }
  } catch (error) {
    return {
      snapshots: [],
      source: {
        name: 'AI answer snapshot webhook',
        status: 'error',
        detail: error instanceof Error ? error.message : 'Unknown AEO webhook error.',
      },
    }
  }
}

function expectedLinksForPrompt(prompt: string, targetPage: string): AiAeoOpportunity['internalLinks'] {
  const lower = prompt.toLowerCase()
  if (lower.includes('notary') || lower.includes('signing') || lower.includes('ron')) {
    return [
      { label: 'Mobile notary role page', href: '/roles/mobile-notary' },
      { label: 'Notary route calculator', href: '/tools/notary-route-calculator' },
      { label: 'Notary directory filter', href: '/hiring-firms?industry=Notary' },
    ]
  }
  if (lower.includes('insurance') || lower.includes('loss control')) {
    return [
      { label: 'Insurance loss control role page', href: '/roles/insurance-loss-control' },
      { label: 'Hiring firm directory', href: '/hiring-firms?industry=Insurance' },
    ]
  }
  if (lower.includes('preservation')) {
    return [
      { label: 'Property preservation comparison', href: '/blog/mortgage-field-inspection-vs-property-preservation' },
      { label: 'Asset preservation role page', href: '/roles/asset-preservation' },
    ]
  }
  if (lower.includes('pay') || lower.includes('paid')) {
    return [
      { label: 'Income calculator', href: '/tools/income-calculator' },
      { label: 'Hiring firm directory', href: '/hiring-firms' },
    ]
  }
  return [
    { label: 'Target answer page', href: targetPage },
    { label: 'Hiring firm directory', href: '/hiring-firms' },
  ]
}

function localOpportunityForPrompt(
  promptItem: AiAeoMonitorReport['promptSet'][number],
  snapshot?: AnswerSnapshot,
): AiAeoOpportunity {
  const expected = OWNED_ANSWER_ELEMENTS[promptItem.intent]
  const answerSummary = snapshot?.answerSummary.toLowerCase() || ''
  const missingElements = expected.filter((element) => !answerSummary.includes(element.split(' ')[0].toLowerCase()))
  const nestedObjectsMissing = snapshot ? !snapshot.nestedObjectsMentioned : true
  const score = Math.min(95, 62 + missingElements.length * 5 + (nestedObjectsMissing ? 10 : 0))

  return {
    id: `aeo-${slugify(promptItem.prompt)}`,
    prompt: promptItem.prompt,
    intent: promptItem.intent,
    priority: score >= 84 ? 'high' : score >= 72 ? 'medium' : 'low',
    score,
    recommendedAction:
      promptItem.intent === 'vendor_selection'
        ? 'directory_language_update'
        : promptItem.intent === 'route_operations'
          ? 'supporting_blog_candidate'
          : 'owned_answer_refresh',
    targetPage: promptItem.targetPage,
    answerGap: snapshot
      ? nestedObjectsMissing
        ? 'External answer snapshot did not mention Nested Objects; strengthen owned answer signals and citations.'
        : 'External answer snapshot mentions the category, but owned answer coverage can be tightened.'
      : 'No external AI answer snapshot configured yet; use this as the baseline prompt to monitor weekly.',
    recommendedAnswerElements: missingElements.length ? missingElements : expected,
    internalLinks: expectedLinksForPrompt(promptItem.prompt, promptItem.targetPage),
    observedBrands: snapshot?.citedBrands || [],
    workflowStatus: 'candidate',
  }
}

function sortOpportunities(opportunities: AiAeoOpportunity[]) {
  return opportunities.sort((a, b) => b.score - a.score).slice(0, 12)
}

export async function runAiAeoMonitor(): Promise<AiAeoMonitorReport> {
  const snapshotResult = await fetchAnswerSnapshotsFromWebhook()
  const snapshotsByPrompt = new Map(snapshotResult.snapshots.map((snapshot) => [snapshot.prompt, snapshot]))
  const opportunities = sortOpportunities(
    PROMPT_SET.map((promptItem) => localOpportunityForPrompt(promptItem, snapshotsByPrompt.get(promptItem.prompt))),
  )

  return {
    generatedAt: generatedAt(),
    cadence: 'weekly',
    workflowBoundary:
      'This monitor identifies AI/AEO visibility gaps only. Supporting posts must use the existing blog draft, preview, review, approval, and sitemap workflow.',
    dataSources: [
      snapshotResult.source,
      {
        name: 'Owned prompt coverage model',
        status: 'configured',
        detail: `Scored ${PROMPT_SET.length} contractor-facing prompts against Nested Objects answer requirements.`,
        count: PROMPT_SET.length,
      },
    ],
    promptSet: PROMPT_SET,
    answerSnapshots: snapshotResult.snapshots,
    opportunities,
  }
}

