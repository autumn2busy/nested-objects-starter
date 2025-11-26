import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const checklistCards = [
  {
    title: 'Exterior photo set',
    body: 'Shot list and angles for exterior inspections so nothing gets missed when the clock is ticking.',
  },
  {
    title: 'Safety walk prep',
    body: 'PPE, weather, and equipment checks before you step onto a site or ladder.',
  },
  {
    title: 'Client follow-up',
    body: 'Templates for clarifying requirements, submitting proofs, and confirming pay timelines.',
  },
  {
    title: 'Gear bag essentials',
    body: 'Baseline kit for new inspectors plus optional upgrades as volume grows.',
  },
  {
    title: 'Route day checklist',
    body: 'Fuel, files, and device prep to keep you on schedule across multiple stops.',
  },
  {
    title: 'New vendor onboarding',
    body: 'Docs, training, and app installs to complete before you accept the first job.',
  },
]

export default function ChecklistsPage() {
  return (
    <main className="min-h-screen bg-brand-background text-brand-heading">
      <section className="border-b border-brand-border bg-brand-surface/90">
        <Container className="py-10 sm:py-12 lg:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Resources</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Field-ready checklists</h1>
          <p className="mt-2 max-w-3xl text-sm text-brand-muted">
            Grab quick-reference checklists for common inspection workflows. Print them, keep them in your truck, or save a copy
            inside the hub for fast access on the road.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button as={Link} href="/membership">
              Unlock full library
            </Button>
            <Button as={Link} href="/resources" variant="secondary">
              Return to resources
            </Button>
          </div>
        </Container>
      </section>

      <section className="bg-brand-background">
        <Container className="grid gap-6 py-10 md:grid-cols-2 lg:grid-cols-3 lg:py-14">
          {checklistCards.map((item) => (
            <Card key={item.title} className="border-brand-border bg-brand-surface p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-brand-heading">{item.title}</h2>
              <p className="mt-2 text-sm text-brand-muted">{item.body}</p>
              <div className="mt-4">
                <Button as={Link} href="/membership" variant="secondary" className="text-xs">
                  Download sample
                </Button>
              </div>
            </Card>
          ))}
        </Container>
      </section>
    </main>
  )
}
