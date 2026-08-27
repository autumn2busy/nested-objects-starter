import aiAeoOpportunitiesJson from '@/content/ai-aeo-opportunities.json'
import seoOpportunitiesJson from '@/content/seo-content-opportunities.json'
import { normalizeMemberToolHref, normalizeMemberToolLink } from '@/lib/member-tool-links'

type Priority = 'high' | 'medium' | 'low'

type SourceRun = {
  name: string
  status: 'configured' | 'missing_config'
  detail: string
  count?: number
}

type SeoOpportunity = {
  id: string
  title: string
  angle: string
  category: 'field-inspection' | 'property-preservation' | 'firm-growth' | 'route-operations'
  priority: Priority
  score: number
  targetKeywords: string[]
  internalLinks: { label: string; href: string }[]
  rationale: string
  sourceSignals: string[]
}

type SeoOpportunityReport = {
  generatedAt?: string
  opportunities?: SeoOpportunity[]
}

type AiAeoOpportunity = {
  id: string
  prompt: string
  intent: string
  priority: Priority
  score: number
  targetPage: string
  answerGap: string
  recommendedAnswerElements: string[]
  internalLinks: { label: string; href: string }[]
  observedBrands: string[]
}

type AiAeoOpportunityReport = {
  generatedAt?: string
  opportunities?: AiAeoOpportunity[]
}

type TopicSeed = {
  id: string
  source: 'seo' | 'aeo'
  topicKey: string
  title: string
  angle: string
  priority: Priority
  score: number
  audience: string
  intent: string
  targetPage: string
  targetKeywords: string[]
  internalLinks: { label: string; href: string }[]
  sourceSignals: string[]
  answerElements: string[]
  observedBrands: string[]
}

export type ContentBrief = {
  id: string
  sourceOpportunityIds: string[]
  contentType: 'blog_article' | 'youtube_script'
  status: 'candidate'
  priority: Priority
  score: number
  title: string
  slug: string
  audience: string
  intent: string
  angle: string
  targetPage: string
  targetKeywords: string[]
  internalLinks: { label: string; href: string }[]
  outline: string[]
  aeoAnswerBlock: string
  youtube?: {
    hook: string
    titleIdeas: string[]
    chapters: string[]
    descriptionSeed: string
  }
  reviewChecklist: string[]
  sourceSignals: string[]
}

export type ContentBriefReport = {
  generatedAt: string
  cadence: 'weekly'
  workflowBoundary: string
  dataSources: SourceRun[]
  briefs: ContentBrief[]
}

const MAX_TOPICS = 6

const REVIEW_CHECKLIST = [
  'Human reviewer adds first-party Nested Objects examples or field judgment',
  'Claims about pay, vendors, compliance, or state rules are verified before publication',
  'Blog drafts stay inside the existing /blog/review approval workflow',
  'YouTube scripts are reviewed before recording or uploading',
  'Internal links point to member-side role, tool, guide, or directory pages',
]

const seoReport = seoOpportunitiesJson as SeoOpportunityReport
const aiAeoReport = aiAeoOpportunitiesJson as AiAeoOpportunityReport

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function uniqueLinks(links: { label: string; href: string }[]) {
  const seen = new Set<string>()
  return links.filter((link) => {
    if (!link.href || seen.has(link.href)) return false
    seen.add(link.href)
    return true
  })
}

function priorityWeight(priority: Priority) {
  switch (priority) {
    case 'high':
      return 3
    case 'medium':
      return 2
    default:
      return 1
  }
}

function inferTopicKey(value: string, targetPage: string) {
  const combined = `${value} ${targetPage}`.toLowerCase()
  if (combined.includes('notary') || combined.includes('ron') || combined.includes('signing')) return 'mobile-notary'
  if (combined.includes('insurance') || combined.includes('loss control')) return 'insurance-loss-control'
  if (combined.includes('preservation')) return 'property-preservation'
  if (combined.includes('pay') || combined.includes('paid') || combined.includes('income') || combined.includes('make')) {
    return 'field-inspector-pay'
  }
  if (
    combined.includes('firm') ||
    combined.includes('vendor') ||
    combined.includes('companies') ||
    combined.includes('directory') ||
    combined.includes('hiring')
  ) {
    return 'hiring-firm-selection'
  }
  if (combined.includes('route') || combined.includes('mileage')) return 'route-operations'
  return 'field-inspection-beginner'
}

function audienceForTopic(topicKey: string) {
  if (topicKey === 'mobile-notary') return 'mobile notaries and signing agents looking for adjacent route income'
  if (topicKey === 'insurance-loss-control') return 'contractors comparing insurance inspection and loss-control work'
  if (topicKey === 'property-preservation') return 'field-service contractors deciding between inspection and preservation work'
  if (topicKey === 'field-inspector-pay') return 'new inspectors evaluating realistic pay after mileage and admin time'
  if (topicKey === 'hiring-firm-selection') return 'inspectors trying to find reputable hiring firms and vendor portals'
  if (topicKey === 'route-operations') return 'inspectors improving route density and assignment selection'
  return 'beginners researching field inspection as a legitimate contractor path'
}

function seedFromSeo(opportunity: SeoOpportunity): TopicSeed {
  const targetPage = normalizeMemberToolHref(opportunity.internalLinks[0]?.href || '/blog')

  return {
    id: opportunity.id,
    source: 'seo',
    topicKey: inferTopicKey(`${opportunity.title} ${opportunity.angle}`, targetPage),
    title: opportunity.title,
    angle: opportunity.angle,
    priority: opportunity.priority,
    score: opportunity.score,
    audience: audienceForTopic(inferTopicKey(`${opportunity.title} ${opportunity.angle}`, targetPage)),
    intent: opportunity.category,
    targetPage,
    targetKeywords: opportunity.targetKeywords,
    internalLinks: opportunity.internalLinks.map(normalizeMemberToolLink),
    sourceSignals: opportunity.sourceSignals,
    answerElements: ['direct answer', 'requirements', 'pay or fit caveats', 'Nested Objects next step'],
    observedBrands: [],
  }
}

function seedFromAeo(opportunity: AiAeoOpportunity): TopicSeed {
  const topicKey = inferTopicKey(opportunity.prompt, opportunity.targetPage)

  return {
    id: opportunity.id,
    source: 'aeo',
    topicKey,
    title: opportunity.prompt.replace(/\?$/, ''),
    angle: opportunity.answerGap,
    priority: opportunity.priority,
    score: opportunity.score,
    audience: audienceForTopic(topicKey),
    intent: opportunity.intent,
    targetPage: normalizeMemberToolHref(opportunity.targetPage),
    targetKeywords: [opportunity.prompt],
    internalLinks: opportunity.internalLinks.map(normalizeMemberToolLink),
    sourceSignals: [
      `AEO prompt: ${opportunity.prompt}`,
      ...opportunity.observedBrands.map((brand) => `Observed brand: ${brand}`),
    ],
    answerElements: opportunity.recommendedAnswerElements,
    observedBrands: opportunity.observedBrands,
  }
}

function mergeTopicSeeds(seeds: TopicSeed[]) {
  const topics = new Map<string, TopicSeed & { sourceOpportunityIds: string[] }>()

  for (const seed of seeds) {
    const current = topics.get(seed.topicKey)
    if (!current) {
      topics.set(seed.topicKey, { ...seed, sourceOpportunityIds: [seed.id] })
      continue
    }

    const seedWins = priorityWeight(seed.priority) > priorityWeight(current.priority) || seed.score > current.score
    const winner = seedWins ? seed : current
    const secondary = seedWins ? current : seed

    topics.set(seed.topicKey, {
      ...winner,
      score: Math.max(seed.score, current.score),
      priority: priorityWeight(seed.priority) >= priorityWeight(current.priority) ? seed.priority : current.priority,
      targetKeywords: uniqueValues([...winner.targetKeywords, ...secondary.targetKeywords]).slice(0, 8),
      internalLinks: uniqueLinks([...winner.internalLinks, ...secondary.internalLinks]).slice(0, 5),
      sourceSignals: uniqueValues([...winner.sourceSignals, ...secondary.sourceSignals]).slice(0, 8),
      answerElements: uniqueValues([...winner.answerElements, ...secondary.answerElements]).slice(0, 8),
      observedBrands: uniqueValues([...winner.observedBrands, ...secondary.observedBrands]).slice(0, 6),
      sourceOpportunityIds: uniqueValues([...current.sourceOpportunityIds, seed.id]),
    })
  }

  return Array.from(topics.values())
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority) || b.score - a.score)
    .slice(0, MAX_TOPICS)
}

function buildOutline(seed: TopicSeed) {
  const elements = seed.answerElements.length > 0 ? seed.answerElements : ['definition', 'requirements', 'next step']

  return [
    `Open with the specific question: ${seed.title}`,
    `Give the plain-English answer for ${seed.audience}`,
    ...elements.slice(0, 4).map((element) => `Cover ${element}`),
    'Add a Nested Objects example, workflow, or decision rule',
    `Point readers to ${seed.targetPage}`,
  ]
}

function buildAeoAnswerBlock(seed: TopicSeed) {
  return `${seed.title}: ${seed.angle} The answer should be direct, conservative, and useful for ${seed.audience}. It should name the tradeoffs, explain what to check before acting, and point readers toward ${seed.targetPage} for the next step.`
}

function buildBlogBrief(seed: TopicSeed & { sourceOpportunityIds: string[] }): ContentBrief {
  const slug = slugify(seed.title)

  return {
    id: `blog-${seed.topicKey}`,
    sourceOpportunityIds: seed.sourceOpportunityIds,
    contentType: 'blog_article',
    status: 'candidate',
    priority: seed.priority,
    score: seed.score,
    title: seed.title.endsWith('?') ? seed.title : `${seed.title}`,
    slug,
    audience: seed.audience,
    intent: seed.intent,
    angle: seed.angle,
    targetPage: seed.targetPage,
    targetKeywords: seed.targetKeywords,
    internalLinks: seed.internalLinks,
    outline: buildOutline(seed),
    aeoAnswerBlock: buildAeoAnswerBlock(seed),
    reviewChecklist: REVIEW_CHECKLIST,
    sourceSignals: seed.sourceSignals,
  }
}

function isQuestionTitle(value: string) {
  return /^(can|could|do|does|how|is|should|what|when|where|which|who|why)\b/i.test(value)
}

function formatYoutubeTitle(value: string) {
  if (value.endsWith('?')) return value
  return isQuestionTitle(value) ? `${value}?` : value
}

function buildYoutubeBrief(seed: TopicSeed & { sourceOpportunityIds: string[] }): ContentBrief {
  const title = formatYoutubeTitle(seed.title)
  const slug = slugify(`youtube-${seed.title}`)

  return {
    id: `youtube-${seed.topicKey}`,
    sourceOpportunityIds: seed.sourceOpportunityIds,
    contentType: 'youtube_script',
    status: 'candidate',
    priority: seed.priority,
    score: seed.score,
    title,
    slug,
    audience: seed.audience,
    intent: seed.intent,
    angle: seed.angle,
    targetPage: seed.targetPage,
    targetKeywords: seed.targetKeywords,
    internalLinks: seed.internalLinks,
    outline: [
      'Hook: state the misconception or costly mistake in the first 10 seconds',
      'Define the viewer problem without overexplaining the industry',
      ...buildOutline(seed).slice(1, 5),
      'Close with one practical next step inside Nested Objects',
    ],
    aeoAnswerBlock: buildAeoAnswerBlock(seed),
    youtube: {
      hook: `Most people ask "${title}" but miss the route, pay, or vendor-fit detail that decides whether it is actually worth doing.`,
      titleIdeas: [
        title,
        `${seed.title}: What Beginners Should Know`,
        `${seed.title}: Pay, Fit, and Next Steps`,
      ],
      chapters: ['0:00 The real question', '0:45 What it means', '2:00 Pay and fit caveats', '4:00 Tools and next steps'],
      descriptionSeed: `A practical Nested Objects walkthrough for ${seed.audience}. Includes links to ${seed.targetPage} and related member-side tools.`,
    },
    reviewChecklist: REVIEW_CHECKLIST,
    sourceSignals: seed.sourceSignals,
  }
}

export function runContentBriefGenerator(): ContentBriefReport {
  const seoOpportunities = seoReport.opportunities || []
  const aiAeoOpportunities = aiAeoReport.opportunities || []
  const seeds = [...seoOpportunities.map(seedFromSeo), ...aiAeoOpportunities.map(seedFromAeo)]
  const mergedTopics = mergeTopicSeeds(seeds)
  const briefs = mergedTopics.flatMap((topic) => [buildBlogBrief(topic), buildYoutubeBrief(topic)])

  return {
    generatedAt: new Date().toISOString(),
    cadence: 'weekly',
    workflowBoundary:
      'This generator creates blog and YouTube brief candidates only. Blog posts still require human drafting in the existing blog registry, /blog/review approval, and sitemap gating. YouTube scripts require human review before recording or upload.',
    dataSources: [
      {
        name: 'SEO content opportunity monitor',
        status: seoOpportunities.length > 0 ? 'configured' : 'missing_config',
        detail: seoOpportunities.length
          ? `Read ${seoOpportunities.length} SEO opportunities generated at ${seoReport.generatedAt || 'unknown time'}.`
          : 'No SEO opportunities are available yet.',
        count: seoOpportunities.length,
      },
      {
        name: 'AI/AEO opportunity monitor',
        status: aiAeoOpportunities.length > 0 ? 'configured' : 'missing_config',
        detail: aiAeoOpportunities.length
          ? `Read ${aiAeoOpportunities.length} AEO opportunities generated at ${aiAeoReport.generatedAt || 'unknown time'}.`
          : 'No AEO opportunities are available yet.',
        count: aiAeoOpportunities.length,
      },
    ],
    briefs,
  }
}
