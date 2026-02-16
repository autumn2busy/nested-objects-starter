/**
 * /api/jobs/refresh/route.ts
 * 
 * Vercel Cron calls this once daily.
 * Fetches jobs from Adzuna, filters garbage, upserts to Supabase,
 * cleans up expired jobs, returns summary.
 * 
 * Protected by CRON_SECRET header (Vercel injects this automatically
 * for cron jobs, or you can call manually with the header).
 * 
 * ADD TO vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/jobs/refresh",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 * 
 * ENV VARS NEEDED IN VERCEL:
 *   ADZUNA_APP_ID
 *   ADZUNA_APP_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CRON_SECRET  (Vercel auto-verifies this for cron triggers)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

// ============================================
// Vercel cron has a 60s default timeout on Hobby,
// 300s on Pro. This route needs Pro for 15 verticals.
// If on Hobby, reduce MAX_PAGES to 1.
// ============================================
export const maxDuration = 300;

// ============================================
// CONFIG
// ============================================
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '';
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESULTS_PER_PAGE = 25;
const MAX_PAGES = 2;

// ============================================
// TITLE BLOCKLIST
// ============================================
const TITLE_BLOCKLIST = [
  'medical assistant', 'nursing assistant', 'registered nurse', 'licensed practical nurse',
  'lpn', 'rn ', 'cna ', 'certified nursing', 'nurse practitioner', 'physician', 'surgeon',
  'phlebotomist', 'dental', 'veterinary', 'vet tech', 'pharmacy technician', 'pharmacist',
  'physical therapist', 'occupational therapist', 'speech pathologist', 'radiologist',
  'sonographer', 'x-ray', 'emt ', 'paramedic', 'pathobiology', 'endocrinology',
  'oncology', 'cardiology', 'dermatology', 'anesthesiology', 'psychiatry',
  'administrative coordinator', 'administrative assistant', 'office worker', 'office manager',
  'receptionist', 'secretary', 'executive assistant', 'data entry clerk', 'file clerk',
  'office assistant', 'front desk', 'student worker', 'student office',
  'software engineer', 'software developer', 'web developer', 'frontend developer',
  'backend developer', 'full stack', 'devops', 'sre ', 'programmer', 'java developer',
  'python developer', '.net developer', 'ios developer', 'android developer',
  'cloud engineer', 'systems administrator', 'network engineer', 'database administrator',
  'cybersecurity', 'it manager', 'it director', 'it specialist',
  'mortgage loan processor', 'loan officer', 'underwriter', 'bank teller', 'financial analyst',
  'accounts payable', 'accounts receivable', 'bookkeeper', 'payroll', 'tax preparer',
  'credit analyst', 'compliance officer', 'loan processor',
  'teacher', 'professor', 'instructor ', 'tutor ', 'teaching assistant', 'school counselor',
  'principal', 'dean ', 'superintendent',
  'cashier', 'barista', 'server ', 'bartender', 'host ', 'hostess', 'busser',
  'dishwasher', 'cook ', 'chef ', 'line cook', 'prep cook',
  'vice president', 'chief ', 'director of', 'senior manager', 'general manager',
  'regional manager', 'district manager',
  'electrician', 'plumber', 'hvac technician', 'welder', 'machinist', 'cnc ',
  'carpenter', 'roofer', 'painter ', 'glazier',
];

// ============================================
// PER-VERTICAL MUST-MATCH KEYWORDS
// ============================================
const VERTICAL_MUST_MATCH: Record<string, string[]> = {
  'Field Inspection Services': [
    'inspector', 'inspection', 'field service', 'occupancy', 'property condition',
    'bpo', 'broker price', 'drive-by', 'exterior inspection', 'interior inspection'
  ],
  'Insurance Inspection Services': [
    'inspector', 'inspection', 'loss control', 'underwriting', 'risk assessment',
    'insurance survey', 'property survey', 'loss prevention'
  ],
  'Property Preservation': [
    'preservation', 'reo ', 'foreclosure', 'vacant property', 'property maintenance',
    'winterization', 'lawn maintenance', 'debris removal', 'boarding', 'locksmith'
  ],
  'Appraisal & Valuation Services': [
    'appraiser', 'appraisal', 'valuation', 'bpo', 'broker price', 'amc '
  ],
  'Notary & Signing Services': [
    'notary', 'signing agent', 'loan signing', 'mobile notary', 'ron ',
    'remote notarization', 'title closer', 'closing agent'
  ],
  'Medical & Pharmaceutical Logistics': [
    'courier', 'delivery', 'driver', 'route', 'transport', 'logistics',
    'specimen', 'medical delivery', 'pharmaceutical', 'lab courier'
  ],
  'Quality Assurance & Mystery Evaluation': [
    'mystery shop', 'secret shop', 'evaluator', 'quality assurance', 'audit',
    'compliance', 'customer experience', 'field research', 'merchandis'
  ],
  'AI & Data Quality Services': [
    'annotation', 'data label', 'ai train', 'ai eval', 'prompt engineer',
    'data quality', 'rater', 'search quality', 'content evaluation', 'ai test'
  ],
  'Professional Test Administration': [
    'proctor', 'proctoring', 'test admin', 'exam admin', 'testing center',
    'test site', 'exam site', 'certification exam'
  ],
  'Field Research & Compliance Auditing': [
    'auditor', 'audit', 'merchandis', 'field research', 'compliance',
    'retail audit', 'store audit', 'shelf audit', 'inventory audit', 'data collect'
  ],
  'Claims Adjusting & Investigation': [
    'adjuster', 'adjusting', 'claims', 'catastrophe', 'cat adjuster',
    'independent adjuster', 'ia ', 'xactimate', 'estimator'
  ],
  'Delivery & Logistics Operations': [
    'delivery', 'driver', 'courier', 'route', 'logistics', 'fleet',
    'last mile', 'freight', 'dispatch', 'trucking', 'cdl'
  ],
  'Drone & Aerial Inspection Services': [
    'drone', 'uas ', 'uav ', 'part 107', 'aerial', 'pilot',
    'remote pilot', 'rpic', 'unmanned'
  ],
  'Virtual Inspection & Remote Verification': [
    'virtual inspection', 'remote verification', 'photo inspection', 'remote inspector',
    'virtual survey', 'desktop review'
  ],
  'Energy Auditing & Building Performance': [
    'energy audit', 'hers ', 'bpi ', 'blower door', 'duct test', 'energy rater',
    'building performance', 'energy efficiency', 'weatherization'
  ],
};

// ============================================
// SEARCH QUERIES (tightened from v1)
// ============================================
const VERTICAL_QUERIES = [
  { vertical: 'Field Inspection Services', queries: ['field inspector property', 'mortgage field inspection occupancy'] },
  { vertical: 'Insurance Inspection Services', queries: ['loss control inspector insurance', 'insurance field inspection survey'] },
  { vertical: 'Property Preservation', queries: ['property preservation contractor', 'REO property maintenance foreclosure'] },
  { vertical: 'Appraisal & Valuation Services', queries: ['real estate appraiser residential', 'property appraiser licensed'] },
  { vertical: 'Notary & Signing Services', queries: ['notary signing agent loan', 'mobile notary signing'] },
  { vertical: 'Medical & Pharmaceutical Logistics', queries: ['medical courier driver', 'pharmaceutical delivery route'] },
  { vertical: 'Quality Assurance & Mystery Evaluation', queries: ['mystery shopper evaluator', 'secret shopper retail audit'] },
  { vertical: 'AI & Data Quality Services', queries: ['data annotation remote contractor', 'AI evaluator trainer remote'] },
  { vertical: 'Professional Test Administration', queries: ['test proctor exam', 'proctoring certification exam'] },
  { vertical: 'Field Research & Compliance Auditing', queries: ['field auditor retail compliance', 'merchandiser audit store'] },
  { vertical: 'Claims Adjusting & Investigation', queries: ['independent adjuster claims', 'catastrophe adjuster property'] },
  { vertical: 'Delivery & Logistics Operations', queries: ['delivery contractor 1099 route', 'last mile delivery driver independent'] },
  { vertical: 'Drone & Aerial Inspection Services', queries: ['drone pilot inspector Part 107', 'drone inspection aerial'] },
  { vertical: 'Virtual Inspection & Remote Verification', queries: ['virtual property inspection remote', 'remote property verification photo'] },
  { vertical: 'Energy Auditing & Building Performance', queries: ['energy auditor HERS rater', 'building performance inspector BPI'] },
];

// ============================================
// HELPERS
// ============================================
function isBlocklisted(title: string): boolean {
  const lower = title.toLowerCase();
  return TITLE_BLOCKLIST.some(blocked => lower.includes(blocked));
}

function matchesVertical(title: string, vertical: string): boolean {
  const mustMatch = VERTICAL_MUST_MATCH[vertical];
  if (!mustMatch) return true;
  const lower = title.toLowerCase();
  return mustMatch.some(kw => lower.includes(kw.toLowerCase()));
}

function makeDedup(title: string, company: string, location: string): string {
  const raw = `${(title || '').toLowerCase().trim()}|${(company || '').toLowerCase().trim()}|${(location || '').toLowerCase().trim()}`;
  return createHash('md5').update(raw).digest('hex');
}

function normalizeSalaryType(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const val = min || max || 0;
  if (val < 200) return 'hourly';
  if (val < 1000) return 'daily';
  return 'annual';
}

// ============================================
// ADZUNA FETCH
// ============================================
async function fetchAdzunaPage(query: string, page: number = 1) {
  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    what: query,
    results_per_page: String(RESULTS_PER_PAGE),
    'content-type': 'application/json',
    sort_by: 'date',
  });
  const url = `https://api.adzuna.com/v1/api/jobs/us/search/${page}?${params}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.results || [];
  } catch {
    return [];
  }
}

interface VerticalResult {
  vertical: string;
  accepted: number;
  rejected: number;
}

async function fetchAllVerticals() {
  const allJobs: any[] = [];
  const verticalResults: VerticalResult[] = [];

  for (const { vertical, queries } of VERTICAL_QUERIES) {
    let accepted = 0;
    let rejected = 0;

    for (const query of queries) {
      for (let page = 1; page <= MAX_PAGES; page++) {
        const results = await fetchAdzunaPage(query, page);
        if (results.length === 0) break;

        for (const raw of results) {
          const title = raw.title || '';

          if (isBlocklisted(title)) { rejected++; continue; }
          if (!matchesVertical(title, vertical)) { rejected++; continue; }

          const loc = raw.location || {};
          const company = raw.company?.display_name || null;
          const locationDisplay = loc.display_name || null;
          const areas = loc.area || [];
          const state = Array.isArray(areas) && areas.length >= 2 ? areas[1] : null;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          allJobs.push({
            title,
            company,
            description: (raw.description || '').substring(0, 2000),
            location_display: locationDisplay,
            state,
            country: 'US',
            latitude: raw.latitude || null,
            longitude: raw.longitude || null,
            salary_min: raw.salary_min || null,
            salary_max: raw.salary_max || null,
            salary_type: normalizeSalaryType(raw.salary_min, raw.salary_max),
            salary_is_predicted: raw.salary_is_predicted === '1',
            service_vertical: vertical,
            category: raw.category?.label || null,
            source: 'adzuna',
            source_id: String(raw.id),
            source_url: raw.redirect_url || '',
            posted_date: raw.created || new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            is_active: true,
            dedup_hash: makeDedup(title, company || '', locationDisplay || ''),
          });
          accepted++;
        }

        // Rate limit: 250ms between Adzuna calls
        await new Promise(r => setTimeout(r, 250));
      }
    }

    verticalResults.push({ vertical, accepted, rejected });
  }

  // Deduplicate
  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter(j => {
    if (seen.has(j.dedup_hash)) return false;
    seen.add(j.dedup_hash);
    return true;
  });

  return { uniqueJobs, totalFetched: allJobs.length, verticalResults };
}

// ============================================
// SUPABASE OPS
// ============================================
async function upsertJobs(jobs: any[]) {
  let inserted = 0;
  let errors = 0;
  const batchSize = 50;

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(batch),
      });
      if (resp.ok) inserted += batch.length;
      else errors += batch.length;
    } catch {
      errors += batch.length;
    }
  }
  return { inserted, errors };
}

async function cleanupExpired(): Promise<number> {
  try {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?expires_at=lt.${new Date().toISOString()}&is_active=eq.true`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ is_active: false }),
      }
    );
    if (resp.ok) {
      const data = await resp.json();
      return Array.isArray(data) ? data.length : 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

// ============================================
// ROUTE HANDLER
// ============================================
export async function GET(req: NextRequest) {
  // Verify cron secret — Vercel sends this automatically for cron jobs
  // For manual testing, pass ?secret=YOUR_CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    const querySecret = req.nextUrl.searchParams.get('secret');
    const provided = authHeader?.replace('Bearer ', '') || querySecret;
    
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Validate config
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    return NextResponse.json({ error: 'Missing Adzuna credentials' }, { status: 500 });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  const startTime = Date.now();

  try {
    // 1. Fetch and filter
    const { uniqueJobs, totalFetched, verticalResults } = await fetchAllVerticals();

    // 2. Upsert to Supabase
    const { inserted, errors } = await upsertJobs(uniqueJobs);

    // 3. Cleanup expired
    const expired = await cleanupExpired();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      duration_seconds: parseFloat(duration),
      total_from_api: totalFetched,
      after_dedup: uniqueJobs.length,
      inserted_or_updated: inserted,
      errors,
      expired_cleaned: expired,
      by_vertical: verticalResults,
    };

    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}