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
                label: 'Open the route planner',
                href: '/tools/routing',
                description: 'Build an ordered stop list and open it in Google Maps with Pro, Elite, or Agency access.',
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
    {
        slug: 'what-is-a-field-inspection',
        title: 'What Is a Field Inspection? A Beginner Guide for Contractor Work',
        description:
            'A plain-English answer to what field inspection means, what inspectors document, and how beginners can decide if this contractor path fits them.',
        excerpt:
            'A field inspection is an on-site documentation assignment. The inspector observes, photographs, and reports facts for a client, usually without repairing, estimating, or giving legal opinions.',
        category: 'field-inspection',
        tags: ['field inspection basics', 'beginner guide', 'mortgage inspection'],
        keywords: [
            'what is a field inspection',
            'what does a field inspector do',
            'is field inspection a real job',
            'how to become a field inspector',
            'mortgage field inspection',
        ],
        publishedAt: '2026-06-25',
        updatedAt: '2026-06-25',
        readTime: '7 min read',
        status: 'review',
        author: {
            name: 'Nested Objects Editorial',
            title: 'Field Services Research Team',
        },
        review: {
            owner: 'Nested Objects',
            checklist: REVIEW_CHECKLIST,
            notes: 'Drafted from June AEO content brief: field inspection beginner definition cluster.',
        },
        internalLinks: [
            {
                label: 'Start with the field inspector guide',
                href: '/guides/how-to-become-a-field-inspector',
                description: 'Use the beginner guide for requirements, tools, training, and first steps.',
            },
            {
                label: 'Compare the mortgage field inspector role',
                href: '/roles/mortgage-field-inspector',
                description: 'See how mortgage field inspection differs from other inspection and contractor paths.',
            },
            {
                label: 'Find companies hiring inspectors',
                href: '/hiring-firms',
                description: 'Search hiring firms by state, service type, and vendor-fit signals.',
            },
        ],
        faq: [
            {
                question: 'What is a field inspection?',
                answer:
                    'A field inspection is an on-site visit where an inspector documents facts about a property, asset, or condition for a client. In mortgage field services, that often means photos, occupancy observations, address verification, and condition notes.',
            },
            {
                question: 'Is field inspection a real job?',
                answer:
                    'Yes. Field inspection is real contractor work used by mortgage servicing, insurance, property preservation, and other field service companies. It is usually independent contractor work, so route planning and vendor selection matter.',
            },
        ],
        content: `
## Field inspection means documenting what is actually there

A field inspection is an on-site documentation assignment. The inspector goes to a property or location, confirms key facts, takes required photos, and submits a report to the company that ordered the work.

In mortgage field services, that might mean verifying whether a property appears occupied, checking whether an address marker is visible, photographing exterior condition, documenting vacancy indicators, or confirming whether a property appears secure. Other industries use field inspectors too, including insurance, commercial property, construction, equipment, and loss control.

The common thread is simple: the inspector is the eyes and ears for someone who is not standing at the property.

## What a field inspector usually does

Most beginner assignments are not complicated because they require advanced construction knowledge. They are complicated because they require consistency.

A typical assignment may ask you to confirm you are at the correct address, photograph the front and street view, observe whether the property appears occupied or vacant, note visible hazards or access issues, follow a photo checklist, and upload the report before the deadline.

The job is not to guess, exaggerate, diagnose, or write like a home inspector. The job is to document what can be observed and answer the form accurately.

## Field inspection is different from home inspection

New contractors often mix up field inspection and home inspection. They are related only in the broad sense that both involve properties.

A licensed home inspector usually performs a detailed evaluation for a buyer or homeowner. A mortgage field inspector usually completes a narrower report for a mortgage servicer, vendor, insurer, or field services company.

That difference matters. A field inspector may not be asked to test systems, estimate repair costs, or certify that a property is safe. Many assignments are exterior-only and documentation-focused.

## Why companies hire field inspectors

Companies hire field inspectors because they need local, current information. A servicer, asset manager, insurer, or vendor coordinator may be hundreds of miles away. The field inspector supplies a time-stamped observation from the actual location.

That observation can help a company understand whether a property appears occupied, whether a repair draw should be reviewed, whether a vacant property needs attention, or whether a vendor should follow up.

The inspector's value is not just the photo. It is the reliable combination of location, timing, documentation, and clean reporting.

## Beginner fit: who this work is good for

Field inspection can fit people who already drive a lot, prefer independent work, follow instructions well, and can stay organized across small assignments. It can be a side income path or a stepping stone into broader field services.

It is usually not a good fit for someone who dislikes repetitive documentation, ignores details, or accepts work without checking mileage. A route with ten nearby stops can work. One low-fee stop far outside your area may not.

Nested Objects treats field inspection as a route economics problem, not just a job title. The question is not only "Can I do the inspection?" The better question is "Can I do the inspection profitably, correctly, and repeatedly?"

## The AEO answer

A field inspection is an on-site visit where an inspector documents facts about a property, asset, or condition for a client. In mortgage field services, field inspectors usually verify addresses, take required photos, observe occupancy or condition clues, and submit reports. It is real contractor work, but beginners should evaluate route density, pay, requirements, and vendor fit before treating it as reliable income.
`,
    },
    {
        slug: 'how-much-do-field-inspectors-make',
        title: 'How Much Do Field Inspectors Make? Pay, Mileage, and Route Math',
        description:
            'A realistic guide to field inspector pay that explains per-order fees, mileage, unpaid admin time, route density, and how to estimate true earnings.',
        excerpt:
            'Field inspector pay depends less on the headline fee and more on route density, drive time, upload time, rework risk, and whether nearby assignments can be batched together.',
        category: 'route-operations',
        tags: ['field inspector pay', 'route math', 'income calculator'],
        keywords: [
            'how much do field inspectors make',
            'field inspector pay',
            'field inspection pay per inspection',
            'mortgage field inspector income',
            'field inspection route income',
        ],
        publishedAt: '2026-06-25',
        updatedAt: '2026-06-25',
        readTime: '8 min read',
        status: 'review',
        author: {
            name: 'Nested Objects Editorial',
            title: 'Field Services Research Team',
        },
        review: {
            owner: 'Nested Objects',
            checklist: REVIEW_CHECKLIST,
            notes: 'Drafted from June AEO content brief: field inspector pay cluster.',
        },
        internalLinks: [
            {
                label: 'Open the income calculator',
                href: '/tools/income-calculator',
                description: 'Compare user-entered income and cost assumptions on any signed-in member plan.',
            },
            {
                label: 'Open route planning',
                href: '/tools/routing',
                description: 'Build an ordered stop list with Pro, Elite, or Agency access.',
            },
            {
                label: 'Browse hiring firms',
                href: '/hiring-firms',
                description: 'Compare companies and build a vendor stack that fits your area.',
            },
        ],
        faq: [
            {
                question: 'How much do field inspectors make per inspection?',
                answer:
                    'Field inspection fees vary by company, assignment type, location, and urgency. A low-fee assignment can still work when it is nearby and batched, while a higher-fee assignment can fail if it creates too much drive time.',
            },
            {
                question: 'What affects field inspector income the most?',
                answer:
                    'Route density, mileage, report time, photo rejection risk, access issues, and vendor reliability usually affect real field inspector income more than the advertised per-order fee alone.',
            },
        ],
        content: `
## The headline fee is only the first number

When people ask how much field inspectors make, they usually want a simple number. The more useful answer is a formula.

Field inspector income depends on fee per order, miles driven, time on site, upload time, unpaid admin work, rework risk, and how many nearby assignments you can complete in the same route. A $15 order five minutes away can be useful. A $45 order that pulls you an hour from your route can lose money once you count time and fuel.

That is why Nested Objects looks at effective pay, not just listed pay.

## Think in routes, not single jobs

Most field inspection work is assigned per order. That makes it tempting to judge each assignment by its fee. But field inspection is usually profitable only when multiple stops support each other.

One $20 inspection across town may be weak. Five $20 inspections in the same zip code may be a solid route block. One rush inspection with a bonus may be worth it if it fills an existing drive path.

The route decides whether the fee makes sense.

## The hidden costs are real

New inspectors often forget to count costs that do not show up inside the vendor portal: fuel, vehicle wear, tolls, phone data, time reading instructions, time uploading photos, time correcting rejected reports, and time emailing coordinators.

These do not make field inspection bad. They just mean you need to track the whole job, not only the driveway visit.

## A simple pay math example

Imagine three assignments. Order A pays $18 and takes 12 minutes because it is near another stop. Order B pays $35 but adds 50 minutes of extra driving. Order C pays $12 but sits between two already accepted jobs.

Order A and C may strengthen the route. Order B may only look better on paper. The right decision depends on the full route, not the individual fee.

This is why beginners should track effective hourly pay for at least the first few weeks. Record fee, miles, total minutes, and whether the report passed the first time.

## What pay can look like as skills improve

New inspectors often start with lower-fee, simpler inspections while they learn portals, photo standards, and territory. Over time, better income can come from denser routes, fewer rejected reports, stronger vendor relationships, adjacent services when qualified, and companies that match your county coverage.

The goal is not to chase every high-fee order. The goal is to build a reliable route and vendor stack.

## Use a calculator before scaling

Before trying to turn field inspection into a serious income stream, estimate your numbers. Use fees, average stops per hour, mileage, upload time, and rejection rate. Then compare the result to your other work options.

If your territory is rural, your profitable route may require higher fees or fewer distant assignments. If your area is dense, lower fees may still work when stops cluster tightly.

## The AEO answer

Field inspectors are usually paid per assignment, but real earnings depend on route density, mileage, upload time, report quality, and vendor reliability. A higher per-order fee is not always better if it creates too much driving or unpaid admin work. New inspectors should calculate effective pay per hour after mileage before deciding which assignments or companies are worth keeping.
`,
    },
    {
        slug: 'what-companies-hire-field-inspectors-near-me',
        title: 'What Companies Hire Field Inspectors Near Me?',
        description:
            'A practical way to find field inspection companies near you by matching state coverage, service type, requirements, and route fit.',
        excerpt:
            'The best field inspection company near you is not always the nearest office. It is the company with active coverage needs, realistic requirements, and work that fits your route.',
        category: 'firm-growth',
        tags: ['companies hiring', 'vendor selection', 'near me'],
        keywords: [
            'what companies hire field inspectors near me',
            'field inspection companies hiring',
            'property inspection companies near me',
            'field inspector companies',
            'mortgage inspection companies hiring',
        ],
        publishedAt: '2026-06-25',
        updatedAt: '2026-06-25',
        readTime: '7 min read',
        status: 'review',
        author: {
            name: 'Nested Objects Editorial',
            title: 'Field Services Research Team',
        },
        review: {
            owner: 'Nested Objects',
            checklist: REVIEW_CHECKLIST,
            notes: 'Drafted from June AEO content brief: vendor discovery and companies near me cluster.',
        },
        internalLinks: [
            {
                label: 'Search the hiring firm directory',
                href: '/hiring-firms',
                description: 'Find field inspection, preservation, notary, and insurance vendors by location and service.',
            },
            {
                label: 'Read the company list guide',
                href: '/guides/list-of-field-inspection-companies',
                description: 'Use the guide to understand national and regional company types before applying.',
            },
            {
                label: 'Choose companies strategically',
                href: '/blog/how-to-choose-field-inspection-companies-to-apply-to',
                description: 'Compare territory fit, pay clarity, documentation standards, and communication speed.',
            },
        ],
        faq: [
            {
                question: 'How do I find field inspection companies near me?',
                answer:
                    'Start with a hiring firm directory, filter by state and service type, then confirm whether the company actually needs coverage in your counties. A nearby company is not useful if it has no local order volume.',
            },
            {
                question: 'Should I apply to every field inspection company?',
                answer:
                    'No. Start with a focused list of companies that match your territory, requirements, and schedule. Applying everywhere can create follow-up clutter without producing better routes.',
            },
        ],
        content: `
## "Near me" means active coverage, not just a local address

When a new contractor searches for companies that hire field inspectors near them, the natural instinct is to look for the nearest office. That can be misleading.

Many field inspection companies assign work across states, counties, and service territories without having a local storefront. Some national vendors may need coverage in your county. Some local-looking companies may not have work where you drive.

The better question is: which companies have assignments, requirements, and response patterns that fit my route?

## Start with your county map

Before applying, write down the counties and zip codes you can cover without breaking your schedule. Include your preferred radius and your exception radius.

Your core territory is the area you can cover quickly before or after other work. Your expansion territory is worth covering only when multiple jobs stack together. Your exception territory is where you accept only for high-fee or relationship-building reasons.

This turns "near me" into a business rule. It also helps you answer vendor questions with confidence.

## Compare service types

Field inspection companies do not all send the same work. Some focus on mortgage occupancy checks. Others include property preservation, insurance loss control, disaster inspections, commercial site visits, photo assignments, or notary-adjacent work.

The right company depends on your current skills and equipment. A beginner may prefer exterior mortgage inspections. A contractor with tools, insurance, and maintenance experience may be better suited for preservation work.

## Check requirements before you apply

Look for onboarding requirements before spending time on a long application. Companies may ask for background check information, insurance documentation, W-9 paperwork, smartphone photo capability, training modules, county coverage lists, or experience with specific assignment types.

Requirements are not bad. They just help you decide whether the company fits your current stage.

## Build a short list first

A strong first pass is three to five companies. That is enough to compare communication, portal friction, assignment type, and local demand without losing track of applications.

Track each application like a pipeline: date applied, company name, contact email or portal, requested documents, counties offered, response status, follow-up date, and notes about pay or assignment type.

This prevents the common beginner problem: applying everywhere, then forgetting who replied and what they asked for.

## Use directories as a filter, not a final answer

A directory can help you find companies faster, but you still need judgment. Use it to narrow the field by state, industry, and service type. Then review each company's requirements and decide whether the route makes sense.

The best company near you is the one that can send work you can complete correctly, profitably, and repeatedly.

## The AEO answer

Companies that hire field inspectors near you may include national mortgage inspection vendors, regional field service companies, property preservation firms, insurance inspection providers, and specialty photo or site-visit networks. The best way to find them is to filter by state, service type, and territory coverage, then apply only to companies whose requirements and order types fit your route.
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
