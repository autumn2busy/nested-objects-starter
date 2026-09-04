import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

// Base configuration for our search queries
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/us/search/1';

// We search for these specific exact phrases related to Nested Objects' niche
const SEARCH_QUERIES = [
    { what: '"field inspector"', vertical: 'Inspections & Evaluations' },
    { what: '"property preservation"', vertical: 'Property Preservation' },
    { what: '"mobile notary"', vertical: 'Closing & Notary Services' },
    { what: '"real estate appraiser"', vertical: 'Appraisals' },
    { what: '"mortgage field services"', vertical: 'Inspections & Evaluations' }
];

// Keywords that MUST be in the title for the job to be considered valid
const REQUIRED_TITLE_KEYWORDS = [
    'inspector', 'preservation', 'notary', 'apprais', 'field service',
    'signing agent', 'signer', 'occupancy', 'reo', 'foreclosure',
    'bpo', 'evaluation', 'mortgage', 'property'
];

// Keywords that indicate a job is an internal corporate or completely unrelated role
const EXCLUDED_KEYWORDS = [
    'supervisor', 'manager', 'banker', 'teller', 'coordinator', 'director',
    'vp', 'president', 'executive', 'admin', 'assistant', 'clerk',
    'receptionist', 'officer', 'analyst', 'underwriter', 'processor',
    'closer', 'retail', 'sales', 'consultant', 'accountant', 'hr', 'marketing',
    'superintendent', 'intern', 'aide', 'housekeeper', 'support specialist',
    'pest control', 'termite', 'hvac', 'plumber', 'electrician', 'developer',
    'technician', 'mental', 'health', 'correctional', 'sergeant', 'police',
    'nurse', 'mechanic', 'teacher', 'driver', 'warehouse', 'software',
    'serving', 'call today', 'notary service -', 'certified mobile notary service' // Spam & Ads
];

export async function GET(request: Request) {
    // Vercel Cron sends CRON_SECRET as a bearer token. Missing configuration must
    // fail closed; x-vercel-cron is a request header, not an authentication proof.
    const cronSecret = process.env.CRON_SECRET?.trim();
    if (!cronSecret) {
        console.error('[ADZUNA_SYNC_BLOCKED]', { reason: 'cron_secret_unconfigured' });
        return NextResponse.json(
            { error: 'Cron authentication is not configured.' },
            { status: 503 }
        );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
        console.error('[ADZUNA_SYNC_BLOCKED]', { reason: 'adzuna_credentials_unconfigured' });
        return NextResponse.json({ error: 'Adzuna API keys not configured' }, { status: 503 });
    }

    try {
        // 2. We will run multiple API requests to Adzuna for each keyword
        const fetchedJobs: any[] = [];
        const failedSources: string[] = [];
        let totalReceived = 0;

        // Helper to pause execution for Adzuna rate limits
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        // Execute sequentially to avoid Adzuna 429 Rate Limits
        for (const query of SEARCH_QUERIES) {
            const url = `${ADZUNA_BASE_URL}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=${encodeURIComponent(query.what)}&sort_by=date`;

            try {
                const res = await fetch(url);
                if (!res.ok) {
                    failedSources.push(query.what);
                    console.error('[ADZUNA_SOURCE_FAILED]', {
                        source: query.what,
                        status: res.status,
                    });
                } else {
                    const data = await res.json();
                    if (!Array.isArray(data.results)) {
                        failedSources.push(query.what);
                        console.error('[ADZUNA_SOURCE_FAILED]', {
                            source: query.what,
                            reason: 'invalid_payload',
                        });
                        continue;
                    }

                    totalReceived += data.results.length;
                    data.results.forEach((job: any) => {
                        if (!job || typeof job.title !== 'string') return;

                        const cleanTitle = job.title.replace(/<\/?[^>]+(>|$)/g, ""); // strip HTML
                        const lowerTitle = cleanTitle.toLowerCase();

                        // Sever jobs containing corporate/management keywords
                        const isExcluded = EXCLUDED_KEYWORDS.some(keyword => lowerTitle.includes(keyword));

                        // Mandate that the title actually contains at least one target industry keyword
                        const hasRequiredKeyword = REQUIRED_TITLE_KEYWORDS.some(keyword => lowerTitle.includes(keyword));

                        if (!isExcluded && hasRequiredKeyword) {
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
            } catch {
                failedSources.push(query.what);
                console.error('[ADZUNA_SOURCE_FAILED]', {
                    source: query.what,
                    reason: 'request_error',
                });
            } finally {
                // Wait before the next source request to respect Adzuna limits.
                await delay(1000);
            }
        }

        if (failedSources.length > 0) {
            console.error('[ADZUNA_SYNC_BLOCKED]', {
                reason: 'partial_source_failure',
                failedSourceCount: failedSources.length,
            });
            return NextResponse.json(
                {
                    success: false,
                    preservedExisting: true,
                    error: 'Adzuna returned an incomplete source set. Existing jobs were preserved.',
                },
                { status: 503 }
            );
        }

        // 3. Deduplicate the complete source set before touching durable jobs.
        // Adzuna can occasionally return the same job across different keyword searches
        // We must deduplicate them in-memory first so the Supabase Upsert payload doesn't conflict with itself
        const uniqueJobsMap = new Map();
        fetchedJobs.forEach(job => {
            if (!uniqueJobsMap.has(job.source_id)) {
                uniqueJobsMap.set(job.source_id, job);
            }
        });
        const uniqueFetchedJobs = Array.from(uniqueJobsMap.values());

        if (uniqueFetchedJobs.length === 0) {
            console.error('[ADZUNA_SYNC_BLOCKED]', { reason: 'empty_accepted_source_set' });
            return NextResponse.json(
                {
                    success: false,
                    preservedExisting: true,
                    error: 'Adzuna returned no accepted jobs. Existing jobs were preserved.',
                },
                { status: 503 }
            );
        }

        let supabaseAdmin: ReturnType<typeof createServiceRoleClient>;
        try {
            supabaseAdmin = createServiceRoleClient();
        } catch {
            console.error('[ADZUNA_DB_WRITE_FAILED]', { operation: 'connect' });
            return NextResponse.json(
                { success: false, preservedExisting: true, error: 'Job storage is unavailable.' },
                { status: 503 }
            );
        }

        // 4. Upsert the replacement set first. If it fails, no existing job is deactivated.
        const { error: upsertError } = await supabaseAdmin
            .from('jobs')
            .upsert(uniqueFetchedJobs, { onConflict: 'source_id', ignoreDuplicates: false });

        if (upsertError) {
            console.error('[ADZUNA_DB_WRITE_FAILED]', { operation: 'upsert' });
            return NextResponse.json(
                { success: false, preservedExisting: true, error: 'Job synchronization failed.' },
                { status: 503 }
            );
        }

        // 5. Only after a successful upsert, deactivate prior Adzuna rows that are
        // absent from this complete run. A cleanup failure leaves extra stale rows
        // visible rather than removing the newly verified source set.
        const currentSourceIds = uniqueFetchedJobs.map(job => job.source_id);
        const { error: deactivateError } = await supabaseAdmin
            .from('jobs')
            .update({ is_active: false })
            .eq('source', 'Adzuna')
            .not('source_id', 'in', `(${currentSourceIds.join(',')})`);

        if (deactivateError) {
            console.error('[ADZUNA_DB_WRITE_FAILED]', { operation: 'deactivate_stale' });
            return NextResponse.json(
                {
                    success: false,
                    preservedExisting: true,
                    insertedOrUpdated: uniqueFetchedJobs.length,
                    error: 'New jobs were saved, but stale-job cleanup could not be verified.',
                },
                { status: 503 }
            );
        }

        console.info('[ADZUNA_SYNC_COMPLETED]', {
            sourceCount: SEARCH_QUERIES.length,
            received: totalReceived,
            accepted: fetchedJobs.length,
            unique: uniqueFetchedJobs.length,
        });

        return NextResponse.json({
            success: true,
            insertedOrUpdated: uniqueFetchedJobs.length,
            sourceCount: SEARCH_QUERIES.length,
            message: `Successfully synchronized ${uniqueFetchedJobs.length} jobs from Adzuna.`
        });

    } catch {
        console.error('[ADZUNA_SYNC_FAILED]');
        return NextResponse.json(
            { success: false, preservedExisting: true, error: 'Job synchronization failed.' },
            { status: 503 }
        );
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
