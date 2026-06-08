'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Calculator, FileText, MapPinned, Printer, Route } from 'lucide-react'

type Inputs = {
  signingFee: number
  signingsPerWeek: number
  milesPerSigning: number
  printingCost: number
  scanbackMinutes: number
  driveMinutes: number
  adminMinutes: number
  mileageRate: number
  addOnFee: number
  addOnsPerWeek: number
  addOnMiles: number
  cancellationRate: number
}

const DEFAULT_INPUTS: Inputs = {
  signingFee: 125,
  signingsPerWeek: 4,
  milesPerSigning: 28,
  printingCost: 12,
  scanbackMinutes: 20,
  driveMinutes: 45,
  adminMinutes: 20,
  mileageRate: 0.67,
  addOnFee: 35,
  addOnsPerWeek: 2,
  addOnMiles: 8,
  cancellationRate: 10,
}

function cleanNumber(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}

function decimal(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.0'
}

function NumberField({
  label,
  value,
  min = 0,
  step = 1,
  prefix,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min?: number
  step?: number
  prefix?: string
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-600">{label}</span>
      <span className="mt-1 flex rounded-md border border-slate-300 bg-white">
        {prefix && <span className="flex items-center border-r border-slate-200 px-3 text-sm text-slate-500">{prefix}</span>}
        <input
          type="number"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-h-11 w-full rounded-md px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-copper"
        />
        {suffix && <span className="flex items-center border-l border-slate-200 px-3 text-sm text-slate-500">{suffix}</span>}
      </span>
    </label>
  )
}

export function NotaryRouteCalculator() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS)

  const results = useMemo(() => {
    const signings = cleanNumber(inputs.signingsPerWeek)
    const completedSignings = signings * Math.max(0, 1 - cleanNumber(inputs.cancellationRate) / 100)
    const addOns = cleanNumber(inputs.addOnsPerWeek)

    const signingGross = completedSignings * cleanNumber(inputs.signingFee)
    const addOnGross = addOns * cleanNumber(inputs.addOnFee)
    const gross = signingGross + addOnGross

    const signingMiles = completedSignings * cleanNumber(inputs.milesPerSigning)
    const addOnMiles = addOns * cleanNumber(inputs.addOnMiles)
    const totalMiles = signingMiles + addOnMiles
    const mileageCost = totalMiles * cleanNumber(inputs.mileageRate)
    const printCost = completedSignings * cleanNumber(inputs.printingCost)

    const signingHours =
      completedSignings *
      ((cleanNumber(inputs.driveMinutes) + cleanNumber(inputs.scanbackMinutes) + cleanNumber(inputs.adminMinutes)) / 60)
    const addOnHours = addOns * (25 / 60)
    const totalHours = signingHours + addOnHours
    const net = gross - mileageCost - printCost

    return {
      completedSignings,
      gross,
      totalMiles,
      mileageCost,
      printCost,
      totalHours,
      net,
      netPerHour: totalHours > 0 ? net / totalHours : 0,
      netPerMile: totalMiles > 0 ? net / totalMiles : 0,
      addOnShare: gross > 0 ? (addOnGross / gross) * 100 : 0,
    }
  }, [inputs])

  const updateInput = (key: keyof Inputs, value: number) => {
    setInputs((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-copper/10 text-brand-copper">
            <Calculator className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Route inputs</h2>
            <p className="text-sm text-slate-600">Estimate net weekly pay before accepting the route.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField label="Signing fee" prefix="$" value={inputs.signingFee} onChange={(value) => updateInput('signingFee', value)} />
          <NumberField label="Signings / week" value={inputs.signingsPerWeek} onChange={(value) => updateInput('signingsPerWeek', value)} />
          <NumberField label="Miles / signing" suffix="mi" value={inputs.milesPerSigning} onChange={(value) => updateInput('milesPerSigning', value)} />
          <NumberField label="Print cost / signing" prefix="$" value={inputs.printingCost} onChange={(value) => updateInput('printingCost', value)} />
          <NumberField label="Drive time" suffix="min" value={inputs.driveMinutes} onChange={(value) => updateInput('driveMinutes', value)} />
          <NumberField label="Scan-back time" suffix="min" value={inputs.scanbackMinutes} onChange={(value) => updateInput('scanbackMinutes', value)} />
          <NumberField label="Admin time" suffix="min" value={inputs.adminMinutes} onChange={(value) => updateInput('adminMinutes', value)} />
          <NumberField label="Mileage rate" prefix="$" step={0.01} value={inputs.mileageRate} onChange={(value) => updateInput('mileageRate', value)} />
          <NumberField label="Add-on fee" prefix="$" value={inputs.addOnFee} onChange={(value) => updateInput('addOnFee', value)} />
          <NumberField label="Add-ons / week" value={inputs.addOnsPerWeek} onChange={(value) => updateInput('addOnsPerWeek', value)} />
          <NumberField label="Add-on miles" suffix="mi" value={inputs.addOnMiles} onChange={(value) => updateInput('addOnMiles', value)} />
          <NumberField label="Cancellation risk" suffix="%" value={inputs.cancellationRate} onChange={(value) => updateInput('cancellationRate', value)} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <FileText className="h-4 w-4 text-brand-copper" />
              Weekly net
            </div>
            <p className="mt-2 text-3xl font-bold">{currency(results.net)}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Route className="h-4 w-4 text-brand-copper" />
              Net / hour
            </div>
            <p className="mt-2 text-3xl font-bold">{currency(results.netPerHour)}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPinned className="h-4 w-4 text-brand-copper" />
              Net / mile
            </div>
            <p className="mt-2 text-3xl font-bold">{currency(results.netPerMile)}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Printer className="h-4 w-4 text-brand-copper" />
              Route cost
            </div>
            <p className="mt-2 text-3xl font-bold">{currency(results.mileageCost + results.printCost)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <div className="flex items-center justify-between gap-4">
            <span>Completed signings</span>
            <strong>{decimal(results.completedSignings)}</strong>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Gross revenue</span>
            <strong>{currency(results.gross)}</strong>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Total route miles</span>
            <strong>{decimal(results.totalMiles)} mi</strong>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Total route hours</span>
            <strong>{decimal(results.totalHours)} hr</strong>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Add-on revenue share</span>
            <strong>{decimal(results.addOnShare, 0)}%</strong>
          </div>
        </div>

        <div className="mt-6 rounded-md bg-white p-4 text-slate-900">
          <p className="text-sm font-semibold">Next best action</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            If net per hour is weak, reduce radius, batch signings, raise your minimum fee, or add only nearby inspection/photo
            tasks that do not create a second trip.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/hiring-firms?industry=Notary"
              className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
            >
              Compare notary firms
            </Link>
            <Link
              href="/membership-pricing"
              className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 sm:w-auto"
            >
              Unlock firm intel
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
