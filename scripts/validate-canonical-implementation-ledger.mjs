import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = process.env.LEDGER_VALIDATION_ROOT
  ? resolve(process.env.LEDGER_VALIDATION_ROOT)
  : resolve(SCRIPT_DIR, '..');
const LEDGER_PATH = 'docs/intelligence-os/issue-318-foundation-execution-ledger.md';
const LEDGER_ABSOLUTE_PATH = resolve(REPOSITORY_ROOT, LEDGER_PATH);
const COMMIT_RESOLUTION_CACHE = new Map();

const ALLOWED_STATUSES = new Set([
  'planned',
  'in_progress',
  'implemented_unverified',
  'validated_local',
  'validated_staging',
  'verified_preview',
  'production_live',
  'blocked',
  'deferred',
  'superseded',
]);

const REQUIRED_MATRIX_COLUMNS = [
  'ID',
  'Workstream',
  'Requirement',
  'Plain-English purpose',
  'Current status',
  'What was implemented',
  'What is still missing',
  'Repository evidence',
  'File paths',
  'Migration names',
  'Test names and results',
  'Branch',
  'Pull request',
  'Commit SHA',
  'Deployment environment',
  'External system involved',
  'Required environment variables',
  'Known risk',
  'Decision required from Autumn',
  'Next action',
  'Owner',
  'Last verified date',
  'Last verified commit',
];

const REQUIRED_HEADINGS = [
  '## Plain-English program truth',
  '### What Nested Objects is trying to accomplish',
  '### What has been implemented in plain English',
  '### What has changed for members',
  '### What has changed behind the scenes',
  '### Which agents are real versus extension contracts',
  '### What is deployed',
  '### What is staging-only',
  '### What is Preview-only',
  '### What is not connected yet',
  '### What still requires Autumn',
  '### The next ten implementation priorities',
  '## Verified repository checkpoint',
  '## Canonical implementation status matrix',
  '## Agent maturity inventory',
  '## Workflow maturity inventory',
  '## Environment and deployment truth',
  '## Historical documents and supersession register',
  '## Append-only decision and change history',
  '### Autumn decisions',
  '### Architecture decisions',
  '### Product decisions',
  '### ActiveCampaign decisions',
  '### Reversed decisions',
  '### Superseded work',
  '### Migrations applied',
  '### Preview verifications',
  '### Production releases',
  '### Known incidents',
  '### Open blockers',
];

const RELEVANT_PATH_PATTERNS = [
  /^apps\/agent-runtime\//,
  /^apps\/web-public\//,
  /^apps\/web-firms\//,
  /^apps\/web-members\/(?:app|components|lib|actions|scripts|tests|content)\//,
  /^apps\/web-members\/docs\//,
  /^apps\/web-members\/(?:IMPLEMENTATION_SUMMARY|CHECKLIST|DEPLOYMENT)\.md$/,
  /^apps\/web-members\/(?:middleware|next\.config)\.(?:js|mjs|ts)$/,
  /^apps\/web-members\/vercel\.json$/,
  /^supabase\//,
  /^infra\/sql\//,
  /^email-templates\//,
  /^scripts\//,
  /^vercel\.json$/,
  /^Activecampaign Integration Guide$/i,
  /^docs\/intelligence-os\//,
  /^docs\/(?:agent-control-plane|auth-login-handoff-hotfix)\.md$/,
  /^\.github\/workflows\//,
  /^\.github\/pull_request_template\.md$/,
  /^AGENTS\.md$/,
  /^apps\/web-members\/.*(?:active[-_]?campaign|outseta|stripe|membership|entitle|pricing|tool|opportun|seo|aeo|cro|conversion|admin|directory|firm|profile|signup|onboard|lifecycle)/i,
];

const PLACEHOLDER_CELL = /(?:^|\b)(?:TBD|TODO|FIXME|lorem ipsum|replace me|fill this)(?:\b|$)/i;
const RAW_EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const RAW_PHONE = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}\b/;
const RAW_MEMBER_IDENTIFIER = /(?:person uid|member (?:id|identifier)|owner subject(?: id)?)\s*[:=]\s*`?[A-Za-z0-9_-]{6,}`?/i;
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bsb_secret_[A-Za-z0-9_-]{16,}\b/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  /\b(?:postgres|postgresql):\/\/[^\s:/]+:[^\s@]+@/i,
  /\bAuthorization\s*:\s*(?:Bearer|Basic)\s+(?!<)[A-Za-z0-9+/_.=-]{20,}/i,
  /(?:SUPABASE_SERVICE_ROLE_KEY|ACTIVE_CAMPAIGN_API_KEY|OPENAI_API_KEY|OUTSETA_API_KEY|STRIPE_SECRET_KEY|GITHUB_TOKEN|VERCEL_TOKEN|PASSWORD)\s*[=:]\s*[^<\s][^\s]*/i,
];

const REQUIRED_PR_BODY_FIELDS = [
  'Task IDs completed or advanced',
  'Canonical ledger section updated',
  'Remaining work recorded in the ledger',
  'Tests actually run and results',
  'Environment actually verified (`local`, `Supabase staging`, `Vercel Preview`, or `Production`)',
  'Checks skipped, unavailable, or blocked',
  'Database write, Production deployment/promotion, external mutation, email, model execution, schedule, or merge approval status',
  'Consequential action actually performed, if any',
  'Approval and rollback evidence',
];

function markdownLinesOutsideFences(text) {
  let insideFence = false;
  const lines = [];
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      insideFence = !insideFence;
      continue;
    }
    if (!insideFence) lines.push(line);
  }
  return lines;
}

function parseTableRow(line) {
  if (!line.trim().startsWith('|') || !line.trim().endsWith('|')) return null;
  return line
    .trim()
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

function commitResolves(commit) {
  if (COMMIT_RESOLUTION_CACHE.has(commit)) return COMMIT_RESOLUTION_CACHE.get(commit);
  let resolves = false;
  try {
    execFileSync('git', ['cat-file', '-e', `${commit}^{commit}`], { cwd: REPOSITORY_ROOT, stdio: 'ignore' });
    resolves = true;
  } catch {
    resolves = false;
  }
  COMMIT_RESOLUTION_CACHE.set(commit, resolves);
  return resolves;
}

function cacheCommitResolutions(commits) {
  const pending = [...new Set(commits)].filter((commit) => !COMMIT_RESOLUTION_CACHE.has(commit));
  if (pending.length === 0) return;
  try {
    const output = execFileSync('git', ['cat-file', '--batch-check=%(objectname) %(objecttype)'], {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
      input: `${pending.map((commit) => `${commit}^{commit}`).join('\n')}\n`,
    });
    const results = output.trimEnd().split(/\r?\n/);
    pending.forEach((commit, index) => {
      COMMIT_RESOLUTION_CACHE.set(commit, /^\S+ commit$/.test(results[index] ?? ''));
    });
  } catch {
    pending.forEach((commit) => COMMIT_RESOLUTION_CACHE.set(commit, false));
  }
}

function extractCanonicalMatrix(text) {
  const startMarker = '<!-- canonical-status-matrix:start -->';
  const endMarker = '<!-- canonical-status-matrix:end -->';
  const sourceLines = markdownLinesOutsideFences(text);
  const starts = sourceLines.flatMap((line, index) => line.trim() === startMarker ? [index] : []);
  const ends = sourceLines.flatMap((line, index) => line.trim() === endMarker ? [index] : []);
  if (starts.length !== 1 || ends.length !== 1 || ends[0] <= starts[0]) {
    return { errors: ['Canonical status matrix must have exactly one ordered marker pair outside code fences.'], rows: [] };
  }

  const lines = sourceLines.slice(starts[0] + 1, ends[0]);
  const tableRows = lines.map(parseTableRow).filter(Boolean);
  if (tableRows.length < 2) {
    return { errors: ['Canonical status matrix has no parseable header and rows.'], rows: [] };
  }

  const [header, separator, ...rows] = tableRows;
  const errors = [];
  if (header.join('\u0000') !== REQUIRED_MATRIX_COLUMNS.join('\u0000')) {
    errors.push(
      `Canonical status matrix columns differ from the required schema. Expected: ${REQUIRED_MATRIX_COLUMNS.join(', ')}`,
    );
  }
  if (!separator?.every((cell) => /^:?-{3,}:?$/.test(cell))) {
    errors.push('Canonical status matrix separator row is invalid.');
  }
  return { errors, rows };
}

function validateCanonicalLedger(text) {
  const errors = [];
  const markdownLines = markdownLinesOutsideFences(text);

  for (const heading of REQUIRED_HEADINGS) {
    const count = markdownLines.filter((line) => line.trim() === heading).length;
    if (count !== 1) errors.push(`Required heading must appear exactly once outside code fences: ${heading}`);
  }

  if (RAW_EMAIL.test(text)) {
    errors.push('Ledger contains a raw email address; record a cohort/domain label or stable non-PII ID instead.');
  }
  if (RAW_PHONE.test(text)) errors.push('Ledger contains a raw phone number; record only aggregate or redacted evidence.');
  if (RAW_MEMBER_IDENTIFIER.test(text)) {
    errors.push('Ledger contains a raw member or owner identifier; use a redacted role label instead.');
  }
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) errors.push(`Ledger matches prohibited secret pattern: ${pattern}`);
  }

  const matrix = extractCanonicalMatrix(text);
  errors.push(...matrix.errors);
  if (matrix.rows.length < 45) {
    errors.push(`Canonical status matrix has ${matrix.rows.length} items; at least 45 substantive items are required.`);
  }

  const ids = new Set();
  cacheCommitResolutions(
    matrix.rows.flatMap((row) => row[13]?.match(/\b[0-9a-f]{7,40}\b/gi) ?? []),
  );
  for (const [rowIndex, row] of matrix.rows.entries()) {
    const displayRow = rowIndex + 1;
    if (row.length !== REQUIRED_MATRIX_COLUMNS.length) {
      errors.push(`Matrix row ${displayRow} has ${row.length} columns; expected ${REQUIRED_MATRIX_COLUMNS.length}.`);
      continue;
    }
    const record = Object.fromEntries(REQUIRED_MATRIX_COLUMNS.map((column, index) => [column, row[index]]));
    const id = record.ID.replaceAll('`', '');
    const status = record['Current status'].replaceAll('`', '');

    if (!/^[A-Z][A-Z0-9]*-\d{3}$/.test(id)) errors.push(`Matrix row ${displayRow} has invalid stable ID: ${id}`);
    if (ids.has(id)) errors.push(`Duplicate canonical task ID: ${id}`);
    ids.add(id);

    if (!ALLOWED_STATUSES.has(status)) errors.push(`Task ${id} uses disallowed status: ${status}`);
    for (const column of REQUIRED_MATRIX_COLUMNS) {
      const value = record[column];
      if (!value || value === '-' || PLACEHOLDER_CELL.test(value)) {
        errors.push(`Task ${id} has an empty or placeholder value in ${column}.`);
      }
    }

    if (!['planned', 'blocked', 'deferred', 'superseded'].includes(status)) {
      if (!record['Repository evidence'].includes('`') && !record['Repository evidence'].includes('#')) {
        errors.push(`Task ${id} has an implementation status without concrete repository evidence.`);
      }
      if (!/[\\/]/.test(record['File paths'])) {
        errors.push(`Task ${id} has an implementation status without a repository file path.`);
      }
      const repositoryPaths = [...record['File paths'].matchAll(/`([^`]+[\\/][^`]*)`/g)]
        .map((match) => match[1].replaceAll('\\', '/'))
        .filter((candidate) => !candidate.includes('*'));
      const hasExistingPath = repositoryPaths.some((candidate) => {
        const absolute = resolve(REPOSITORY_ROOT, candidate);
        const withinRepository = !relative(REPOSITORY_ROOT, absolute).startsWith('..');
        return withinRepository && existsSync(absolute);
      });
      if (!hasExistingPath) errors.push(`Task ${id} has no existing repository path in File paths.`);

      const commitCandidates = record['Commit SHA'].match(/\b[0-9a-f]{7,40}\b/gi) ?? [];
      const hasResolvableCommit = commitCandidates.some(commitResolves);
      if (!hasResolvableCommit) errors.push(`Task ${id} has no commit SHA that resolves in this repository.`);
    }

    if (['validated_local', 'validated_staging', 'verified_preview', 'production_live'].includes(status)) {
      if (!/pass|verified|validated/i.test(record['Test names and results'])) {
        errors.push(`Task ${id} claims ${status} without a passed or verified test result.`);
      }
    }
    if (status === 'validated_staging' && !/staging/i.test(record['Deployment environment'])) {
      errors.push(`Task ${id} claims validated_staging without a staging environment.`);
    }
    if (status === 'verified_preview' && !/preview/i.test(record['Deployment environment'])) {
      errors.push(`Task ${id} claims verified_preview without a Preview environment.`);
    }
    if (status === 'production_live') {
      if (!/production/i.test(record['Deployment environment'])) {
        errors.push(`Task ${id} claims production_live without a Production environment.`);
      }
      if (!/#\d+/.test(record['Pull request']) || !/\b[0-9a-f]{7,40}\b/i.test(record['Commit SHA'])) {
        errors.push(`Task ${id} claims production_live without a pull request and commit SHA.`);
      }
    }
  }

  return errors;
}

function getChangedFiles(baseRef) {
  const output = execFileSync('git', ['diff', '--name-only', `${baseRef}...HEAD`], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
  });
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function validatePullRequestContract(baseRef, ledgerText) {
  const errors = [];
  const changedFiles = getChangedFiles(baseRef);
  const relevantChanges = changedFiles.filter((file) => RELEVANT_PATH_PATTERNS.some((pattern) => pattern.test(file)));
  if (relevantChanges.length === 0) return errors;
  if (!changedFiles.includes(LEDGER_PATH)) {
    errors.push(`Issue #318-related changes require ${LEDGER_PATH} in the same pull request.`);
    return errors;
  }

  const ledgerDiff = execFileSync('git', ['diff', '--unified=0', `${baseRef}...HEAD`, '--', LEDGER_PATH], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
  });
  const substantiveAddedText = ledgerDiff
    .split(/\r?\n/)
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1).trim())
    .filter((line) => line && !/^\|?(?:\s*:?-{3,}:?\s*\|)+$/.test(line) && !line.startsWith('<!--'))
    .join('\n');

  const addedMatrixRows = ledgerDiff
    .split(/\r?\n/)
    .filter((line) => /^\+\| [A-Z][A-Z0-9]*-\d{3} \|/.test(line));
  if (substantiveAddedText.length < 120 || addedMatrixRows.length === 0) {
    errors.push('Canonical ledger update is empty or placeholder-only; add at least one substantive task-ID matrix row change.');
  }
  errors.push(...validateCanonicalLedger(ledgerText));
  return errors;
}

function validatePullRequestBody(body) {
  const errors = [];
  for (const field of REQUIRED_PR_BODY_FIELDS) {
    const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`^- ${escaped}:[ \\t]*([^\\r\\n]+)$`, 'm').exec(body);
    if (!match || match[1].trim().length < 3 || PLACEHOLDER_CELL.test(match[1])) {
      errors.push(`Pull request body must complete: ${field}`);
    }
  }
  const taskField = /^- Task IDs completed or advanced:[ \t]*([^\r\n]+)$/m.exec(body)?.[1] ?? '';
  if (!/[A-Z][A-Z0-9]*-\d{3}/.test(taskField)) {
    errors.push('Pull request body must name at least one stable task ID.');
  }
  return errors;
}

function runSelfTest(validText) {
  const failures = [];
  if (validateCanonicalLedger(validText).length !== 0) failures.push('Current ledger must validate before self-tests run.');

  const matrix = extractCanonicalMatrix(validText);
  const firstRow = matrix.rows[0];
  const firstRowText = firstRow ? `| ${firstRow.join(' | ')} |` : '';
  const invalidStatusRow = firstRow ? [...firstRow] : [];
  if (invalidStatusRow.length > 4) invalidStatusRow[4] = 'complete';
  const invalidStatusText = firstRow
    ? validText.replace(firstRowText, `| ${invalidStatusRow.join(' | ')} |`)
    : validText;

  const cases = [
    ['disallowed status', invalidStatusText, /disallowed status/],
    ['raw email', validText.replace('## Plain-English program truth', '## Plain-English program truth\ncontact@example.com'), /raw email/],
    ['raw phone', validText.replace('## Plain-English program truth', '## Plain-English program truth\n(404) 555-0199'), /raw phone/],
    ['raw member identifier', validText.replace('## Plain-English program truth', '## Plain-English program truth\nPerson UID: `ABC12345`'), /raw member or owner identifier/],
    ['missing heading', validText.replace('### What is deployed', '### Deployment summary'), /Required heading/],
    ['duplicate matrix markers', validText.replace('<!-- canonical-status-matrix:start -->', '<!-- canonical-status-matrix:start -->\n<!-- canonical-status-matrix:start -->'), /exactly one ordered marker pair/],
  ];
  for (const [name, candidate, expected] of cases) {
    const messages = validateCanonicalLedger(candidate).join('\n');
    if (!expected.test(messages)) failures.push(`Self-test did not reject ${name}.`);
  }

  if (matrix.rows.length > 0) {
    const rowText = `| ${matrix.rows[0].join(' | ')} |`;
    const duplicate = validText.replace('<!-- canonical-status-matrix:end -->', `${rowText}\n<!-- canonical-status-matrix:end -->`);
    if (!/Duplicate canonical task ID/.test(validateCanonicalLedger(duplicate).join('\n'))) {
      failures.push('Self-test did not reject a duplicate task ID.');
    }
  }

  const validPullRequestBody = REQUIRED_PR_BODY_FIELDS
    .map((field) => `- ${field}: Verified evidence for GOV-001 and GOV-002.`)
    .join('\n');
  if (validatePullRequestBody(validPullRequestBody).length !== 0) {
    failures.push('Self-test rejected a complete pull-request body.');
  }
  const incompletePullRequestBody = validPullRequestBody.replace(
    '- Tests actually run and results: Verified evidence for GOV-001 and GOV-002.',
    '- Tests actually run and results:',
  );
  if (!/Tests actually run and results/.test(validatePullRequestBody(incompletePullRequestBody).join('\n'))) {
    failures.push('Self-test did not reject an incomplete pull-request body.');
  }

  if (failures.length > 0) throw new Error(failures.join('\n'));
  console.log('Canonical implementation ledger self-tests passed.');
}

const args = process.argv.slice(2);
if (!existsSync(LEDGER_ABSOLUTE_PATH)) throw new Error(`Missing canonical ledger: ${LEDGER_PATH}`);
const ledgerText = readFileSync(LEDGER_ABSOLUTE_PATH, 'utf8');
if (args.includes('--self-test')) {
  runSelfTest(ledgerText);
  process.exit(0);
}

const baseIndex = args.indexOf('--base');
const baseRef = baseIndex >= 0 ? args[baseIndex + 1] : null;
if (baseIndex >= 0 && !baseRef) throw new Error('--base requires a Git ref.');

const eventIndex = args.indexOf('--github-event');
const eventPath = eventIndex >= 0 ? args[eventIndex + 1] : null;
if (eventIndex >= 0 && !eventPath) throw new Error('--github-event requires a JSON file path.');
if (eventPath) {
  if (baseRef) {
    const relevantChanges = getChangedFiles(baseRef)
      .filter((file) => RELEVANT_PATH_PATTERNS.some((pattern) => pattern.test(file)));
    if (relevantChanges.length === 0) {
      console.log('Pull request body validation skipped: no governed files changed.');
      process.exit(0);
    }
  }
  const event = JSON.parse(readFileSync(resolve(eventPath), 'utf8'));
  const body = event.pull_request?.body ?? '';
  const bodyErrors = validatePullRequestBody(body);
  if (bodyErrors.length > 0) {
    console.error(`Pull request body validation failed (${bodyErrors.length}):`);
    for (const error of bodyErrors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log('Pull request body validation passed.');
  process.exit(0);
}

const errors = baseRef
  ? validatePullRequestContract(baseRef, ledgerText)
  : validateCanonicalLedger(ledgerText);

if (errors.length > 0) {
  console.error(`Canonical implementation ledger validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Canonical implementation ledger validation passed (${LEDGER_PATH}).`);
