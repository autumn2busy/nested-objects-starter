import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '../../../lib/supabase-admin'
import { getCurrentUser } from '../../../lib/auth-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check for authentication
    const user = await getCurrentUser()

    // If no user, return sample data for preview (prevents DB hits/data leakage)
    if (!user) {
      return NextResponse.json({
        jobs: [
          {
            id: 'sample-1',
            title: 'Field Inspector - Residential',
            company: 'National Inspections LLC',
            location: 'Phoenix, AZ',
            pay: '$45 - $60 per inspection',
            description: 'This is a sample job listing visible to guests. Log in to see real active listings.',
            link: '#',
            postedDate: new Date().toISOString(),
            roles: ['inspector']
          },
          {
            id: 'sample-2',
            title: 'Mortgage Occupancy Check',
            company: 'SecureField Services',
            location: 'Dallas, TX',
            pay: '$15 - $20',
            description: 'Drive-by occupancy checks needed. High volume available.',
            link: '#',
            postedDate: new Date().toISOString(),
            roles: ['inspector']
          },
          {
            id: 'sample-3',
            title: 'Insurance Loss Control',
            company: 'RiskVisor',
            location: 'Remote / Travel',
            pay: '$75/hr',
            description: 'Commercial insurance inspections. Experience required.',
            link: '#',
            postedDate: new Date().toISOString(),
            roles: ['inspector', 'commercial']
          }
        ]
      })
    }

    const supabase = createServiceRoleClient()

    // Fetch jobs from the public.jobs table
    // Ordering by posted_date descending (newest first)
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('posted_date', { ascending: false, nullsFirst: false })
      .limit(50)

    if (error) {
      console.error('[PUBLIC_JOBS_ERROR]', error)
      return NextResponse.json({ error: 'Unable to load jobs.' }, { status: 500 })
    }

    // Map database columns to the shape expected by the frontend
    const jobs = (data || []).map((job) => ({
      id: job.id,
      title: job.job_title || 'Untitled Position',
      company: job.company || 'Confidential',
      location: job.location || 'Remote / Unspecified',
      pay: job.pay_salary || 'Pay not listed',
      description: job.job_summary || 'No description provided.',
      link: job.apply_link || '#',
      postedDate: job.posted_date,
      // Default roles if not present in DB, or parse tags if available
      roles: job.tags ? job.tags.split(',').map((t: string) => t.trim()) : ['inspector'],
    }))

    return NextResponse.json({ jobs })
  } catch (error: any) {
    console.error('[JOBS_API_ERROR]', error)
    return NextResponse.json({ error: 'Unexpected error loading jobs.' }, { status: 500 })
  }
}
