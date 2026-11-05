import { AlertTriangle, ExternalLink } from 'lucide-react'

import {
  formatFirmReputationReviewDate,
  normalizeFirmReputationSources,
  type FirmReputationFields,
} from '@/lib/firm-reputation'

type FirmReputationNoticeProps = FirmReputationFields & {
  compact?: boolean
  showSources?: boolean
}

export function FirmReputationNotice({
  recommendation_status: recommendationStatus,
  reputation_notice: reputationNotice,
  reputation_sources: reputationSources,
  reputation_reviewed_at: reputationReviewedAt,
  compact = false,
  showSources = true,
}: FirmReputationNoticeProps) {
  if (!recommendationStatus || recommendationStatus === 'recommended') return null

  const sources = normalizeFirmReputationSources(reputationSources)
  const isSuppressed = recommendationStatus === 'suppressed'
  const reviewedDate = formatFirmReputationReviewDate(reputationReviewedAt)

  return (
    <section
      aria-label="Firm reputation notice"
      className={`${compact ? 'mt-3 p-3' : 'mt-5 p-4 sm:p-5'} rounded-lg border ${
        isSuppressed
          ? 'border-red-300 bg-red-50 text-red-950'
          : 'border-amber-300 bg-amber-50 text-amber-950'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-bold">
            {isSuppressed ? 'Recommendation paused' : 'Firm under review'}
          </p>
          <p className={`${compact ? 'mt-1 text-xs leading-5' : 'mt-2 text-sm leading-6'}`}>
            {reputationNotice || 'Nested Objects is reviewing reputation information for this firm.'}
          </p>
          <p className={`${compact ? 'mt-1 text-[11px] leading-4' : 'mt-2 text-xs leading-5'} font-medium`}>
            Third-party claims are attributed below and have not been independently verified by Nested Objects.
          </p>
          {!compact && reviewedDate && (
            <p className="mt-1 text-xs opacity-80">Status reviewed {reviewedDate}.</p>
          )}
        </div>
      </div>

      {showSources && sources.length > 0 && (
        <ul className={`${compact ? 'mt-2' : 'mt-4'} space-y-2 border-t border-current/20 pt-3`}>
          {sources.map((source) => (
            <li key={source.url} className="text-xs leading-5">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-start gap-1 font-semibold underline underline-offset-2 hover:no-underline"
              >
                <span>{source.publisher}: {source.title}</span>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              </a>
              {source.published_at && <span className="ml-1 opacity-80">({source.published_at})</span>}
              {source.summary && <p className="mt-1 opacity-90">{source.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
