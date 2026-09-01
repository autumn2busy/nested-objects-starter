import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  fetchIntelligenceAdminSnapshot,
  getIntelligenceOwnerSession,
  intelligenceAdminErrorMessage,
  issueIntelligenceAdminFormToken,
  type IntelligenceAdminSnapshot,
} from '@/lib/intelligence-os-admin'

import { startSyntheticWorkflow, submitIntelligenceActionDecision } from './actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

const EVENT_TYPES = [
  'member_created',
  'trial_started',
  'upgrade',
  'downgrade',
  'cancellation',
  'payment_failure',
  'paywall_hit',
  'training_completion',
  'firm_inquiry',
  'opportunity_ingestion',
  'critical_integration_failure',
] as const

export default async function IntelligenceOsPage({ searchParams = {} }: PageProps) {
  const session = await getIntelligenceOwnerSession()
  if (!session) redirect('/profile')

  let snapshot: IntelligenceAdminSnapshot | null = null
  let formToken: string | null = null
  let setupError: string | null = null
  try {
    formToken = issueIntelligenceAdminFormToken('trigger', session.subject)
    snapshot = await fetchIntelligenceAdminSnapshot(session)
  } catch (error) {
    setupError = intelligenceAdminErrorMessage(error)
  }

  const notice = messageParam(searchParams.notice)
  const actionError = messageParam(searchParams.error)
  const dateKey = new Date().toISOString().slice(0, 10)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-copper">
            Protected staging control plane
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Intelligence OS</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review durable signals, evidence, experiments, and exact proposed payloads. Approval records a decision only;
            execution and delegated approval remain disabled.
          </p>
        </div>
        <Link href="/admin/conversion-funnel" className="text-sm font-semibold text-brand-copper hover:text-brand-copperDark">
          Conversion funnel
        </Link>
      </div>

      {notice ? <StatusBanner tone="success" message={notice} /> : null}
      {actionError ? <StatusBanner tone="error" message={actionError} /> : null}
      {setupError ? (
        <section className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <h2 className="font-semibold">Protected staging is not active</h2>
          <p className="mt-1 text-sm">{setupError}</p>
          <p className="mt-2 text-xs">
            No Production control is available. Staging requires reviewed runtime binding, an exact Outseta subject,
            and an active owner registry row.
          </p>
        </section>
      ) : null}

      {snapshot && formToken ? (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Control-plane status">
            <Stat label="Recent runs" value={snapshot.runs.length} />
            <Stat label="Unresolved signals" value={snapshot.unresolvedSignals.length} />
            <Stat label="Awaiting Autumn" value={snapshot.awaitingActions.length} />
            <Stat label="Source warnings" value={snapshot.sourceWarnings.length} />
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Start a bounded synthetic run</h2>
                <p className="mt-1 text-sm text-slate-600">
                  These controls reuse the shared durable workflows and accept fixture evidence only. They do not configure schedules.
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">No live customer input</p>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <WorkflowTriggerForm
                title="Conversion review"
                description="Run the shared conversion decision path."
                formToken={formToken}
                triggerCategory="manual"
                workflowName="conversion_review"
                businessKey={`synthetic-conversion:${dateKey}`}
              />
              <WorkflowTriggerForm
                title="Daily health"
                description="Run one quiet health review."
                formToken={formToken}
                triggerCategory="daily"
                workflowName="daily_business_health"
                businessKey={`synthetic-daily:${dateKey}`}
              />
              <WorkflowTriggerForm
                title="Weekly review"
                description="Run one unified weekly operating review."
                formToken={formToken}
                triggerCategory="weekly"
                workflowName="weekly_operating_review"
                businessKey={`synthetic-weekly:${dateKey}`}
              />
            </div>
            <form action={startSyntheticWorkflow} className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <input type="hidden" name="formToken" value={formToken} />
              <input type="hidden" name="triggerCategory" value="event" />
              <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
                <label className="text-sm font-medium text-slate-700">
                  Synthetic event
                  <select name="eventType" className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3">
                    {EVENT_TYPES.map((eventType) => (
                      <option key={eventType} value={eventType}>{humanize(eventType)}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Source event key
                  <input
                    name="sourceEventId"
                    defaultValue={`synthetic-event:${dateKey}:001`}
                    pattern="(synthetic|validation)-[a-z0-9:._-]{8,240}"
                    className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs"
                    required
                  />
                </label>
                <div>
                  <input type="hidden" name="businessKey" value={`synthetic-event-review:${dateKey}:001`} />
                  <button className="min-h-11 w-full rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700">
                    Queue event review
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Top three priorities</h2>
            {snapshot.topPriorities.length === 0 ? <Empty label="No ranked priorities are available." /> : (
              <ol className="mt-4 grid gap-3 lg:grid-cols-3">
                {snapshot.topPriorities.slice(0, 3).map((priority, index) => (
                  <li key={`${index}-${compactJson(priority)}`} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Priority {index + 1}</p>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">{prettyJson(priority)}</pre>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Awaiting Autumn</h2>
            <p className="mt-1 text-sm text-slate-600">
              Each decision is bound to the exact payload digest and version shown here. Approve and reject both write durable audit events.
            </p>
            {snapshot.awaitingActions.length === 0 ? <Empty label="No proposed actions await a decision." /> : (
              <div className="mt-4 space-y-4">
                {snapshot.awaitingActions.map((action) => (
                  <article key={action.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">{humanize(action.actionType)}</p>
                        <p className="mt-1 text-sm text-slate-600">{action.conciseRationale}</p>
                      </div>
                      <span className="self-start rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                        {action.riskLevel} risk · v{action.decisionVersion}
                      </span>
                    </div>
                    <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <div><dt className="font-semibold text-slate-800">Target</dt><dd>{action.targetSystem}</dd></div>
                      <div><dt className="font-semibold text-slate-800">Correlation</dt><dd className="break-all font-mono">{action.correlationId}</dd></div>
                      <div className="sm:col-span-2"><dt className="font-semibold text-slate-800">Payload SHA-256</dt><dd className="break-all font-mono">{action.payloadDigest}</dd></div>
                    </dl>
                    <details className="mt-3 rounded-lg bg-slate-950 p-3 text-slate-100">
                      <summary className="cursor-pointer text-xs font-semibold">Exact proposed payload</summary>
                      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5">{prettyJson(action.payload)}</pre>
                    </details>
                    <details className="mt-3 rounded-lg bg-slate-50 p-3 text-slate-700">
                      <summary className="cursor-pointer text-xs font-semibold">Decision evidence and provenance</summary>
                      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5">{prettyJson({ evidence: action.evidence, sourceRefs: action.sourceRefs })}</pre>
                    </details>
                    <form action={submitIntelligenceActionDecision} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                      <input type="hidden" name="formToken" value={issueIntelligenceAdminFormToken(`action:${action.id}`, session.subject)} />
                      <input type="hidden" name="actionId" value={action.id} />
                      <input type="hidden" name="expectedVersion" value={action.decisionVersion} />
                      <input type="hidden" name="expectedPayloadDigest" value={action.payloadDigest} />
                      <label className="text-sm font-medium text-slate-700">
                        Decision rationale
                        <input
                          name="reason"
                          minLength={3}
                          maxLength={1000}
                          className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3"
                          required
                        />
                      </label>
                      <button name="decision" value="rejected" className="min-h-11 rounded-lg border border-rose-300 px-4 text-sm font-semibold text-rose-800 hover:bg-rose-50">
                        Reject
                      </button>
                      <button name="decision" value="approved" className="min-h-11 rounded-lg bg-brand-copper px-4 text-sm font-semibold text-white hover:bg-brand-copperDark">
                        Approve record only
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">Run status</h2>
              {snapshot.runs.length === 0 ? <Empty label="No durable runs are available." /> : (
                <ul className="mt-4 space-y-3">
                  {snapshot.runs.slice(0, 12).map((run) => (
                    <li key={run.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                      <div className="flex justify-between gap-3"><strong>{humanize(run.workflowName)}</strong><span>{run.status}</span></div>
                      <p className="mt-1 text-xs text-slate-600">Verification: {run.verificationStatus} · {formatDate(run.createdAt)}</p>
                      {run.conciseRationale ? <p className="mt-2 text-xs text-slate-700">{run.conciseRationale}</p> : null}
                      <p className="mt-2 break-all font-mono text-[11px] text-slate-500">{run.correlationId}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">Source and data warnings</h2>
              {snapshot.sourceWarnings.length === 0 ? <Empty label="No unhealthy source observations are recorded." /> : (
                <ul className="mt-4 space-y-3">
                  {snapshot.sourceWarnings.map((warning) => (
                    <li key={`${warning.sensorName}-${warning.correlationId}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                      <div className="flex justify-between gap-3"><strong>{warning.sensorName}</strong><span>{warning.healthStatus}</span></div>
                      <p className="mt-1 text-xs">Provenance: {warning.provenanceMode} · observed {formatDate(warning.lastObservedAt)}</p>
                      <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold">Source health evidence</summary><pre className="mt-2 whitespace-pre-wrap break-words text-xs">{prettyJson(warning.sourceHealth)}</pre></details>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Unresolved and high-priority signals</h2>
            {snapshot.unresolvedSignals.length === 0 ? <Empty label="No unresolved signals are available." /> : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {snapshot.unresolvedSignals.map((signal) => (
                  <article key={signal.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex justify-between gap-3"><h3 className="font-semibold text-slate-950">{signal.title}</h3><span className="text-xs font-semibold">P{signal.priority} · {signal.severity}</span></div>
                    <p className="mt-2 text-sm text-slate-700">{signal.summary}</p>
                    <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-brand-copper">Evidence and provenance</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs">{prettyJson({ evidence: signal.evidence, sourceRefs: signal.sourceRefs })}</pre></details>
                    <p className="mt-2 break-all font-mono text-[11px] text-slate-500">{signal.correlationId}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Experiment readiness</h2>
            {snapshot.experiments.length === 0 ? <Empty label="No experiments are registered." /> : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Experiment</th><th className="px-3 py-2">Sample</th><th className="px-3 py-2">Duration</th><th className="px-3 py-2">Analysis</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {snapshot.experiments.map((experiment) => (
                      <tr key={experiment.id}>
                        <td className="px-3 py-3"><strong>{experiment.name}</strong><p className="text-xs text-slate-500">{experiment.primaryMetric}</p></td>
                        <td className="px-3 py-3">{experiment.observedSampleSize}/{experiment.minimumSampleSize} · {experiment.sampleReady ? 'ready' : 'insufficient'}</td>
                        <td className="px-3 py-3">{experiment.observedDurationDays}/{experiment.minimumDurationDays} days · {experiment.durationReady ? 'ready' : 'insufficient'}</td>
                        <td className="px-3 py-3">{experiment.analysisState}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Operating reviews</h2>
            {snapshot.reviews.length === 0 ? <Empty label="No operating review artifact is available." /> : (
              <div className="mt-4 space-y-3">
                {snapshot.reviews.slice(0, 8).map((review) => (
                  <details key={review.id} className="rounded-lg border border-slate-200 p-4">
                    <summary className="cursor-pointer font-semibold text-slate-950">{humanize(review.workflowName)} · {review.reviewDate} · {review.status}</summary>
                    <p className="mt-2 text-sm text-slate-700">{review.executiveSummary}</p>
                    <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs">{prettyJson({ priorities: review.priorities, autumnDecisions: review.autumnDecisions, correlationId: review.correlationId })}</pre>
                  </details>
                ))}
              </div>
            )}
          </section>

          <p className="mt-5 text-xs leading-5 text-slate-500">
            Snapshot generated {formatDate(snapshot.generatedAt)}. Browser requests never receive the runtime signing secret.
            All mutations require same-origin Server Actions, a short-lived signed form token, a fresh one-use service nonce,
            stable-subject owner authorization, and database compare-and-set checks.
          </p>
        </>
      ) : null}
    </main>
  )
}

function WorkflowTriggerForm(props: {
  title: string
  description: string
  formToken: string
  triggerCategory: 'manual' | 'daily' | 'weekly'
  workflowName: 'conversion_review' | 'daily_business_health' | 'weekly_operating_review'
  businessKey: string
}) {
  return (
    <form action={startSyntheticWorkflow} className="rounded-lg border border-slate-200 p-4">
      <input type="hidden" name="formToken" value={props.formToken} />
      <input type="hidden" name="triggerCategory" value={props.triggerCategory} />
      <input type="hidden" name="workflowName" value={props.workflowName} />
      <input type="hidden" name="businessKey" value={props.businessKey} />
      <h3 className="font-semibold text-slate-950">{props.title}</h3>
      <p className="mt-1 min-h-10 text-sm text-slate-600">{props.description}</p>
      <button className="mt-3 min-h-11 w-full rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700">
        Queue synthetic run
      </button>
    </form>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-950">{value}</p></div>
}

function Empty({ label }: { label: string }) {
  return <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{label}</p>
}

function StatusBanner({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  return <p className={tone === 'success' ? 'mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900' : 'mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900'}>{message}</p>
}

function messageParam(value: string | string[] | undefined): string | null {
  const first = Array.isArray(value) ? value[0] : value
  return first?.slice(0, 240) || null
}

function humanize(value: string): string {
  return value.replaceAll(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toLocaleString('en-US') : 'unknown time'
}

function prettyJson(value: unknown): string {
  return (JSON.stringify(value, null, 2) ?? 'null').slice(0, 20_000)
}

function compactJson(value: unknown): string {
  return (JSON.stringify(value) ?? 'null').slice(0, 120)
}
