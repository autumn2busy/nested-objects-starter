export type ToolMinimumPlan = 'Free' | 'Pro'

export type ToolDefinition = {
  title: string
  description: string
  href: string
  aliases?: string[]
  cta: string
  feature: string
  minimumPlan: ToolMinimumPlan
  previewItems: [string, string, string]
}

export const TOOL_CATALOG: ToolDefinition[] = [
  {
    title: 'Clients and vendors',
    description: 'Manage points of contact, pay dates, notes, and portal links for firms you work with.',
    href: '/tools/clients',
    cta: 'Manage clients',
    feature: 'job_tracking',
    minimumPlan: 'Pro',
    previewItems: ['Vendor contact records', 'Payment-term reminders', 'Portal and relationship notes'],
  },
  {
    title: 'Company tracker',
    description: 'Build a target list of firms and track each application from research through onboarding.',
    href: '/tools/companies',
    cta: 'Track companies',
    feature: 'job_tracking',
    minimumPlan: 'Pro',
    previewItems: ['Application pipeline', 'Firm research notes', 'Follow-up status'],
  },
  {
    title: 'Income calculator',
    description: 'Estimate potential route revenue based on assignment volume, average pay, and working days.',
    href: '/tools/income-calculator',
    cta: 'Calculate income',
    feature: 'income_calculator',
    minimumPlan: 'Free',
    previewItems: ['Weekly revenue estimate', 'Volume and rate scenarios', 'Simple route goal planning'],
  },
  {
    title: 'Notary route calculator',
    description: 'Compare signing pay with printing, scan-back, mileage, and nearby field-service add-ons.',
    href: '/tools/notary-route-calculator',
    cta: 'Calculate route pay',
    feature: 'notary_route_calculator',
    minimumPlan: 'Pro',
    previewItems: ['Net route estimate', 'Mileage and print costs', 'Inspection add-on comparison'],
  },
  {
    title: 'AI concierge',
    description: 'Ask questions about firms, requirements, equipment, and field-inspection workflows.',
    href: '/tools/ai-concierge',
    cta: 'Open AI concierge',
    feature: 'ai_concierge',
    minimumPlan: 'Pro',
    previewItems: ['Firm-fit questions', 'Requirement explanations', 'Workflow guidance'],
  },
  {
    title: 'AI resume builder',
    description: 'Turn your experience, routes, equipment, and transferable skills into a field-service resume.',
    href: '/tools/ai-resume',
    cta: 'Build my resume',
    feature: 'ai_resume',
    minimumPlan: 'Pro',
    previewItems: ['Field-service language', 'Transferable skill prompts', 'Download-ready resume structure'],
  },
  {
    title: 'Job tracker',
    description: 'Track applications, interviews, onboarding steps, and offers in one simple pipeline.',
    href: '/tools/job-tracker',
    aliases: ['/tools/job-tracking'],
    cta: 'Open job tracker',
    feature: 'job_tracking',
    minimumPlan: 'Pro',
    previewItems: ['Application stages', 'Interview and follow-up notes', 'Offer and onboarding status'],
  },
  {
    title: 'Weather',
    description: 'Check route conditions, daylight, and weather risks before accepting or sequencing assignments.',
    href: '/tools/weather',
    cta: 'Open weather tool',
    feature: 'weather_tool',
    minimumPlan: 'Pro',
    previewItems: ['Route weather checks', 'Daylight planning', 'Risk-aware scheduling'],
  },
  {
    title: 'Route planning',
    description: 'Group inspection stops into efficient routes so you spend less time and fuel between assignments.',
    href: '/tools/routing',
    cta: 'Plan my routes',
    feature: 'job_routing',
    minimumPlan: 'Pro',
    previewItems: ['Stop sequencing', 'Mileage awareness', 'Route profitability planning'],
  },
]

export function findToolForPath(pathname: string | null): ToolDefinition | null {
  if (!pathname) return null

  return TOOL_CATALOG.find((tool) => {
    const paths = [tool.href, ...(tool.aliases ?? [])]
    return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  }) ?? null
}
