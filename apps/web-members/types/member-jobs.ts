export type MemberJobStatus = 'interested' | 'applied' | 'interviewing' | 'offer' | 'closed'

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
