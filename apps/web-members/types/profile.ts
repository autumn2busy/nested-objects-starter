export type StructuredNotes = {
  bio: string
  phone: string
  linkedin: string
  notes: string
}

export type Profile = {
  id?: string
  user_email: string
  display_name: string | null
  headline: string | null
  city: string | null
  state: string | null
  primary_interest: string | null
  tools: string | null
  notes: string | null
  avatar_url: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ProfileUpdatePayload = {
  display_name?: string | null
  headline?: string | null
  city?: string | null
  state?: string | null
  primary_interest?: string | null
  tools?: string | null
  notes?: string | StructuredNotes | null
  avatar_url?: string | null
  structured_notes?: StructuredNotes
}
