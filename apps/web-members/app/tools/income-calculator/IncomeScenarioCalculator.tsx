'use client'

import { useMemo, useState } from 'react'
import { Calculator, Car, Clock3, DollarSign, FileText } from 'lucide-react'

import {
  canCompleteIncomeScenario,
  calculateIncomeScenario,
  type IncomeScenarioInputs,
} from './calculations'
import { recordIncomeScenarioCompletion } from './completion-event'

const EMPTY_SCENARIO: IncomeScenarioInputs = {
  assignmentsPerMonth: 0,
  averageFeePerAssignment: 0,
  averageMilesPerAssignment: 0,
  vehicleCostPerMile: 0,
  minutesPerAssignment: 0,
  otherMonthlyCosts: 0,
}

function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

function decimal(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.0'
}

function NumberField({
  label,
  help,
  value,
  prefix,
  suffix,
  step = 1,
  onChange,
}: {
  label: string
  help: string
  value: number
  prefix?: string
  suffix?: string
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <span className="mt-2 flex min-h-11 rounded-lg border border-slate-300 bg-white focus-within:border-brand-copper focus-within:ring-2 focus-within:ring-brand-copper/20">
        {prefix && <span className="flex items-center border-r border-slate-200 px-3 text-sm text-slate-500">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full rounded-lg px-3 py-2 text-sm text-slate-950 outline-none"
        />
        {suffix && <span className="flex items-center border-l border-slate-200 px-3 text-sm text-slate-500">{suffix}</span>}
      </span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{help}</span>
    </label>
  )
}

export function IncomeScenarioCalculator() {
  const [inputs, setInputs] = useState<IncomeScenarioInputs>(EMPTY_SCENARIO)
  const [completionStatus, setCompletionStatus] = useState<'idle' | 'submitting' | 'complete' | 'error'>('idle')
  const results = useMemo(() => calculateIncomeScenario(inputs), [inputs])
  const canComplete = useMemo(() => canCompleteIncomeScenario(inputs), [inputs])

  const update = (key: keyof IncomeScenarioInputs, value: number) => {
    setInputs((current) => ({ ...current, [key]: Number.isFinite(value) && value >= 0 ? value : 0 }))
    if (completionStatus === 'error') setCompletionStatus('idle')
  }

  const completeCalculation = async () => {
    if (!canComplete || completionStatus === 'submitting' || completionStatus === 'complete') return

    setCompletionStatus('submitting')
    const recorded = await recordIncomeScenarioCompletion()
    setCompletionStatus(recorded ? 'complete' : 'error')
  }

  const completionMessage = completionStatus === 'submitting'
    ? 'Recording completion…'
    : completionStatus === 'complete'
      ? 'Completion recorded. Your calculation numbers were not submitted.'
      : completionStatus === 'error'
        ? 'Completion was not recorded. Try again when you are ready.'
        : canComplete
          ? 'Ready to record this calculation as complete.'
          : 'Enter assignments, average fee, and total minutes above zero to complete this scenario.'

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-copper/10 text-brand-copper">
            <Calculator className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-950">Your monthly assumptions</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Every calculation starts at zero. Enter only numbers that fit the work you are evaluating.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <NumberField
            label="Completed assignments per month"
            help="Use the volume you reasonably expect to finish, not the number offered."
            value={inputs.assignmentsPerMonth}
            onChange={(value) => update('assignmentsPerMonth', value)}
          />
          <NumberField
            label="Average fee per assignment"
            help="Use your own expected average before costs and taxes."
            prefix="$"
            step={0.01}
            value={inputs.averageFeePerAssignment}
            onChange={(value) => update('averageFeePerAssignment', value)}
          />
          <NumberField
            label="Average vehicle miles per assignment"
            help="Include the round-trip or route-share miles you expect to drive."
            suffix="mi"
            step={0.1}
            value={inputs.averageMilesPerAssignment}
            onChange={(value) => update('averageMilesPerAssignment', value)}
          />
          <NumberField
            label="Your vehicle operating cost per mile"
            help="Enter your own fuel, maintenance, and depreciation estimate. This is not an IRS reimbursement rate."
            prefix="$"
            step={0.01}
            value={inputs.vehicleCostPerMile}
            onChange={(value) => update('vehicleCostPerMile', value)}
          />
          <NumberField
            label="Total minutes per assignment"
            help="Include driving, on-site work, upload time, and unpaid administration."
            suffix="min"
            value={inputs.minutesPerAssignment}
            onChange={(value) => update('minutesPerAssignment', value)}
          />
          <NumberField
            label="Other monthly business costs"
            help="Include supplies, software, insurance, phone allocation, or other costs you choose."
            prefix="$"
            step={0.01}
            value={inputs.otherMonthlyCosts}
            onChange={(value) => update('otherMonthlyCosts', value)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Estimated scenario</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ResultCard icon={DollarSign} label="Gross revenue" value={currency(results.grossRevenue)} />
          <ResultCard icon={FileText} label="Net before taxes" value={currency(results.estimatedNet)} />
          <ResultCard icon={Clock3} label="Net per hour" value={currency(results.netPerHour)} />
          <ResultCard icon={Car} label="Estimated vehicle cost" value={currency(results.vehicleCosts)} />
        </div>

        <dl className="mt-6 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <ResultRow label="Estimated route miles" value={`${decimal(results.routeMiles)} mi`} />
          <ResultRow label="Estimated working time" value={`${decimal(results.workingHours)} hr`} />
          <ResultRow label="Total entered costs" value={currency(results.totalCosts)} />
          <ResultRow label="Net per assignment" value={currency(results.netPerAssignment)} />
        </dl>

        <div className="mt-6 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-4">
          <p className="text-sm font-bold text-emerald-50">Finished reviewing this scenario?</p>
          <p className="mt-1 text-sm leading-6 text-emerald-50/90">
            Record the completion milestone when the assignments, average fee, and time assumptions reflect a scenario you reviewed.
          </p>
          <button
            type="button"
            onClick={completeCalculation}
            disabled={!canComplete || completionStatus === 'submitting' || completionStatus === 'complete'}
            aria-describedby="income-scenario-completion-status"
            className="mt-4 min-h-11 rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {completionStatus === 'submitting'
              ? 'Recording…'
              : completionStatus === 'complete'
                ? 'Calculation completed'
                : completionStatus === 'error'
                  ? 'Try again'
                  : 'Complete calculation'}
          </button>
          <p
            id="income-scenario-completion-status"
            role="status"
            aria-live="polite"
            className="mt-3 text-xs leading-5 text-emerald-50/90"
          >
            {completionMessage}
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
          This is a planning estimate, not an earnings promise. It does not add taxes, cancellations, unpaid travel, or
          costs you did not enter. Your numeric assumptions and calculated results stay in this browser. If you select
          Complete calculation, Nested Objects records a completion milestone for your member account without those
          numbers or results. Normal site analytics may record the page visit.
        </div>
      </section>
    </div>
  )
}

function ResultCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Icon className="h-4 w-4 text-brand-copper" aria-hidden />
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt>{label}</dt>
      <dd className="font-bold text-white">{value}</dd>
    </div>
  )
}
