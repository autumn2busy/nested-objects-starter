
export type UUID = string;

export interface User {
  id: UUID;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Firm {
  id: UUID;
  name: string;
  niche?: string;
  website?: string;
  phone?: string;
  email?: string;
  location?: string;
  pay_range?: string;
  requirements?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
}

export interface FirmContact {
  id: UUID;
  firm_id: UUID;
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  created_at: string;
}

export interface Job {
  id: UUID;
  firm_id?: UUID | null;
  title: string;
  location?: string;
  compensation_meta?: Record<string, unknown>;
  apply_url?: string;
  source?: string;
  scraped_at?: string;
  created_at: string;
}

export interface Resource {
  id: UUID;
  title: string;
  type: "guide" | "checklist" | "video" | "template" | string;
  description?: string;
  url?: string;
  access_level: "free" | "pro" | "elite" | "agency" | string;
  created_at: string;
}

export interface UserActivity {
  id: UUID;
  user_id: UUID;
  event: string;
  metadata?: Record<string, unknown>;
  occurred_at: string;
}

export interface Embedding {
  id: UUID;
  content_type: "firm" | "job" | "resource" | string;
  ref_id: UUID;
  embedding: number[]; // returned as number[] in client, stored as vector in DB
  created_at: string;
}

export interface OutsetaUser {
  Uid: string;
  Email: string;
  FirstName: string;
  LastName: string;
  // Add other fields you capture, like 'Phone' or custom properties
}

export interface OutsetaSubscription {
  Uid: string;
  Plan: {
    Uid: string;
    Name: string; // e.g., "Pro ($37)"
  };
  Account: {
    Uid: string;
    Name: string;
    // Our plan uses Outseta as the source of truth for entitlements
    AccountSubscriptionEntitlements: {
      Entitlement: {
        Uid: string;
        Key: string; // This is our feature key, e.g., "ai_job_intel"
      };
    }[];
  };
  // Add other fields like 'Status', 'TrialEndDate', etc.
}

export interface AuthContextType {
  user: OutsetaUser | null;
  subscription: OutsetaSubscription | null;
  isLoading: boolean;
  // This helper function will be used by our <Gate> component
  hasEntitlement: (key: string) => boolean;
}
