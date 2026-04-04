import type { Metadata } from 'next'
import { MapPin, Briefcase, DollarSign, FileText, Clock, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Post a Job',
  description: 'Create an inspection job posting and get matched with vetted field inspectors in your area within minutes.',
}

const inspectionTypes = [
  'Property Condition Report',
  'Occupancy Verification',
  'Insurance Inspection',
  'Loss Draft Inspection',
  'Property Preservation',
  'Roof / Exterior Inspection',
  'Commercial Appraisal',
  'REO / Foreclosure',
  'Construction Draw',
  'Custom / Other',
]

export default function PostAJobPage() {
  return (
    <main className="bg-brand-sand min-h-screen">
      {/* ── Page Header ── */}
      <div className="hero-gradient px-4 pb-12 pt-16 sm:px-6">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Post a Job</h1>
          <p className="mt-3 text-base text-indigo-200/80">
            Describe the inspection you need and we&apos;ll match you with the best inspectors in the area.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Form ── */}
          <div className="lg:col-span-2">
            <form className="b2b-card space-y-6 px-7 py-8">
              {/* Inspection Type */}
              <div>
                <label htmlFor="inspection-type" className="block text-sm font-semibold text-slate-900">
                  Inspection Type
                </label>
                <select
                  id="inspection-type"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">Select inspection type…</option>
                  {inspectionTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="job-location" className="block text-sm font-semibold text-slate-900">
                  Job Location
                </label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="job-location"
                    type="text"
                    placeholder="e.g., 1234 Main St, Atlanta, GA 30301"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              {/* Pay & Timeline Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pay-rate" className="block text-sm font-semibold text-slate-900">
                    Pay Rate
                  </label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="pay-rate"
                      type="text"
                      placeholder="e.g., $75"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="due-date" className="block text-sm font-semibold text-slate-900">
                    Due Date
                  </label>
                  <div className="relative mt-2">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="due-date"
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="job-description" className="block text-sm font-semibold text-slate-900">
                  Job Description &amp; Requirements
                </label>
                <textarea
                  id="job-description"
                  rows={5}
                  placeholder="Include any specific requirements, access instructions, deliverables, photo count, etc."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              {/* Contact */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firm-name" className="block text-sm font-semibold text-slate-900">
                    Firm Name
                  </label>
                  <input
                    id="firm-name"
                    type="text"
                    placeholder="Your company name"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label htmlFor="firm-email" className="block text-sm font-semibold text-slate-900">
                    Contact Email
                  </label>
                  <input
                    id="firm-email"
                    type="email"
                    placeholder="you@company.com"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-shimmer w-full rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark"
              >
                Submit Job Posting
              </button>
              <p className="text-center text-xs text-slate-400">
                Your first posting is free. No credit card required.
              </p>
            </form>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            <div className="b2b-card px-6 py-6">
              <h3 className="text-sm font-bold text-slate-900">What Happens Next</h3>
              <ul className="mt-4 space-y-4">
                {[
                  { step: '1', text: 'We review your posting and publish it to our inspector network.' },
                  { step: '2', text: 'Qualified inspectors in the area receive notifications and apply.' },
                  { step: '3', text: 'You review matched inspectors and assign the job.' },
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                      {item.step}
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="b2b-card px-6 py-6">
              <h3 className="text-sm font-bold text-slate-900">Included in Every Posting</h3>
              <ul className="mt-4 space-y-3">
                {[
                  'Background-checked inspectors',
                  'Insurance & E&O verification',
                  'Full photo documentation',
                  'Compliance reporting',
                  'Dedicated support',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
