'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type StateOption = {
  code: string
  label: string
}

type FilterBarProps = {
  keyword: string
  onKeywordChange: (value: string) => void
  serviceArea: string
  onServiceAreaChange: (value: string) => void
  city: string
  onCityChange: (value: string) => void
  addressState: string
  onAddressStateChange: (value: string) => void
  ratingThreshold: string
  onRatingThresholdChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  payMin: string
  payMax: string
  onPayMinChange: (value: string) => void
  onPayMaxChange: (value: string) => void
  isStarter: boolean
  categories: string[]
  stateOptions: StateOption[]
}

export function FilterBar({
  keyword,
  onKeywordChange,
  serviceArea,
  onServiceAreaChange,
  city,
  onCityChange,
  addressState,
  onAddressStateChange,
  ratingThreshold,
  onRatingThresholdChange,
  category,
  onCategoryChange,
  payMin,
  payMax,
  onPayMinChange,
  onPayMaxChange,
  isStarter,
  categories,
  stateOptions,
}: FilterBarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isAccordionOpen, setIsAccordionOpen] = useState(true)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches)
      if (event.matches) {
        setIsAccordionOpen(false)
      } else {
        setIsAccordionOpen(true)
      }
    }

    handleChange(mediaQuery)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const renderKeywordField = () => {
    if (!isStarter) {
      return (
        <input
          type="text"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="Try Safeguard, SoFi, mortgage, appraisal..."
          className="filter-input"
        />
      )
    }

    return (
      <div className="locked-input">
        <input
          type="text"
          disabled
          placeholder="Search/filter available on paid plans"
          className="filter-input locked"
        />
        <div className="locked-tooltip">
          🔒 Upgrade to Pro or higher to unlock search and advanced filtering.{' '}
          <Link href="/membership" className="locked-link">
            View plans
          </Link>
        </div>
      </div>
    )
  }

  const showFilters = !isMobile || isAccordionOpen

  return (
    <section className="filter-bar">
      <div className="filter-bar__header">
        <div>
          <p className="eyebrow">Filter</p>
          <h2 className="filter-title">Find the right match</h2>
        </div>
        <button
          className="toggle"
          onClick={() => setIsAccordionOpen((open) => !open)}
          aria-expanded={showFilters}
        >
          {showFilters ? 'Hide filters' : 'Show filters'}
        </button>
      </div>

      {showFilters && (
        <div className="filter-grid">
          <div className="filter-control">
            <label className="filter-label">Service area</label>
            <select
              value={serviceArea}
              onChange={(e) => onServiceAreaChange(e.target.value)}
              className="filter-input"
            >
              {stateOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="filter-hint">
              Many firms are national or multi-state. Start broad, then narrow down.
            </p>
          </div>

          <div className="filter-control">
            <label className="filter-label">Keyword</label>
            {renderKeywordField()}
          </div>

          <div className="filter-control">
            <label className="filter-label">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="e.g., Phoenix"
              className="filter-input"
            />
          </div>

          <div className="filter-control">
            <label className="filter-label">State</label>
            <select
              value={addressState}
              onChange={(e) => onAddressStateChange(e.target.value)}
              className="filter-input"
            >
              <option value="ALL">All states</option>
              {stateOptions
                .filter((option) => option.code !== 'ALL')
                .map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
            </select>
          </div>

          <div className="filter-control">
            <label className="filter-label">Minimum rating</label>
            <select
              value={ratingThreshold}
              onChange={(e) => onRatingThresholdChange(e.target.value)}
              className="filter-input"
            >
              <option value="">Any rating</option>
              <option value="3">3.0+</option>
              <option value="3.5">3.5+</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
            </select>
          </div>

          <div className="filter-control">
            <label className="filter-label">Category</label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="filter-input"
            >
              <option value="">All categories</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-control">
            <label className="filter-label">Pay range</label>
            <div className="pay-range">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={payMin}
                onChange={(e) => onPayMinChange(e.target.value)}
                placeholder="Min"
                className="filter-input"
              />
              <span className="pay-separator">to</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={payMax}
                onChange={(e) => onPayMaxChange(e.target.value)}
                placeholder="Max"
                className="filter-input"
              />
            </div>
            <p className="filter-hint">Uses posted pay_min/pay_max when available.</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .filter-bar {
          margin-bottom: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.25rem;
          background: linear-gradient(145deg, #f8fafc, #ffffff);
        }

        .filter-bar__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .eyebrow {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9ca3af;
          margin: 0 0 0.25rem 0;
        }

        .filter-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: #0f172a;
        }

        .toggle {
          appearance: none;
          border: 1px solid #cbd5e1;
          background: white;
          padding: 0.5rem 0.9rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          color: #1d4ed8;
          cursor: pointer;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem 1.25rem;
        }

        .filter-control {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .filter-label {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 0;
        }

        .filter-input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 0.9rem;
          background-color: white;
        }

        .filter-input.locked {
          border: 1px solid #fbbf24;
          background-color: #fef3c7;
          cursor: not-allowed;
          color: #92400e;
        }

        .locked-input {
          position: relative;
          width: 100%;
        }

        .locked-tooltip {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          background-color: #fffbeb;
          border: 1px solid #fbbf24;
          font-size: 0.75rem;
          color: #92400e;
          z-index: 10;
        }

        .locked-link {
          color: #ea580c;
          text-decoration: underline;
          font-weight: 600;
        }

        .filter-hint {
          margin: 0;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .pay-range {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0.5rem;
          align-items: center;
        }

        .pay-separator {
          font-weight: 600;
          color: #4b5563;
        }

        @media (max-width: 768px) {
          .toggle {
            width: 100%;
          }

          .filter-bar__header {
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  )
}

export default FilterBar
