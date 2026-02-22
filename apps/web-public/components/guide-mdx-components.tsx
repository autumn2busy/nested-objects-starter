import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

// ─── Section heading with anchor ────────────────────────────────
function SectionHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 mb-4 scroll-mt-24 text-2xl font-bold text-slate-900 sm:text-3xl">
      {children}
    </h2>
  )
}

// ─── Step card for how-to guides ────────────────────────────────
function StepCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
        {number}
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-slate-600">{children}</div>
      </div>
    </div>
  )
}

// ─── Callout / highlight box ────────────────────────────────────
function Callout({ type = 'info', title, children }: { type?: 'info' | 'warning' | 'tip'; title?: string; children: React.ReactNode }) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    tip: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }

  return (
    <div className={`my-6 rounded-xl border px-5 py-4 ${styles[type]}`}>
      {title && <p className="mb-1 text-sm font-bold">{title}</p>}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}

// ─── Requirement / feature card ─────────────────────────────────
function RequirementCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <span className="text-sm text-slate-700">{children}</span>
    </div>
  )
}

// ─── Requirements grid ──────────────────────────────────────────
function RequirementsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>
}

// ─── Info block (used for inspection types, tips, etc) ──────────
function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-brand/30 bg-white px-5 py-4">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-1 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  )
}

// ─── Info block stack ───────────────────────────────────────────
function InfoStack({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

// ─── Pay / data table ───────────────────────────────────────────
function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 ${j === 0 ? 'font-medium text-slate-900' : j === 1 ? 'font-semibold text-emerald-700' : 'text-slate-600'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Firm link card (links to member hub) ───────────────────────
function FirmLink({ name, focus, slug }: { name: string; focus: string; slug: string }) {
  return (
    <a
      href={`https://members.nestedobjects.com/firms/${slug}`}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-brand/30 hover:shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{focus}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
    </a>
  )
}

// ─── Firm links grid ────────────────────────────────────────────
function FirmGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>
}

// ─── Internal CTA link ──────────────────────────────────────────
function CTALink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http')
  const Component = isExternal ? 'a' : Link
  const props = isExternal ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href }

  return (
    <Component
      {...(props as any)}
      className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
    >
      {children} <ArrowRight className="h-4 w-4" />
    </Component>
  )
}

// ─── Tip card ───────────────────────────────────────────────────
function TipCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-1 text-sm text-slate-600">{children}</div>
    </div>
  )
}

function TipStack({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>
}

// ─── Standard prose overrides for MDX ───────────────────────────
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-base leading-relaxed text-slate-700">{children}</p>
}

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 mb-4 scroll-mt-24 text-2xl font-bold text-slate-900 sm:text-3xl">
      {children}
    </h2>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 mb-2 text-lg font-semibold text-slate-900">{children}</h3>
}

// ─── Export all components for MDX ──────────────────────────────
export const guideMDXComponents = {
  // Prose
  p: P,
  h2: H2,
  h3: H3,
  // Custom
  SectionHeading,
  StepCard,
  Callout,
  RequirementCard,
  RequirementsGrid,
  InfoBlock,
  InfoStack,
  DataTable,
  FirmLink,
  FirmGrid,
  CTALink,
  TipCard,
  TipStack,
}
