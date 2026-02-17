// ============================================================================
// Member Job Tracker Types
// Feature: "My Pipeline" - saved jobs from the job board
// Location: /jobs page
// ============================================================================

/**
 * Pipeline status for saved jobs
 * Matches the member_job_status enum in Supabase
 */
export type MemberJobStatus =
  | 'interested'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

/**
 * Database row shape for member_job_tracker table
 */
export interface MemberJob {
  id: string
  user_id: string
  job_id: string | null
  source_url: string | null
  title: string | null
  company: string | null
  location: string | null
  pay: string | null
  status: MemberJobStatus
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload for creating a new pipeline entry
 * POST /api/member-jobs
 */
export interface MemberJobCreatePayload {
  job_id?: string | null
  source_url?: string | null
  title?: string | null
  company?: string | null
  location?: string | null
  pay?: string | null
  status?: MemberJobStatus
  notes?: string | null
}

/**
 * Payload for updating a pipeline entry
 * PATCH /api/member-jobs/[id]
 */
export interface MemberJobUpdatePayload {
  job_id?: string | null
  source_url?: string | null
  title?: string | null
  company?: string | null
  location?: string | null
  pay?: string | null
  status?: MemberJobStatus
  notes?: string | null
}

/**
 * Response shape from GET /api/member-jobs
 */
export interface MemberJobsResponse {
  jobs: MemberJob[]
}

/**
 * Status filter options for the pipeline UI
 */
export const MEMBER_JOB_STATUS_OPTIONS: { value: MemberJobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'interested', label: 'Interested' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

/**
 * Status colors for UI badges/chips
 */
export const MEMBER_JOB_STATUS_COLORS: Record<MemberJobStatus, string> = {
  interested: 'bg-blue-100 text-blue-800',
  applied: 'bg-yellow-100 text-yellow-800',
  interviewing: 'bg-purple-100 text-purple-800',
  offer: 'bg-green-100 text-green-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
}