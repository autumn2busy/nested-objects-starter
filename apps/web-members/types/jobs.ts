export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'invoiced' | 'paid' | 'cancelled'
export type PayoutStatus = 'unpaid' | 'partial' | 'paid'

export interface Job {
  id: string
  user_id: string
  firm_id: string | null
  title: string | null
  firm_name: string | null
  region: string | null
  address: string | null
  appointment_date: string | null
  appointment_time: string | null
  status: JobStatus
  payout: number | null
  payout_status: PayoutStatus
  mileage: number | null
  sla_target_hours: number | null
  notes: string | null
  created_at: string
  updated_at: string
}
