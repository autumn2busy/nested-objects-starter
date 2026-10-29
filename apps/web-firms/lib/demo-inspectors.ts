// Fictional fixtures from the original public /inspectors prototype.
// These records are not members, available contractors, or verified credentials.
export const demoInspectors = [
  { id: 'insp-001', name: 'Marcus Davis', location: 'Atlanta, GA', specialties: ['Property Condition', 'Occupancy Verification', 'REO'], inspectionTypes: ['Property Condition', 'Occupancy Verification'], yearsExp: 8 },
  { id: 'insp-002', name: 'Sarah Kim', location: 'Houston, TX', specialties: ['Loss Draft', 'Insurance Inspection', 'Roof/Exterior'], inspectionTypes: ['Insurance Inspection', 'Loss Draft'], yearsExp: 5 },
  { id: 'insp-003', name: 'James Lewis', location: 'Phoenix, AZ', specialties: ['Property Preservation', 'Occupancy Verification'], inspectionTypes: ['Property Preservation'], yearsExp: 4 },
  { id: 'insp-004', name: 'Priya Mehta', location: 'Denver, CO', specialties: ['Commercial Appraisal', 'Construction Draw'], inspectionTypes: ['Construction Draw'], yearsExp: 6 },
  { id: 'insp-005', name: 'Tony Rodriguez', location: 'Miami, FL', specialties: ['Property Condition', 'Insurance Inspection', 'Property Preservation'], inspectionTypes: ['Insurance Inspection', 'Property Condition'], yearsExp: 10 },
  { id: 'insp-006', name: 'Angela Brooks', location: 'Chicago, IL', specialties: ['Occupancy Verification', 'REO', 'Loss Draft'], inspectionTypes: ['Occupancy Verification', 'REO'], yearsExp: 7 },
] as const

// Explicit fictional member selections are distinct from the original source specialties.
export function filterDemoInspectors(query: string, inspectionType: string) {
  const search = query.trim().toLowerCase()
  return demoInspectors.filter(person =>
    [person.name, person.location, ...person.specialties, ...person.inspectionTypes].join(' ').toLowerCase().includes(search)
    && (!inspectionType || person.inspectionTypes.some(item => item === inspectionType))
  )
}
