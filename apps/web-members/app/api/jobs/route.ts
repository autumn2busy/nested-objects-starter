import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Verticals to exclude from the job board (not field services)
const EXCLUDED_VERTICALS = [
  'AI & Data Quality Services',
  'Software Engineering',
  'Data Science',
  // Add more as needed
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const vertical = searchParams.get('vertical') || ''
    const state = searchParams.get('state') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '25', 10)
    const offset = (page - 1) * limit

    const supabase = createServiceRoleClient()

    // Build query
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Exclude non-field-services verticals
    for (const excludedVertical of EXCLUDED_VERTICALS) {
      query = query.neq('service_vertical', excludedVertical)
    }

    // Filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (vertical) {
      query = query.eq('service_vertical', vertical)
    }
    if (state) {
      query = query.eq('state', state)
    }

    const { data: jobs, count, error } = await query

    if (error) {
      console.error('Supabase jobs query error:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Get distinct verticals and states for filter dropdowns
    // Also exclude non-field-services verticals from the dropdown
    const { data: verticals } = await supabase
      .from('jobs')
      .select('service_vertical')
      .eq('is_active', true)
      .not('service_vertical', 'is', null)
      .order('service_vertical')

    const { data: states } = await supabase
      .from('jobs')
      .select('state')
      .eq('is_active', true)
      .not('state', 'is', null)
      .order('state')

    // Deduplicate and filter out excluded verticals
    const uniqueVerticals = [...new Set((verticals || []).map(v => v.service_vertical))]
      .filter(Boolean)
      .filter(v => !EXCLUDED_VERTICALS.includes(v))
    
    const uniqueStates = [...new Set((states || []).map(s => s.state))].filter(Boolean)

    return NextResponse.json({
      jobs: jobs || [],
      total: count || 0,
      page,
      limit,
      filters: {
        verticals: uniqueVerticals,
        states: uniqueStates,
      },
    })
  } catch (err) {
    console.error('Jobs API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}