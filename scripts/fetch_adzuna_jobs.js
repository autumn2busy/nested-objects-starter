/**
 * NESTED OBJECTS — Adzuna Job Fetcher v2
 * 
 * CHANGES FROM V1:
 *   - Added TITLE_BLOCKLIST to reject obviously wrong jobs
 *   - Added per-vertical MUST_MATCH keywords (title must contain at least one)
 *   - Added logging for rejected jobs so you can audit
 *   - Tightened search queries to reduce false positives
 *   - Added 30-day auto-expire on insert
 *   - Added cleanup of expired jobs at end of run
 * 
 * USAGE:
 *   node fetch_adzuna_jobs_v2.js
 * 
 * ENVIRONMENT VARIABLES:
 *   ADZUNA_APP_ID
 *   ADZUNA_APP_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * 
 * SCHEDULE: Once daily via n8n cron
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
const MAX_PAGES = 2;

// ============================================
// BLOCKLIST — titles containing these get REJECTED
// Case-insensitive partial match on job title
// ============================================
const TITLE_BLOCKLIST = [
  // Medical/nursing roles that aren't courier/logistics
  'medical assistant', 'nursing assistant', 'registered nurse', 'licensed practical nurse',
  'lpn', 'rn ', 'cna ', 'certified nursing', 'nurse practitioner', 'physician', 'surgeon',
  'phlebotomist', 'dental', 'veterinary', 'vet tech', 'pharmacy technician', 'pharmacist',
  'physical therapist', 'occupational therapist', 'speech pathologist', 'radiologist',
  'sonographer', 'x-ray', 'emt ', 'paramedic', 'pathobiology', 'endocrinology',
  'oncology', 'cardiology', 'dermatology', 'anesthesiology', 'psychiatry',
  
  // Office/admin/corporate
  'administrative coordinator', 'administrative assistant', 'office worker', 'office manager',
  'receptionist', 'secretary', 'executive assistant', 'data entry clerk', 'file clerk',
  'office assistant', 'front desk', 'student worker', 'student office',
  
  // Software/IT (not data annotation)
  'software engineer', 'software developer', 'web developer', 'frontend developer',
  'backend developer', 'full stack', 'devops', 'sre ', 'programmer', 'java developer',
  'python developer', '.net developer', 'ios developer', 'android developer',
  'cloud engineer', 'systems administrator', 'network engineer', 'database administrator',
  'cybersecurity', 'it manager', 'it director', 'it specialist',
  
  // Banking/finance processing (not field services)
  'mortgage loan processor', 'loan officer', 'underwriter', 'bank teller', 'financial analyst',
  'accounts payable', 'accounts receivable', 'bookkeeper', 'payroll', 'tax preparer',
  'credit analyst', 'compliance officer', 'loan processor',
  
  // Teaching/education (not proctoring)
  'teacher', 'professor', 'instructor ', 'tutor ', 'teaching assistant', 'school counselor',
  'principal', 'dean ', 'superintendent',
  
  // Retail/food service (not mystery shopping)
  'cashier', 'barista', 'server ', 'bartender', 'host ', 'hostess', 'busser',
  'dishwasher', 'cook ', 'chef ', 'line cook', 'prep cook',
  
  // Management/corporate
  'vice president', 'chief ', 'director of', 'senior manager', 'general manager',
  'regional manager', 'district manager',
  
  // Skilled trades (not our verticals)
  'electrician', 'plumber', 'hvac technician', 'welder', 'machinist', 'cnc ',
  'carpenter', 'roofer', 'painter ', 'glazier',
];

// ============================================
// PER-VERTICAL RELEVANCE KEYWORDS
// Title must contain AT LEAST ONE of these words for the vertical
// This is the primary quality gate
// ============================================
const VERTICAL_MUST_MATCH = {
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
// SEARCH QUERIES — tightened from v1
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
// FILTERING LOGIC
// ============================================
function isBlocklisted(title) {
  const lower = title.toLowerCase();
  return TITLE_BLOCKLIST.some(blocked => lower.includes(blocked.toLowerCase()));
}

function matchesVertical(title, vertical) {
  const mustMatch = VERTICAL_MUST_MATCH[vertical];
  if (!mustMatch) return true; // No filter defined = accept all
  const lower = title.toLowerCase();
  return mustMatch.some(keyword => lower.includes(keyword.toLowerCase()));
}

function filterJob(job, vertical) {
  const title = job.title || '';
  
  // Check blocklist first
  if (isBlocklisted(title)) {
    return { pass: false, reason: `BLOCKLISTED: "${title}"` };
  }
  
  // Check vertical relevance
  if (!matchesVertical(title, vertical)) {
    return { pass: false, reason: `NO_MATCH for ${vertical}: "${title}"` };
  }
  
  return { pass: true, reason: null };
}

// ============================================
// HELPERS
// ============================================
function makeDedup(title, company, location) {
  const raw = `${(title || '').toLowerCase().trim()}|${(company || '').toLowerCase().trim()}|${(location || '').toLowerCase().trim()}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

function extractState(locationAreas) {
  if (Array.isArray(locationAreas) && locationAreas.length >= 2) {
    return locationAreas[1];
  }
  return null;
}

function normalizeSalaryType(min, max) {
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
  
  // Set expiration to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  return {
    title: adzunaJob.title || 'Untitled',
    company: company,
    description: (adzunaJob.description || '').substring(0, 2000),
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
    expires_at: expiresAt.toISOString(),
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
      console.error(`    Adzuna API error: ${resp.status}`);
      return [];
    }
    const data = await resp.json();
    return data.results || [];
  } catch (err) {
    console.error(`    Adzuna fetch error: ${err.message}`);
    return [];
  }
}

async function fetchVertical(vertical, queries) {
  const jobs = [];
  let rejected = 0;
  const rejectedSamples = [];
  
  for (const query of queries) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const results = await fetchAdzunaPage(query, page);
      if (results.length === 0) break;
      
      for (const raw of results) {
        const filterResult = filterJob(raw, vertical);
        if (filterResult.pass) {
          jobs.push(normalizeJob(raw, vertical));
        } else {
          rejected++;
          // Keep first 5 rejected samples per vertical for debugging
          if (rejectedSamples.length < 5) {
            rejectedSamples.push(filterResult.reason);
          }
        }
      }
      
      // Rate limit: 250ms between requests
      await new Promise(r => setTimeout(r, 250));
    }
  }
  
  if (rejected > 0) {
    console.log(`    (${rejected} rejected)`);
    rejectedSamples.forEach(r => console.log(`      - ${r}`));
  }
  
  return jobs;
}

// ============================================
// SUPABASE UPSERT
// ============================================
async function upsertJobs(jobs) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return { inserted: 0, errors: 0 };
  }
  
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
// CLEANUP EXPIRED JOBS
// ============================================
async function cleanupExpired() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return 0;
  
  try {
    // Mark expired jobs as inactive
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
  } catch (err) {
    console.error(`Cleanup error: ${err.message}`);
    return 0;
  }
}

// ============================================
// PURGE EXISTING BAD JOBS (one-time cleanup)
// ============================================
async function purgeBlocklistedJobs() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return 0;
  
  console.log('Checking for blocklisted jobs already in database...');
  
  // Fetch all active job titles
  try {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?is_active=eq.true&select=id,title`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    
    if (!resp.ok) return 0;
    const jobs = await resp.json();
    
    const toDeactivate = jobs.filter(j => isBlocklisted(j.title));
    
    if (toDeactivate.length === 0) {
      console.log('  No blocklisted jobs found in database.');
      return 0;
    }
    
    console.log(`  Found ${toDeactivate.length} blocklisted jobs to deactivate:`);
    toDeactivate.slice(0, 10).forEach(j => console.log(`    - ${j.title}`));
    if (toDeactivate.length > 10) console.log(`    ... and ${toDeactivate.length - 10} more`);
    
    // Deactivate in batches
    let deactivated = 0;
    const ids = toDeactivate.map(j => j.id);
    const batchSize = 50;
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const idList = batch.map(id => `"${id}"`).join(',');
      
      const patchResp = await fetch(
        `${SUPABASE_URL}/rest/v1/jobs?id=in.(${batch.join(',')})`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({ is_active: false }),
        }
      );
      
      if (patchResp.ok) deactivated += batch.length;
    }
    
    console.log(`  Deactivated: ${deactivated}`);
    return deactivated;
  } catch (err) {
    console.error(`Purge error: ${err.message}`);
    return 0;
  }
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('=== NESTED OBJECTS JOB FETCHER v2 ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Source: Adzuna API`);
  console.log(`Verticals: ${VERTICAL_QUERIES.length}`);
  console.log(`Filters: ${TITLE_BLOCKLIST.length} blocklist terms, ${Object.keys(VERTICAL_MUST_MATCH).length} vertical keyword sets`);
  console.log('');
  
  // Step 0: Purge existing bad jobs (safe to run every time — no-ops if clean)
  const purged = await purgeBlocklistedJobs();
  console.log('');
  
  // Step 1: Fetch and filter
  let totalFetched = 0;
  let totalFiltered = 0;
  const allJobs = [];
  
  for (const { vertical, queries } of VERTICAL_QUERIES) {
    process.stdout.write(`  ${vertical}... `);
    const beforeCount = allJobs.length;
    const jobs = await fetchVertical(vertical, queries);
    console.log(`${jobs.length} jobs accepted`);
    allJobs.push(...jobs);
    totalFetched += jobs.length;
  }
  
  // Step 2: Deduplicate
  const seen = new Set();
  const uniqueJobs = allJobs.filter(j => {
    if (seen.has(j.dedup_hash)) return false;
    seen.add(j.dedup_hash);
    return true;
  });
  
  console.log('');
  console.log(`Total accepted: ${totalFetched}`);
  console.log(`After dedup: ${uniqueJobs.length}`);
  console.log(`Duplicates removed: ${totalFetched - uniqueJobs.length}`);
  console.log('');
  
  // Step 3: Upsert to Supabase
  console.log('Upserting to Supabase...');
  const result = await upsertJobs(uniqueJobs);
  console.log(`  Inserted/updated: ${result.inserted}`);
  console.log(`  Errors: ${result.errors}`);
  
  // Step 4: Cleanup expired
  console.log('');
  console.log('Cleaning up expired jobs...');
  const expired = await cleanupExpired();
  console.log(`  Expired jobs deactivated: ${expired}`);
  
  console.log('');
  console.log('=== DONE ===');
  
  return {
    timestamp: new Date().toISOString(),
    version: 'v2',
    purged_blocklisted: purged,
    total_accepted: totalFetched,
    unique_jobs: uniqueJobs.length,
    inserted: result.inserted,
    errors: result.errors,
    expired_cleaned: expired,
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