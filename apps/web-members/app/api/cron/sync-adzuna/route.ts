import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

// Base configuration for our search queries
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/us/search/1';

// We search for these specific keywords related to Nested Objects' niche
const SEARCH_QUERIES = [
    { what: 'field inspector', vertical: 'Inspections & Evaluations' },
    { what: 'property preservation', vertical: 'Property Preservation' },
    { what: 'mobile notary', vertical: 'Closing & Notary Services' },
    { what: 'real estate appraiser', vertical: 'Appraisals' },
    { what: 'mortgage field services', vertical: 'Inspections & Evaluations' }
];

// Keywords that indicate a job is an internal corporate or management role rather than field service
const EXCLUDED_KEYWORDS = [
    'supervisor', 'manager', 'banker', 'teller', 'coordinator', 'director',
    'vp', 'president', 'executive', 'admin', 'assistant', 'clerk',
    'receptionist', 'officer', 'analyst', 'underwriter', 'processor',
    'closer', 'retail', 'sales', 'consultant', 'accountant', 'hr', 'marketing'
];

export async function GET(request: Request) {
    // 1. Verify cron secret to prevent unauthorized scraping
    const authHeader = request.headers.get('Authorization');
    if (
        process.env.CRON_SECRET &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
        request.headers.get('x-vercel-cron') !== '1'
    ) {
        if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
        return NextResponse.json({ error: 'Adzuna API keys not configured' }, { status: 500 });
    }

    const supabaseAdmin = createServiceRoleClient();
    let totalInserted = 0;
    let totalErrors = 0;

    try {
        // 2. We will run multiple API requests to Adzuna for each keyword
        const fetchedJobs: any[] = [];

        // Helper to pause execution for Adzuna rate limits
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        // Execute sequentially to avoid Adzuna 429 Rate Limits
        for (const query of SEARCH_QUERIES) {
            const url = `${ADZUNA_BASE_URL}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=${encodeURIComponent(query.what)}&sort_by=date`;

            try {
                const res = await fetch(url);
                if (!res.ok) {
                    console.error(`Adzuna API Error for ${query.what}: ${res.status}`);
                    continue; // Skip and try next query
                }

                const data = await res.json();
                if (data.results && Array.isArray(data.results)) {
                    data.results.forEach((job: any) => {
                        const cleanTitle = job.title.replace(/<\/?[^>]+(>|$)/g, ""); // strip HTML
                        const lowerTitle = cleanTitle.toLowerCase();

                        // Sever jobs containing corporate/management keywords
                        const isExcluded = EXCLUDED_KEYWORDS.some(keyword => lowerTitle.includes(keyword));

                        if (!isExcluded) {
                            fetchedJobs.push({
                                source_id: `adzuna_${job.id}`,
                                title: cleanTitle,
                                company: job.company?.display_name || 'Unknown',
                                description: job.description || '',
                                location_display: job.location?.display_name || '',
                                state: extractState(job.location?.area || []),
                                salary_min: job.salary_min || null,
                                salary_max: job.salary_max || null,
                                salary_type: 'annual',
                                salary_is_predicted: job.salary_is_predicted === '1',
                                service_vertical: query.vertical,
                                category: 'Field Service',
                                source: 'Adzuna',
                                source_url: job.redirect_url || '',
                                posted_date: job.created ? new Date(job.created).toISOString() : new Date().toISOString(),
                                is_active: true
                            });
                        }
                    });
                }

                // Wait 1 second before firing the next Adzuna webhook to prevent 429 limits
                await delay(1000);
            } catch (e) {
                console.error(`Failed fetching ${query.what}:`, e);
            }
        }

        // 3. Deactivate old Adzuna jobs so we don't have stale listings
        // We only deactivate jobs sourced from Adzuna to preserve manual ones
        await supabaseAdmin
            .from('jobs')
            .update({ is_active: false })
            .eq('source', 'Adzuna');

        // 4. Batch Upsert into Supabase
        // Adzuna can occasionally return the same job across different keyword searches
        // We must deduplicate them in-memory first so the Supabase Upsert payload doesn't conflict with itself
        const uniqueJobsMap = new Map();
        fetchedJobs.forEach(job => {
            if (!uniqueJobsMap.has(job.source_id)) {
                uniqueJobsMap.set(job.source_id, job);
            }
        });
        const uniqueFetchedJobs = Array.from(uniqueJobsMap.values());

        if (uniqueFetchedJobs.length > 0) {
            const { error, count } = await supabaseAdmin
                .from('jobs')
                .upsert(uniqueFetchedJobs, { onConflict: 'source_id', ignoreDuplicates: false });

            if (error) {
                console.error('Supabase upsert error:', error);
                totalErrors++;
                return NextResponse.json({ error: 'Database upsert failed', details: error }, { status: 500 });
            }

            totalInserted = uniqueFetchedJobs.length;
        }

        return NextResponse.json({
            success: true,
            inserted: totalInserted,
            errors: totalErrors,
            message: `Successfully synchronized ${totalInserted} jobs from Adzuna.`
        });

    } catch (error: any) {
        console.error('CRON Adzuna Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to reliably pull 2-letter state codes from Adzuna's area array 
// [ "US", "Texas", "Austin" ] -> "TX"
function extractState(areaArray: string[]): string {
    if (!areaArray || areaArray.length < 2) return '';
    const stateName = areaArray[1];

    // Mapping full state names to code
    const states: Record<string, string> = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
        'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
        'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
        'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
        'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
        'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
        'District of Columbia': 'DC'
    };

    return states[stateName] || stateName.substring(0, 2).toUpperCase();
}
