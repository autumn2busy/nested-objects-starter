import {
  firmDirectoryDataset,
  jobBoardEntries,
  membershipPlans,
  type FirmDirectoryEntry,
  type JobBoardEntry,
} from '@/lib/ai-datasets'

export type ToolCallArguments = Record<string, unknown>

export type ToolCallHandler = (args: ToolCallArguments) => Promise<unknown> | unknown

function normalizeRole(value?: string) {
  return value?.toLowerCase().trim() ?? ''
}

function normalizeState(value?: string) {
  return value?.toString().trim().toUpperCase() ?? ''
}

function matchesStateFilter(entry: FirmDirectoryEntry, state: string) {
  if (!state) return true
  const states = entry.states?.map((s) => s.toUpperCase()) ?? []
  return states.includes(state) || states.includes('US') || states.includes('ALL')
}

export async function fetch_firms_by_role_and_state(args: ToolCallArguments) {
  const role = normalizeRole(args.role as string | undefined)
  const state = normalizeState(args.state as string | undefined)

  const firms = firmDirectoryDataset
    .filter((firm) => !role || firm.roles.map(normalizeRole).includes(role))
    .filter((firm) => matchesStateFilter(firm, state))
    .map((firm) => ({
      name: firm.name,
      niche: firm.niche,
      pay_range: firm.payRange,
      requirements: firm.requirements,
      coverage: firm.coverage,
      url: firm.url,
      roles: firm.roles,
      states: firm.states ?? ['US'],
    }))

  return { count: firms.length, firms }
}

export async function get_membership_plans() {
  const plans = membershipPlans.map((plan) => ({
    name: plan.name,
    price: plan.price,
    period: plan.period,
    description: plan.description,
    highlight: plan.highlight,
    features: plan.features,
    planUid: plan.planUid,
  }))

  return { plans }
}

export async function list_jobs_by_role(args: ToolCallArguments) {
  const role = normalizeRole(args.role as string | undefined)

  const jobs = jobBoardEntries
    .filter((job) => !role || job.roles.map(normalizeRole).includes(role))
    .map((job: JobBoardEntry) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      pay: job.pay,
      description: job.description,
      link: job.link,
      roles: job.roles,
    }))

  return { count: jobs.length, jobs }
}

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'fetch_firms_by_role_and_state',
      description: 'Return firms that match the requested role and US state (2-letter code).',
      parameters: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            description: 'Role or specialty to match, e.g., inspector, gig-worker, or notary.',
          },
          state: {
            type: 'string',
            description: 'Two-letter US state code or ALL for nationwide coverage.',
          },
        },
        required: ['role', 'state'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_membership_plans',
      description: 'List available Nested Objects membership plans.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_jobs_by_role',
      description: 'Return the current job board entries filtered by a requested role.',
      parameters: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            description: 'Role to filter jobs by, e.g., inspector or gig-worker.',
          },
        },
      },
    },
  },
]

export const toolHandlers: Record<string, ToolCallHandler> = {
  fetch_firms_by_role_and_state,
  get_membership_plans,
  list_jobs_by_role,
}
