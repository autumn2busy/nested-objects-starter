import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'

const tools = [
  {
    title: '🤖 AI concierge',
    description: 'Ask questions about firms, requirements, and inspection workflows in plain language.',
    href: '/tools/ai-chatbot',
    cta: 'Open AI concierge →',
  },
  {
    title: '📝 AI resume builder',
    description: 'Turn your experience, routes, and gear into a clean resume for field service firms.',
    href: '/tools/ai-resume',
    cta: 'Build my resume →',
  },
  {
    title: '📍 Job tracking',
    description: 'Track inspections, due dates, and pay so nothing slips through the cracks.',
    href: '/tools/job-tracker',
    cta: 'Go to job tracker →',
  },
  {
    title: '🌤 Weather',
    description: 'Plan around storms and daylight so your routes are safer and more profitable.',
    href: '/tools/weather',
    cta: 'Open weather tool →',
  },
  {
    title: '🗺 Route planning',
    description: 'Stack inspections into efficient routes so you burn less gas and make more per mile.',
    href: '/tools/routing',
    cta: 'Plan my routes →',
  },
]

export default function ToolsIndexPage() {
  return (
    <main className="min-h-screen bg-brand-background text-brand-heading">
      <section className="border-b border-brand-primary/15 bg-gradient-to-b from-brand-soft via-brand-surface to-brand-background">
        <Container className="flex flex-col gap-3 py-12 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Tools</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Inspector tools</h1>
          <p className="max-w-3xl text-base text-brand-muted">
            AI-powered tools to help you plan routes, watch the weather, and present yourself like the pro you are.
          </p>
          <div className="pt-2">
            <Button as={Link} href="/membership" variant="secondary">
              Compare plans
            </Button>
          </div>
        </Container>
      </section>

      <section className="bg-brand-surface">
        <Container className="grid gap-6 py-12 md:grid-cols-2 lg:grid-cols-3 lg:py-16">
          {tools.map((tool) => (
            <Card key={tool.href} className="flex h-full flex-col gap-3 border-brand-border bg-brand-surface p-6 shadow-sm">
              <div>
                <h2 className="text-xl font-semibold text-brand-heading">{tool.title}</h2>
                <p className="mt-2 text-sm text-brand-muted">{tool.description}</p>
              </div>
              <Link
                href={tool.href}
                className="text-sm font-semibold text-brand-primary decoration-brand-primary/70 underline underline-offset-4 transition hover:text-brand-primaryDark hover:decoration-brand-primary"
              >
                {tool.cta}
              </Link>
            </Card>
          ))}
        </Container>
      </section>
    </main>
  )
}
