import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Expected payload shape
type IngestJob = {
    title: string
    company: string
    location: string
    pay?: string
    description?: string
    link: string
    tags?: string[]
    posted_date?: string
}

export async function POST(req: NextRequest) {
    try {
        // 1. Security Check
        const authHeader = req.headers.get('authorization')
        const secret = process.env.CRON_SECRET

        if (!secret || authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse Body
        const body = await req.json().catch(() => null)
        if (!body || !Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid payload. Expected an array of jobs.' }, { status: 400 })
        }

        const newJobs: IngestJob[] = body

        // 3. Insert into Supabase (using Service Role for admin access)
        const supabase = createServiceRoleClient()

        // We map the payload to DB columns. 
        // Assuming table 'jobs' has columns: job_title, company, location, pay_salary, job_summary, apply_link, tags, posted_date
        const payload = newJobs.map(job => ({
            job_title: job.title,
            company: job.company,
            location: job.location,
            pay_salary: job.pay,
            job_summary: job.description,
            apply_link: job.link,
            tags: job.tags ? job.tags.join(',') : null,
            posted_date: job.posted_date || new Date().toISOString(),
            created_at: new Date().toISOString()
        }))

        // Upserting based on 'apply_link' or another unique constraint would be ideal, 
        // but standard insert is safer if we don't know the constraints. 
        // If 'apply_link' is unique, we can use upsert. For now, simple insert.
        const { data, error } = await supabase
            .from('jobs')
            .upsert(payload, { onConflict: 'apply_link', ignoreDuplicates: true })
            .select()

        if (error) {
            console.error('[INGEST_ERROR]', error)
            return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            count: data?.length || 0,
            message: `Successfully processed ${newJobs.length} jobs.`
        })

    } catch (error: any) {
        console.error('[INGEST_HANDLER_ERROR]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
