import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Firm } from '../lib/hiring-firms'

type FirmCardProps = {
  firm: Firm
  address?: string
  categories?: string
  isActive?: boolean
  onHover?: () => void
  onLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
}

const goldStars = Array.from({ length: 5 })

export function FirmCard({
  firm,
  address,
  categories,
  isActive = false,
  onHover,
  onLeave,
  onFocus,
  onBlur,
}: FirmCardProps) {
  const profileHref = `/firms/${firm.slug ?? firm.id}`
  const initials = firm.name?.slice(0, 1).toUpperCase() ?? '?' 
  const categoryLabel = categories || firm.industry_focus || 'Field services'

  return (
    <Card
      tabIndex={0}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`group relative overflow-hidden bg-gradient-to-br from-white via-white to-slate-50 transition duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:ring-2 hover:ring-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isActive ? 'ring-2 ring-teal-300 ring-offset-2 ring-offset-white' : ''}`}
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-300 via-orange-200 to-teal-300" aria-hidden />

      <CardHeader className="grid grid-cols-[auto,1fr] items-start gap-4 px-5 pt-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-br from-amber-100 to-teal-100 text-lg font-semibold text-slate-800 shadow-inner ring-1 ring-slate-200">
          {initials}
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Verified firm
              </p>
              <h3 className="text-lg font-bold text-slate-900">{firm.name}</h3>
              {categoryLabel && (
                <p className="text-sm font-semibold text-teal-700">{categoryLabel}</p>
              )}
            </div>

            {firm.url && (
              <a
                href={firm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-none bg-slate-100 px-3 py-1 text-xs font-semibold text-teal-700 underline-offset-4 ring-1 ring-slate-200 transition hover:bg-white hover:text-teal-800 hover:underline"
              >
                Visit website ↗
              </a>
            )}
          </div>

          <div className="flex items-center gap-2" aria-label="5 star rating">
            <div className="flex text-amber-400">
              {goldStars.map((_, index) => (
                <span key={index} className="text-base leading-none">★</span>
              ))}
            </div>
            <span className="text-xs font-semibold text-amber-600">5.0</span>
          </div>

          {firm.geographic_coverage && (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Coverage:</span> {firm.geographic_coverage}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-5 pb-2">
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          <span className="rounded-sm bg-amber-50 px-2 py-1 text-amber-700 ring-1 ring-amber-100">
            {firm.industry_focus ? 'Specialty' : 'Category'}
          </span>
          {firm.pay_type && (
            <span className="rounded-sm bg-teal-50 px-2 py-1 text-teal-700 ring-1 ring-teal-100">
              {firm.pay_type}
            </span>
          )}
          {firm.company_size && (
            <span className="rounded-sm bg-slate-100 px-2 py-1 text-slate-700 ring-1 ring-slate-200">
              {firm.company_size}
            </span>
          )}
        </div>

        {firm.pay_min != null && (
          <p className="text-sm font-semibold text-emerald-700">
            ${firm.pay_min}
            {firm.pay_max != null && ` - $${firm.pay_max}`}
            {firm.pay_type && ` ${firm.pay_type}`}
          </p>
        )}

        <div className="rounded-md border border-slate-200 bg-white/80 p-3 shadow-inner">
          <p className="text-sm text-slate-700">
            {address || 'Regional or national coverage'}
          </p>
          {firm.company_size && (
            <p className="text-xs text-slate-500">Team size: {firm.company_size}</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-4 px-5 pb-5 pt-2">
        <div className="space-y-1 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">{categoryLabel}</p>
          {firm.url && (
            <a
              href={firm.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-teal-700 underline-offset-4 hover:underline"
            >
              {firm.url}
            </a>
          )}
        </div>

        <Link
          href={profileHref}
          className="inline-flex items-center justify-center rounded-none bg-gradient-to-r from-amber-300 via-amber-200 to-teal-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md transition hover:scale-[1.03] hover:shadow-lg hover:ring-2 hover:ring-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          View Profile
        </Link>
      </CardFooter>
    </Card>
  )
}
