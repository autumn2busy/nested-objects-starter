import type { IntelligenceReviewSummary } from '@/lib/intelligence-os-admin'
import {
  compareReviewItems,
  reviewText,
  selectOperatingReviews,
  type ReviewItemComparison,
} from '@/lib/intelligence-review-comparison'

export function OperatingReviewComparison({ reviews, selectedId, referenceId }: {
  reviews: IntelligenceReviewSummary[]
  selectedId?: string
  referenceId?: string
}) {
  const selection = selectOperatingReviews(reviews, selectedId, referenceId)
  const { selected, reference, unavailable } = selection

  return (
    <section id="review-comparison" aria-labelledby="review-comparison-title" className="mt-6 scroll-mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-800">Saved review comparison</p>
      <h2 id="review-comparison-title" className="mt-2 text-xl font-bold text-slate-950">What changed between reviews?</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Compare recorded priorities and decision prompts. Changes here do not prove an action was completed or a business result improved.
        This protected staging screen includes synthetic test reviews.
      </p>

      {selection.reviews.length > 0 ? (
        <form method="GET" action="/admin/intelligence-os#review-comparison" className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <ReviewSelect label="Reference review" name="referenceReview" reviews={selection.reviews} value={reference?.id} />
          <ReviewSelect label="Selected review" name="selectedReview" reviews={selection.reviews} value={selected?.id} />
          <button className="min-h-11 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Compare reviews</button>
        </form>
      ) : null}

      {unavailable ? <p role="status" className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{unavailable}</p> : null}
      {!unavailable && selected && reference ? (
        <>
          {selected.reviewDate === reference.reviewDate ? (
            <p className="mt-4 text-sm text-slate-600">Both reviews have the same date. Their order within that day is not established.</p>
          ) : null}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ReviewCard label="Reference" review={reference} />
            <ReviewCard label="Selected" review={selected} />
          </div>
          <ChangeList title="Priority changes" result={compareReviewItems(reference.priorities, selected.priorities, 'fingerprint')} />
          <ChangeList title="Decision prompt changes" result={compareReviewItems(reference.autumnDecisions, selected.autumnDecisions, 'id')} />
          <p className="mt-4 text-xs leading-5 text-slate-600">
            “Only in reference” means absent from the selected review, not resolved. Decision prompts are requests for review, not approval records.
            This comparison covers the loaded snapshot only.
          </p>
        </>
      ) : null}
    </section>
  )
}

function ReviewSelect({ label, name, reviews, value }: {
  label: string; name: string; reviews: IntelligenceReviewSummary[]; value?: string
}) {
  return (
    <label className="min-w-0 text-sm font-medium text-slate-700">
      {label}
      <select name={name} defaultValue={value ?? ''} required className="mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm">
        <option value="" disabled>Choose a review</option>
        {reviews.map(review => (
          <option key={review.id} value={review.id}>
            {review.reviewDate} · {review.workflowName.replaceAll('_', ' ')} · {review.status} · {review.id}
          </option>
        ))}
      </select>
    </label>
  )
}

function ReviewCard({ label, review }: { label: string; review: IntelligenceReviewSummary }) {
  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-950">{label} · {review.reviewDate}</h3>
      <p className="mt-1 text-xs text-slate-600">{review.workflowName.replaceAll('_', ' ')} · {review.status}</p>
      <p className="mt-3 break-words text-sm leading-6 text-slate-800">{reviewText(review.executiveSummary, 'No summary recorded.')}</p>
      <p className="mt-3 text-xs text-slate-600">{review.priorities.length} priorities · {review.autumnDecisions.length} decision prompts</p>
      <ItemList label="Priorities" items={review.priorities} />
      <ItemList label="Decision prompts" items={review.autumnDecisions} />
      <details className="mt-4 text-xs text-slate-600">
        <summary className="cursor-pointer font-medium">Review identifiers and recorded evidence</summary>
        <dl className="mt-2 space-y-2">
          <div><dt className="font-semibold">Review</dt><dd className="break-all font-mono">{review.id}</dd></div>
          <div><dt className="font-semibold">Correlation</dt><dd className="break-all font-mono">{review.correlationId}</dd></div>
        </dl>
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words">{JSON.stringify({ priorities: review.priorities, autumnDecisions: review.autumnDecisions }, null, 2)}</pre>
      </details>
    </article>
  )
}

function ItemList({ label, items }: { label: string; items: Array<Record<string, unknown>> }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
      {items.length === 0 ? <p className="mt-1 text-sm text-slate-600">None recorded.</p> : (
        <ul className="mt-2 space-y-3">
          {items.map((item, index) => (
            <li key={index} className="break-words text-sm leading-5">
              <p className="font-medium text-slate-900">{reviewText(item.title, 'Untitled item')}</p>
              <p className="mt-1 text-slate-600">{reviewText(item.summary, 'No summary recorded.')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ChangeList({ title, result }: { title: string; result: ReviewItemComparison }) {
  return (
    <div className="mt-5">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      {result.unavailable ? <p className="mt-2 text-sm text-amber-900">{result.unavailable}</p> : result.changes.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">Neither review contains items in this category.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {result.changes.map(change => (
            <li key={change.key} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-start">
              <span className="self-start whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{change.label}</span>
              <div className="min-w-0 break-words">
                <p className="font-medium text-slate-900">{reviewText((change.selected ?? change.reference)?.title, 'Untitled item')}</p>
                {change.label === 'Changed' ? (
                  <p className="mt-1 text-xs text-slate-600">Recorded content, ranking or evidence changed. Inspect both reviews above for details.</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
