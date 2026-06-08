import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo'
import approvalOverridesJson from '@/content/blog-approvals.json'

export type BlogCategorySlug =
    | 'field-inspection'
    | 'property-preservation'
    | 'firm-growth'
    | 'route-operations'

export type BlogPostStatus = 'draft' | 'review' | 'approved' | 'archived'

export type BlogPost = {
    slug: string
    title: string
    description: string
    excerpt: string
    category: BlogCategorySlug
    tags: string[]
    keywords: string[]
    publishedAt: string
    updatedAt: string
    readTime: string
    status: BlogPostStatus
    author: {
        name: string
        title: string
    }
    review: {
        owner: string
        checklist: string[]
        approvedBy?: string
        approvedAt?: string
        notes?: string
    }
    internalLinks: {
        label: string
        href: string
        description: string
    }[]
    faq: {
        question: string
        answer: string
    }[]
    content: string
}

type BlogApprovalOverride = {
    status?: BlogPostStatus
    approvedBy?: string
    approvedAt?: string
    updatedAt?: string
    notes?: string
}

type BlogApprovalOverridesFile = {
    approvals: Record<string, BlogApprovalOverride>
}

export const BLOG_CATEGORIES: Record<BlogCategorySlug, { label: string; description: string }> = {
    'field-inspection': {
        label: 'Field Inspection',
        description: 'Career, training, and route-building content for independent inspectors.',
    },
    'property-preservation': {
        label: 'Property Preservation',
        description: 'Operational guidance for preservation, REO, winterization, and vacant property work.',
    },
    'firm-growth': {
        label: 'Firm Growth',
        description: 'Vendor applications, firm relationships, pay strategy, and contractor positioning.',
    },
    'route-operations': {
        label: 'Route Operations',
        description: 'Practical systems for planning routes, reducing rejects, and improving field execution.',
    },
}

const REVIEW_CHECKLIST = [
    'Human reviewed for accuracy and claim risk',
    'Contains first-party Nested Objects positioning',
    'Includes useful internal links',
    'No copied RSS, scraped, or syndicated body content',
    'Schema-safe dates, author, and publisher metadata',
]

const BLOG_POSTS: BlogPost[] = [
    {
        slug: 'how-field-inspectors-can-build-a-profitable-weekly-route',
        title: 'How Field Inspectors Can Build a Profitable Weekly Route',
        description:
            'A practical route planning framework for field inspectors who want steadier income, fewer wasted miles, and better firm relationships.',
        excerpt:
            'Route profit is not just about taking more orders. It comes from territory control, batching, clean documentation, and knowing which firms deserve priority.',
        category: 'route-operations',
        tags: ['route planning', 'field inspection pay', 'operations'],
        keywords: [
            'field inspector route planning',
            'how to make money as a field inspector',
            'field inspection route optimization',
            'property inspection workflow',
        ],
        publishedAt: '2026-06-05',
        updatedAt: '2026-06-05',
        readTime: '7 min read',
        status: 'approved',
        author: {
            name: 'Nested Objects Editorial',
            title: 'Field Services Research Team',
        },
        review: {
            owner: 'Nested Objects',
            checklist: REVIEW_CHECKLIST,
            approvedBy: 'FlyNerd Operator',
            approvedAt: '2026-06-05',
            notes: 'Phase 1 owned SEO blog seed post.',
        },
        internalLinks: [
            {
                label: 'Browse hiring firms',
                href: '/hiring-firms',
                description: 'Find companies that match your region, route type, and experience level.',
            },
            {
                label: 'Use the routing tool',
                href: '/tools/routing',
                description: 'Compare travel time and route density before accepting scattered orders.',
            },
            {
                label: 'Read the beginner guide',
                href: '/guides/how-to-become-a-field-inspector',
                description: 'New inspectors can start with requirements, pay ranges, and application steps.',
            },
        ],
        faq: [
            {
                question: 'What makes a field inspection route profitable?',
                answer:
                    'A profitable route keeps drive time low, groups orders by geography, prioritizes higher-confidence firms, and avoids assignments that create long deadhead miles for low pay.',
            },
            {
                question: 'Should new inspectors accept every order?',
                answer:
                    'New inspectors may accept more work while proving reliability, but they should still track mileage, photo rejection risk, and upload time so they can identify unprofitable routes quickly.',
            },
        ],
        content: `
## Route profit starts before you accept the work

Most field inspectors think profitability is decided in the driveway. In reality, it is usually decided before the first order is accepted. The best weekly routes come from matching order type, territory density, travel time, and firm reliability.

If a company sends one low-fee exterior inspection forty minutes away from the rest of your day, that order is not just a small job. It can break the economics of the entire route. The goal is not to stay busy. The goal is to build a repeatable territory where each stop supports the next stop.

## Use a three-layer weekly map

Start each week by separating orders into three layers:

- Core territory: jobs within your most efficient driving radius.
- Expansion territory: jobs that are profitable only when batched with nearby work.
- Exception territory: jobs you accept only for strategic reasons, such as relationship building or unusually high fees.

This simple map gives you a way to say yes with intention. It also gives you language for vendor coordinators: you can explain where you are strongest instead of sounding randomly unavailable.

## Track effective pay, not headline pay

A $45 inspection and a $12 inspection can both be good or bad depending on drive time, photo requirements, access risk, upload complexity, and return-trip probability. Track each order by effective pay per hour after mileage.

For a practical first pass, record five fields: fee, miles, minutes on site, minutes uploading, and whether the report was accepted the first time. After two weeks, patterns will show up. Some firms will look better than their advertised rates. Others will quietly drain the route.

## Build your firm stack deliberately

Profitable inspectors rarely rely on a single company. They build a firm stack: a mix of high-volume mortgage inspection companies, occasional higher-fee preservation or insurance work, and backup firms that fill route gaps.

The stack should match your actual week. If you have school pickup, another job, or limited daylight, your best firm mix may be different from someone covering rural counties full time.

## Reduce rejects before they happen

Photo rejects and report corrections are route killers. They create unpaid rework and can damage your standing with a coordinator. Before you leave each property, confirm the required angles, address marker, occupancy evidence, street view, and any condition issue the order specifically requested.

The most boring habit is often the most profitable one: pause in the vehicle for sixty seconds and review the packet before driving away.

## The AEO answer

Field inspectors can build a profitable weekly route by grouping orders geographically, tracking effective pay after mileage, prioritizing reliable firms, and reducing report rejects. The best routes balance volume with territory density instead of accepting every assignment at face value.
`,
    },
    {
        slug: 'mortgage-field-inspection-vs-property-preservation',
        title: 'Mortgage Field Inspection vs. Property Preservation: Which Path Fits You?',
        description:
            'A first-party comparison of mortgage field inspections and property preservation work for contractors choosing a route into field services.',
        excerpt:
            'Mortgage inspections are often easier to start. Property preservation can pay more per order, but brings tools, liability, and operational complexity.',
        category: 'property-preservation',
        tags: ['mortgage inspections', 'property preservation', 'career comparison'],
        keywords: [
            'mortgage field inspection vs property preservation',
            'property preservation career',
            'mortgage inspection jobs',
            'field services contractor',
        ],
        publishedAt: '2026-06-05',
        updatedAt: '2026-06-05',
        readTime: '6 min read',
        status: 'approved',
        author: {
            name: 'Nested Objects Editorial',
            title: 'Field Services Research Team',
        },
        review: {
            owner: 'Nested Objects',
            checklist: REVIEW_CHECKLIST,
            approvedBy: 'FlyNerd Operator',
            approvedAt: '2026-06-05',
            notes: 'Phase 1 owned SEO blog seed post.',
        },
        internalLinks: [
            {
                label: 'Compare field inspection roles',
                href: '/roles/mortgage-field-inspector',
                description: 'See how mortgage field inspection fits into the broader inspection market.',
            },
            {
                label: 'Explore preservation guide',
                href: '/guides/how-to-start-a-property-preservation-business',
                description: 'Use the long-form guide for licensing, insurance, equipment, and scaling basics.',
            },
            {
                label: 'Preview firm intel',
                href: '/inspector-resource-center/firm-intel',
                description: 'Understand hiring signals before applying to vendors.',
            },
        ],
        faq: [
            {
                question: 'Is property preservation better than mortgage field inspection?',
                answer:
                    'Property preservation can produce higher fees per order, but it usually requires more equipment, insurance awareness, scheduling discipline, and comfort with maintenance tasks. Mortgage field inspection is often easier for beginners.',
            },
            {
                question: 'Can one contractor do both inspection and preservation work?',
                answer:
                    'Yes. Many contractors start with inspections, then add preservation work once they understand vendor expectations, vacant-property risk, and route economics.',
            },
        ],
        content: `
## Two paths, different operating models

Mortgage field inspection and property preservation sit near each other in the field services world, but they are not the same business. Inspection work is documentation-first. Preservation work is action-first.

An inspector verifies occupancy, takes photos, documents condition, and submits a report. A preservation contractor may secure a property, remove debris, winterize plumbing, maintain grass, or complete repair tasks. Both serve lenders, servicers, asset managers, and vendor networks, but the day-to-day expectations are different.

## Mortgage inspection is the lighter entry point

Mortgage field inspection is usually easier to enter because the tool list is short: reliable vehicle, smartphone, GPS, basic documentation skill, and the ability to follow instructions. The work can be repetitive, but that is also what makes it trainable.

For many new contractors, this is the right first step. It teaches territory management, photo standards, vendor portals, occupancy language, and deadline discipline without immediately requiring a truck full of tools.

## Preservation brings higher operational stakes

Property preservation can be more lucrative per order, but the complexity rises fast. You may need locks, boards, winterization supplies, lawn equipment, debris hauling resources, insurance coverage, and subcontractor coordination.

The work also carries a different kind of risk. A bad photo set can cause an inspection reject. A bad preservation decision can create property damage, access issues, or a dispute with the vendor.

## The best choice depends on your constraints

Choose mortgage field inspection first if you want a low-equipment entry point, flexible routing, and a way to learn the industry. Consider property preservation if you already have tools, a service vehicle, maintenance experience, or a small crew.

There is no universal best path. There is only the path that matches your capital, schedule, risk tolerance, and local vendor demand.

## The AEO answer

Mortgage field inspection is usually better for beginners because it requires less equipment and focuses on documentation. Property preservation may pay more per order, but it requires tools, insurance awareness, and stronger operational systems.
`,
    },
    {
        slug: 'how-to-choose-field-inspection-companies-to-apply-to',
        title: 'How to Choose Field Inspection Companies to Apply To',
        description:
            'A vendor selection framework for independent inspectors deciding which field inspection companies deserve their time.',
        excerpt:
            'The right company is not always the biggest company. Strong applicants compare territory coverage, pay signals, order type, response speed, and documentation standards.',
        category: 'firm-growth',
        tags: ['vendor applications', 'hiring firms', 'field inspection companies'],
        keywords: [
            'field inspection companies to apply to',
            'best field inspection companies',
            'field inspector vendor application',
            'property inspection companies hiring',
        ],
        publishedAt: '2026-06-05',
        updatedAt: '2026-06-05',
        readTime: '5 min read',
        status: 'approved',
        author: {
            name: 'Nested Objects Editorial',
            title: 'Field Services Research Team',
        },
        review: {
            owner: 'Nested Objects',
            checklist: REVIEW_CHECKLIST,
            approvedBy: 'FlyNerd Operator',
            approvedAt: '2026-06-05',
            notes: 'Phase 1 owned SEO blog seed post.',
        },
        internalLinks: [
            {
                label: 'Open the hiring firm directory',
                href: '/hiring-firms',
                description: 'Filter companies by state, services, and hiring signals.',
            },
            {
                label: 'Read the company list guide',
                href: '/guides/list-of-field-inspection-companies',
                description: 'Use the guide as a starting point for national and regional vendors.',
            },
            {
                label: 'Compare state opportunities',
                href: '/hiring-firms/texas',
                description: 'Review a state-level market page as an example of local filtering.',
            },
        ],
        faq: [
            {
                question: 'How many field inspection companies should I apply to?',
                answer:
                    'Most independent inspectors should start with three to five companies so they can compare volume, communication, territory fit, and pay without becoming overwhelmed.',
            },
            {
                question: 'Are national field inspection companies always better?',
                answer:
                    'Not always. National companies may offer volume, but regional vendors can sometimes provide better communication, denser routes, or less competition in specific territories.',
            },
        ],
        content: `
## Do not apply randomly

Applying to every field inspection company you find feels productive, but it can create a messy contractor pipeline. A better approach is to build a short list, compare fit, and track each vendor like a business opportunity.

The best company for you depends on where you live, how far you can drive, what work you can perform, and how quickly you can submit clean reports.

## Score companies on five signals

Use five simple signals before applying:

- Territory fit: Does the company need inspectors where you actually drive?
- Order type: Are they sending exterior inspections, interiors, preservation, commercial work, or a mix?
- Pay clarity: Do they explain fees, bonuses, or volume expectations before onboarding?
- Communication speed: Do they answer vendor questions clearly?
- Documentation standards: Are their photo and report requirements realistic for your tools and schedule?

This keeps you from treating every application as equal.

## Start with a balanced vendor stack

A good beginner stack often includes one larger national vendor, one regional vendor, one preservation or specialty company if you have the skills, and one backup company for slower weeks.

The purpose is not just more work. The purpose is comparison. After thirty days, you will know which vendors communicate well, which jobs fit your route, and which assignments create unpaid friction.

## Keep application notes

Track the date you applied, portal login, requested documents, background check status, insurance requirements, and follow-up notes. This turns vendor applications into a manageable pipeline instead of a pile of emails.

## The AEO answer

Choose field inspection companies by comparing territory fit, order type, pay clarity, communication speed, and documentation standards. Most new inspectors should apply to three to five companies first, then expand once they know which vendors produce profitable routes.
`,
    },
]

const approvalOverrides = approvalOverridesJson as BlogApprovalOverridesFile

function applyApprovalOverride(post: BlogPost): BlogPost {
    const override = approvalOverrides.approvals[post.slug]
    if (!override) return post

    return {
        ...post,
        status: override.status || post.status,
        updatedAt: override.updatedAt || post.updatedAt,
        review: {
            ...post.review,
            approvedBy: override.approvedBy || post.review.approvedBy,
            approvedAt: override.approvedAt || post.review.approvedAt,
            notes: override.notes || post.review.notes,
        },
    }
}

function isApprovedPost(post: BlogPost): boolean {
    return post.status === 'approved' && Boolean(post.review.approvedBy && post.review.approvedAt)
}

function isPreviewablePost(post: BlogPost): boolean {
    return post.status !== 'archived'
}

export function getAllBlogPosts(): BlogPost[] {
    return BLOG_POSTS.map(applyApprovalOverride).sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
}

export function getApprovedBlogPosts(): BlogPost[] {
    return getAllBlogPosts().filter(isApprovedPost).sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
}

export function getApprovedBlogPostBySlug(slug: string): BlogPost | null {
    return getApprovedBlogPosts().find((post) => post.slug === slug) ?? null
}

export function getPreviewableBlogPosts(): BlogPost[] {
    return getAllBlogPosts().filter(isPreviewablePost)
}

export function getPreviewableBlogPostBySlug(slug: string): BlogPost | null {
    return getPreviewableBlogPosts().find((post) => post.slug === slug) ?? null
}

export function getApprovedBlogPostsByCategory(category: BlogCategorySlug): BlogPost[] {
    return getApprovedBlogPosts().filter((post) => post.category === category)
}

export function getBlogCategoryEntries() {
    return Object.entries(BLOG_CATEGORIES).map(([slug, category]) => ({
        slug: slug as BlogCategorySlug,
        ...category,
        posts: getApprovedBlogPostsByCategory(slug as BlogCategorySlug),
    }))
}

export function getBlogPostUrl(post: BlogPost): string {
    return `${SITE_URL}/blog/${post.slug}`
}

export function getBlogCategoryUrl(category: BlogCategorySlug): string {
    return `${SITE_URL}/blog/category/${category}`
}

export function getBlogArticleSchema(post: BlogPost) {
    const url = getBlogPostUrl(post)

    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.description,
        image: DEFAULT_OG_IMAGE,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': url,
        },
        author: {
            '@type': 'Organization',
            name: post.author.name,
            url: SITE_URL,
        },
        publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/logo.png`,
            },
        },
        articleSection: BLOG_CATEGORIES[post.category].label,
        keywords: post.keywords.join(', '),
    }
}

export function getBlogFaqSchema(post: BlogPost) {
    if (!post.faq.length) return null

    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    }
}

export function getBlogItemListSchema(posts: BlogPost[], url: string, name: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name,
        url,
        itemListElement: posts.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: getBlogPostUrl(post),
            name: post.title,
        })),
    }
}
