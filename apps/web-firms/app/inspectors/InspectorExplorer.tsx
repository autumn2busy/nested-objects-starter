'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin, Search } from 'lucide-react'
import { demoInspectors, filterDemoInspectors } from '../../lib/demo-inspectors'

const specialties = Array.from(new Set(demoInspectors.flatMap(person => [...person.specialties]))).sort()

export function InspectorExplorer() {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('')
  const matches = filterDemoInspectors(query, specialty)
  function clear() { setQuery(''); setSpecialty('') }

  return <div className="mt-8">
    <div className="b2b-card grid items-end gap-4 p-5 md:grid-cols-[1.5fr_1fr_auto]">
      <div><label htmlFor="sample-search" className="mb-2 block text-sm font-semibold">Search sample profiles</label><div className="relative"><Search size={17} className="absolute left-4 top-4 text-slate-500" aria-hidden /><input id="sample-search" className="field pl-11" type="search" placeholder="Name, city, state, or specialty" value={query} onChange={event => setQuery(event.target.value)} /></div></div>
      <div><label htmlFor="sample-specialty" className="mb-2 block text-sm font-semibold">Inspection specialty</label><select id="sample-specialty" className="field" value={specialty} onChange={event => setSpecialty(event.target.value)}><option value="">All specialties</option>{specialties.map(item=><option key={item}>{item}</option>)}</select></div>
      <button type="button" onClick={clear} className="button button-secondary">Reset filters</button>
    </div>
    <p className="my-6 text-sm text-slate-600" role="status">{matches.length} of {demoInspectors.length} fictional sample profiles</p>
    {matches.length === 0 ? <div className="b2b-card p-10 text-center"><h2 className="text-xl font-bold">No samples match those filters.</h2><p className="mt-3 text-slate-600">This small demo does not represent actual inspector coverage.</p><button className="button button-primary mt-6" onClick={clear} type="button">Show all samples</button></div> :
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{matches.map(person=><article className="b2b-card flex flex-col p-6" key={person.id}>
        <div className="flex items-center justify-between gap-2"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light font-bold text-brand" aria-hidden>{person.name.split(' ').map(part=>part[0]).join('')}</span><span className="demo-tag">Fictional sample</span></div>
        <h2 className="mt-5 text-xl font-bold">{person.name}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600"><MapPin size={15} aria-hidden />{person.location}</p>
        <div className="mt-5 flex flex-wrap gap-2">{person.specialties.map(item=><span className="rounded-lg bg-brand-light px-2.5 py-1 text-xs font-medium text-brand" key={item}>{item}</span>)}</div>
        <p className="mb-6 mt-5 text-sm text-slate-600">{person.yearsExp} years of experience <span className="text-xs">(illustrative)</span></p>
        <Link href={'/inspectors/' + person.id} className="button button-secondary mt-auto justify-between" aria-label={'View sample profile for ' + person.name}>View sample profile <ArrowRight size={16} aria-hidden /></Link>
      </article>)}</div>}
    <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-light p-6"><div><h2 className="font-bold">What happens beyond a profile?</h2><p className="mt-2 text-sm text-slate-600">See the proposed human-led collaboration process.</p></div><Link href="/dashboard" className="button button-primary">Explore the process <ArrowRight size={16} aria-hidden /></Link></div>
  </div>
}
