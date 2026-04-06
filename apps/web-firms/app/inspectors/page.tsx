import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Shield, Clock, Filter, Search, ArrowRight, CheckCircle, Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Browse Inspectors',
  description: 'Search and filter 2,400+ vetted field inspectors, notaries, and property preservation contractors across all 50 states.',
}

const inspectors = [
  {
    id: 'insp-001',
    name: 'Marcus Davis',
    location: 'Atlanta, GA',
    specialties: ['Property Condition', 'Occupancy Verification', 'REO'],
    rating: 4.9,
    reviews: 127,
    turnaround: '< 24hr',
    completionRate: '99%',
    verified: true,
    yearsExp: 8,
  },
  {
    id: 'insp-002',
    name: 'Sarah Kim',
    location: 'Houston, TX',
    specialties: ['Loss Draft', 'Insurance Inspection', 'Roof/Exterior'],
    rating: 4.8,
    reviews: 93,
    turnaround: '< 24hr',
    completionRate: '98%',
    verified: true,
    yearsExp: 5,
  },
  {
    id: 'insp-003',
    name: 'James Lewis',
    location: 'Phoenix, AZ',
    specialties: ['Property Preservation', 'Occupancy Verification'],
    rating: 4.7,
    reviews: 68,
    turnaround: '< 48hr',
    completionRate: '97%',
    verified: true,
    yearsExp: 4,
  },
  {
    id: 'insp-004',
    name: 'Priya Mehta',
    location: 'Denver, CO',
    specialties: ['Commercial Appraisal', 'Construction Draw'],
    rating: 5.0,
    reviews: 42,
    turnaround: '< 24hr',
    completionRate: '100%',
    verified: true,
    yearsExp: 6,
  },
  {
    id: 'insp-005',
    name: 'Tony Rodriguez',
    location: 'Miami, FL',
    specialties: ['Property Condition', 'Insurance Inspection', 'Property Preservation'],
    rating: 4.6,
    reviews: 155,
    turnaround: '< 24hr',
    completionRate: '96%',
    verified: true,
    yearsExp: 10,
  },
  {
    id: 'insp-006',
    name: 'Angela Brooks',
    location: 'Chicago, IL',
    specialties: ['Occupancy Verification', 'REO', 'Loss Draft'],
    rating: 4.8,
    reviews: 81,
    turnaround: '< 24hr',
    completionRate: '99%',
    verified: true,
    yearsExp: 7,
  },
]

const filterCategories = [
  {
    title: 'Inspection Type',
    options: ['Property Condition', 'Occupancy Verification', 'Insurance', 'Loss Draft', 'Property Preservation', 'REO', 'Commercial'],
  },
  {
    title: 'Region',
    options: ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast', 'Mountain'],
  },
  {
    title: 'Availability',
    options: ['Available Now', 'Within 24hr', 'Within 48hr', 'This Week'],
  },
]

export default function InspectorsPage() {
  return (
    <main className="bg-brand-sand min-h-screen">
      {/* ── Page Header ── */}
      <div className="hero-gradient px-4 pb-12 pt-16 sm:px-6">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Browse Inspectors</h1>
          <p className="mt-3 text-base text-indigo-200/80">
            Search our network of 2,400+ vetted field inspectors. Filter by specialty, location, and availability.
          </p>
          {/* ── Search Bar ── */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="inspector-search"
                type="text"
                placeholder="Search by name, city, or specialty…"
                className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-5 text-sm text-slate-700 shadow-lg transition focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* ── Sidebar Filters ── */}
          <aside className="lg:col-span-1">
            <div className="b2b-card sticky top-24 px-6 py-6">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Filter className="h-4 w-4" />
                Filters
              </div>
              {filterCategories.map((category) => (
                <div key={category.title} className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{category.title}</p>
                  <ul className="mt-3 space-y-2">
                    {category.options.map((option) => (
                      <li key={option}>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-slate-300 text-brand transition focus:ring-brand/30"
                          />
                          {option}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Inspector Cards ── */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-900">{inspectors.length}</span> inspectors
              </p>
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:border-brand focus:outline-none">
                <option>Sort: Highest Rated</option>
                <option>Sort: Most Reviews</option>
                <option>Sort: Fastest Turnaround</option>
                <option>Sort: Most Experienced</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {inspectors.map((inspector) => (
                <div key={inspector.id} className="b2b-card px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{inspector.name}</h3>
                        {inspector.verified && (
                          <CheckCircle className="h-4 w-4 text-brand" />
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {inspector.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-700">{inspector.rating}</span>
                      <span className="text-[10px] text-amber-500">({inspector.reviews})</span>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {inspector.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="rounded-md bg-brand-light px-2 py-0.5 text-[10px] font-semibold text-brand"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Stats Row */}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Turnaround</p>
                      <p className="mt-0.5 flex items-center justify-center gap-1 text-xs font-semibold text-slate-700">
                        <Clock className="h-3 w-3 text-slate-400" /> {inspector.turnaround}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Completion</p>
                      <p className="mt-0.5 text-xs font-semibold text-emerald-600">{inspector.completionRate}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Experience</p>
                      <p className="mt-0.5 flex items-center justify-center gap-1 text-xs font-semibold text-slate-700">
                        <Briefcase className="h-3 w-3 text-slate-400" /> {inspector.yearsExp}yr
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  <Link
                    href="/post-a-job"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-light py-2.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                  >
                    Request This Inspector <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
