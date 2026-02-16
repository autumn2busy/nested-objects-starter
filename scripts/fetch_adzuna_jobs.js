/**
 * NESTED OBJECTS — Adzuna Job Fetcher
 * 
 * Fetches jobs from Adzuna API across all 15 service verticals,
 * normalizes them, deduplicates, and upserts into Supabase.
 * 
 * USAGE:
 *   node fetch_adzuna_jobs.js
 * 
 * ENVIRONMENT VARIABLES (set in .env or n8n credentials):
 *   ADZUNA_APP_ID=26d05d47
 *   ADZUNA_APP_KEY=b6849b352adb9dbb6762492e5f0aa8b6
 *   SUPABASE_URL=https://lzzghrjjsyzlvofpidis.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 
 * SCHEDULE: Run every 6-12 hours via n8n cron or Vercel cron
 */

const crypto = require('crypto');

// ============================================
// CONFIG
// ============================================
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '26d05d47';
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || 'b6849b352adb9dbb6762492e5f0aa8b6';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESULTS_PER_PAGE = 25;
const MAX_PAGES = 2; // 25 * 2 = 50 jobs per query max

// Search queries mapped to service verticals
const VERTICAL_QUERIES = [
  { vertical: 'Field Inspection Services', queries: ['field inspector', 'property inspector mortgage'] },
  { vertical: 'Insurance Inspection Services', queries: ['loss control inspector', 'insurance field inspector'] },
  { vertical: 'Property Preservation', queries: ['property preservation contractor', 'REO property maintenance'] },
  { vertical: 'Appraisal & Valuation Services', queries: ['property appraiser', 'real estate appraiser'] },
  { vertical: 'Notary & Signing Services', queries: ['notary signing agent', 'mobile notary'] },
  { vertical: 'Medical & Pharmaceutical Logistics', queries: ['medical courier', 'pharmaceutical delivery driver'] },
  { vertical: 'Quality Assurance & Mystery Evaluation', queries: ['mystery shopper', 'quality evaluator retail'] },
  { vertical: 'AI & Data Quality Services', queries: ['data annotation', 'AI trainer remote'] },
  { vertical: 'Professional Test Administration', queries: ['test proctor', 'exam proctor'] },
  { vertical: 'Field Research & Compliance Auditing', queries: ['field auditor retail', 'merchandiser auditor'] },
  { vertical: 'Claims Adjusting & Investigation', queries: ['independent adjuster', 'claims adjuster field'] },
  { vertical: 'Delivery & Logistics Operations', queries: ['delivery contractor 1099', 'route delivery driver independent'] },
  { vertical: 'Drone & Aerial Inspection Services', queries: ['drone pilot', 'UAS pilot inspector'] },
  { vertical: 'Virtual Inspection & Remote Verification', queries: ['virtual inspector', 'remote property verification'] },
  { vertical: 'Energy Auditing & Building Performance', queries: ['energy auditor', 'building performance inspector BPI'] },
];

// ============================================
// HELPERS
// ============================================
function makeDedup(title, company, location) {
  const raw = `${(title || '').toLowerCase().trim()}|${(company || '').toLowerCase().trim()}|${(location || '').toLowerCase().trim()}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

function extractState(locationAreas) {
  // Adzuna location.area = ["US", "State", "County", "City"]
  if (Array.isArray(locationAreas) && locationAreas.length >= 2) {
    return locationAreas[1]; // State is always index 1
  }
  return null;
}

function normalizeSalaryType(min, max) {
  // Adzuna returns annual salaries. If < 200, likely hourly.
  if (!min && !max) return null;
  const val = min || max;
  if (val < 200) return 'hourly';
  if (val < 1000) return 'daily';
  return 'annual';
}

function normalizeJob(adzunaJob, vertical) {
  const loc = adzunaJob.location || {};
  const company = adzunaJob.company?.display_name || null;
  const locationDisplay = loc.display_name || null;
  
  return {
    title: adzunaJob.title || 'Untitled',
    company: company,
    description: (adzunaJob.description || '').substring(0, 2000), // Truncate
    location_display: locationDisplay,
    state: extractState(loc.area),
    country: 'US',
    latitude: adzunaJob.latitude || null,
    longitude: adzunaJob.longitude || null,
    salary_min: adzunaJob.salary_min || null,
    salary_max: adzunaJob.salary_max || null,
    salary_type: normalizeSalaryType(adzunaJob.salary_min, adzunaJob.salary_max),
    salary_is_predicted: adzunaJob.salary_is_predicted === '1',
    service_vertical: vertical,
    category: adzunaJob.category?.label || null,
    source: 'adzuna',
    source_id: String(adzunaJob.id),
    source_url: adzunaJob.redirect_url || '',
    posted_date: adzunaJob.created || new Date().toISOString(),
    is_active: true,
    dedup_hash: makeDedup(adzunaJob.title, company, locationDisplay),
  };
}

// ============================================
// ADZUNA API
// ============================================
async function fetchAdzunaPage(query, page = 1) {
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
    if (!resp.ok) {
      console.error(`  Adzuna API error ${resp.status} for "${query}" page ${page}`);
      return [];
    }
    const data = await resp.json();
    return data.results || [];
  } catch (err) {
    console.error(`  Fetch error for "${query}": ${err.message}`);
    return [];
  }
}

async function fetchVertical(vertical, queries) {
  const allJobs = [];
  
  for (const query of queries) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const results = await fetchAdzunaPage(query, page);
      if (results.length === 0) break;
      
      const normalized = results.map(j => normalizeJob(j, vertical));
      allJobs.push(...normalized);
      
      // Rate limit: 250ms between requests
      await new Promise(r => setTimeout(r, 250));
    }
  }
  
  return allJobs;
}

// ============================================
// SUPABASE UPSERT
// ============================================
async function upsertJobs(jobs) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log('  [DRY RUN] Would upsert', jobs.length, 'jobs');
    return { inserted: jobs.length, errors: 0 };
  }
  
  // Batch upsert via Supabase REST API
  const url = `${SUPABASE_URL}/rest/v1/jobs`;
  let inserted = 0;
  let errors = 0;
  
  // Upsert in batches of 50
  for (let i = 0; i < jobs.length; i += 50) {
    const batch = jobs.slice(i, i + 50);
    
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',  // Upsert on dedup_hash
        },
        body: JSON.stringify(batch),
      });
      
      if (resp.ok) {
        inserted += batch.length;
      } else {
        const errText = await resp.text();
        console.error(`  Supabase error: ${resp.status} — ${errText.substring(0, 200)}`);
        errors += batch.length;
      }
    } catch (err) {
      console.error(`  Supabase fetch error: ${err.message}`);
      errors += batch.length;
    }
  }
  
  return { inserted, errors };
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('=== NESTED OBJECTS JOB FETCHER ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Source: Adzuna API`);
  console.log(`Verticals: ${VERTICAL_QUERIES.length}`);
  console.log('');
  
  let totalJobs = 0;
  const allJobs = [];
  
  for (const { vertical, queries } of VERTICAL_QUERIES) {
    process.stdout.write(`  ${vertical}... `);
    const jobs = await fetchVertical(vertical, queries);
    console.log(`${jobs.length} jobs`);
    allJobs.push(...jobs);
    totalJobs += jobs.length;
  }
  
  // Deduplicate by hash
  const seen = new Set();
  const uniqueJobs = allJobs.filter(j => {
    if (seen.has(j.dedup_hash)) return false;
    seen.add(j.dedup_hash);
    return true;
  });
  
  console.log('');
  console.log(`Total fetched: ${totalJobs}`);
  console.log(`After dedup: ${uniqueJobs.length}`);
  console.log(`Duplicates removed: ${totalJobs - uniqueJobs.length}`);
  console.log('');
  
  // Upsert to Supabase
  console.log('Upserting to Supabase...');
  const result = await upsertJobs(uniqueJobs);
  console.log(`  Inserted/updated: ${result.inserted}`);
  console.log(`  Errors: ${result.errors}`);
  console.log('');
  console.log('=== DONE ===');
  
  // Return summary for n8n
  return {
    timestamp: new Date().toISOString(),
    total_fetched: totalJobs,
    unique_jobs: uniqueJobs.length,
    inserted: result.inserted,
    errors: result.errors,
    by_vertical: VERTICAL_QUERIES.map(v => ({
      vertical: v.vertical,
      count: allJobs.filter(j => j.service_vertical === v.vertical).length,
    })),
  };
}

main().then(summary => {
  console.log(JSON.stringify(summary, null, 2));
}).catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
