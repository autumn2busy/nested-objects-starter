'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User, Mail, Phone, MapPin, Briefcase, Shield, Award,
  CheckCircle2, XCircle, Clock, ChevronRight, ExternalLink,
  Camera, Save, Loader2, AlertCircle, Star, TrendingUp,
  GraduationCap, FileCheck, Calendar, Activity
} from 'lucide-react'

import { useAuth } from '@/components/auth-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Gate } from '@/components/Gate'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

// --- Types ---

type ProfileData = {
  id: string
  user_email: string
  full_name: string | null
  display_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  headline: string | null
  bio: string | null
  city: string | null
  state: string | null
  service_areas: string[] | null
  primary_services: string | null
  experience_level: string | null
  tools_used: string[] | null
  preferred_job_types: string[] | null
  max_travel_distance: number | null
  // Trust score fields
  trust_score: number
  trust_tier: string
  trust_score_breakdown: {
    background_check?: number
    background?: number
    training?: number
    profile_completeness?: number
    profile?: number
    identity?: number
    tenure?: number
    inspections?: number
    activity?: number
  } | null
  background_check_status: string
  background_check_verified_at: string | null
  shield_id: string | null
  shield_ic_rating: string | null
  training_modules_completed: number
  training_modules_total: number
  inspections_completed: number
  certifications: { name: string; verified: boolean; uploaded_at: string }[] | null
  identity_verified: boolean
  phone_verified: boolean
  email_verified: boolean
  verified_at: string | null
  created_at: string
  is_published: boolean
  subscription_tier: string | null
  subscription_status: string | null
  rating: number | null
  rating_count: number | null
}

type DashboardTrustSnapshot = {
  trustScore: number
  trustTier: string
  trustScoreBreakdown: ProfileData['trust_score_breakdown']
  backgroundCheckStatus: string
}

const US_STATES = [
  { code: '', label: 'Select state' },
  { code: 'AL', label: 'Alabama' },
  { code: 'AK', label: 'Alaska' },
  { code: 'AZ', label: 'Arizona' },
  { code: 'AR', label: 'Arkansas' },
  { code: 'CA', label: 'California' },
  { code: 'CO', label: 'Colorado' },
  { code: 'CT', label: 'Connecticut' },
  { code: 'DE', label: 'Delaware' },
  { code: 'FL', label: 'Florida' },
  { code: 'GA', label: 'Georgia' },
  { code: 'HI', label: 'Hawaii' },
  { code: 'ID', label: 'Idaho' },
  { code: 'IL', label: 'Illinois' },
  { code: 'IN', label: 'Indiana' },
  { code: 'IA', label: 'Iowa' },
  { code: 'KS', label: 'Kansas' },
  { code: 'KY', label: 'Kentucky' },
  { code: 'LA', label: 'Louisiana' },
  { code: 'ME', label: 'Maine' },
  { code: 'MD', label: 'Maryland' },
  { code: 'MA', label: 'Massachusetts' },
  { code: 'MI', label: 'Michigan' },
  { code: 'MN', label: 'Minnesota' },
  { code: 'MS', label: 'Mississippi' },
  { code: 'MO', label: 'Missouri' },
  { code: 'MT', label: 'Montana' },
  { code: 'NE', label: 'Nebraska' },
  { code: 'NV', label: 'Nevada' },
  { code: 'NH', label: 'New Hampshire' },
  { code: 'NJ', label: 'New Jersey' },
  { code: 'NM', label: 'New Mexico' },
  { code: 'NY', label: 'New York' },
  { code: 'NC', label: 'North Carolina' },
  { code: 'ND', label: 'North Dakota' },
  { code: 'OH', label: 'Ohio' },
  { code: 'OK', label: 'Oklahoma' },
  { code: 'OR', label: 'Oregon' },
  { code: 'PA', label: 'Pennsylvania' },
  { code: 'RI', label: 'Rhode Island' },
  { code: 'SC', label: 'South Carolina' },
  { code: 'SD', label: 'South Dakota' },
  { code: 'TN', label: 'Tennessee' },
  { code: 'TX', label: 'Texas' },
  { code: 'UT', label: 'Utah' },
  { code: 'VT', label: 'Vermont' },
  { code: 'VA', label: 'Virginia' },
  { code: 'WA', label: 'Washington' },
  { code: 'WV', label: 'West Virginia' },
  { code: 'WI', label: 'Wisconsin' },
  { code: 'WY', label: 'Wyoming' },
]

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Select experience level' },
  { value: 'new', label: 'New (0-1 years)' },
  { value: 'intermediate', label: 'Intermediate (1-3 years)' },
  { value: 'experienced', label: 'Experienced (3-5 years)' },
  { value: 'expert', label: 'Expert (5+ years)' },
]

const SERVICE_TYPES = [
  'Property Inspections',
  'Occupancy Verification',
  'Loss Draft Inspections',
  'REO/Foreclosure',
  'Insurance Claims',
  'Notary Services',
  'Appraisals',
  'Property Preservation',
  'Door Knocks',
  'Skip Tracing',
]

// --- Helper Components ---

function TrustScoreBadge({ score, tier }: { score: number; tier: string }) {
  const tierColors = {
    platinum: 'from-slate-400 to-slate-600 text-white',
    gold: 'from-yellow-400 to-yellow-600 text-white',
    silver: 'from-gray-300 to-gray-500 text-white',
    bronze: 'from-orange-300 to-orange-500 text-white',
  }

  const tierColor = tierColors[tier as keyof typeof tierColors] || tierColors.bronze

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${tierColor} font-bold shadow-lg`}>
      <Shield className="w-5 h-5" />
      <span className="text-lg">{score}</span>
      <span className="text-sm uppercase tracking-wide">{tier}</span>
    </div>
  )
}

function TrustScoreBreakdown({ breakdown, total }: { breakdown: ProfileData['trust_score_breakdown']; total: number }) {
  if (!breakdown) return null

  const items = [
    { key: 'background', label: 'Background Check', max: 25, icon: Shield, altKey: 'background_check' },
    { key: 'training', label: 'Training', max: 40, icon: GraduationCap, altKey: null },
    { key: 'profile', label: 'Profile', max: 20, icon: User, altKey: 'profile_completeness' },
    { key: 'identity', label: 'Identity', max: 15, icon: FileCheck, altKey: null },
    { key: 'tenure', label: 'Tenure', max: 10, icon: Calendar, altKey: null },
    { key: 'inspections', label: 'Inspections', max: 10, icon: Activity, altKey: null },
  ]

  return (
    <div className="space-y-3">
      {items.map(item => {
        const value = breakdown[item.key as keyof typeof breakdown]
          || (item.altKey ? breakdown[item.altKey as keyof typeof breakdown] : 0)
          || 0
        const pct = (value / item.max) * 100
        const Icon = item.icon

        return (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              <span className="font-semibold text-slate-900">{value}/{item.max}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-copper to-brand-teal transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VerificationStatus({ verified, label }: { verified: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {verified ? (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      ) : (
        <XCircle className="w-4 h-4 text-slate-300" />
      )}
      <span className={verified ? 'text-green-700' : 'text-slate-500'}>{label}</span>
    </div>
  )
}

function BackgroundCheckStatus({ status }: { status: string }) {
  const statusConfig = {
    verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Verified' },
    pending_verification: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Verification' },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Resubmit Required' },
    failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Failed' },
    not_started: { color: 'bg-slate-100 text-slate-600', icon: AlertCircle, label: 'Not Started' },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </div>
  )
}

function BackgroundCheckFlow({
  status,
  shieldId,
  verifiedAt,
  onStatusUpdate
}: {
  status: string
  shieldId?: string | null
  verifiedAt?: string | null
  onStatusUpdate: (newStatus: string) => void
}) {
  const [inputValue, setInputValue] = useState(shieldId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async () => {
    if (!inputValue.trim()) return
    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/background-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shield_id: inputValue.trim() })
      })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        onStatusUpdate('pending_verification')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Verified state
  if (status === 'verified') {
    return (
      <div className="mt-4 space-y-3">
        {shieldId && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
            <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">ShieldID: {shieldId}</p>
              {verifiedAt && (
                <p className="text-xs text-green-600">Verified on {new Date(verifiedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}
        <p className="text-xs text-slate-500">
          +25 Trust Score points applied. Your verified status is visible to firms.
        </p>
      </div>
    )
  }

  // Pending verification
  if (status === 'pending_verification' || status === 'pending') {
    return (
      <div className="mt-4 space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800 font-medium">ShieldID submitted: {shieldId || inputValue}</p>
          <p className="text-xs text-amber-700 mt-1">
            Our team will verify your ABC# within 1-2 business days. You&apos;ll see your Trust Score update once verified.
          </p>
        </div>
      </div>
    )
  }

  // Rejected — allow resubmission
  if (status === 'rejected') {
    return (
      <div className="mt-4 space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">Your ShieldID could not be verified. Please double-check and resubmit.</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            placeholder="e.g. TX750781032"
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={isSubmitting || !inputValue.trim()} size="sm">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resubmit'}
          </Button>
        </div>
      </div>
    )
  }

  // Not started — full CTA
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-700 font-medium mb-2">Why you need this:</p>
        <ul className="text-xs text-slate-600 space-y-1">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            Required by all mortgage field service firms
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            +25 Trust Score points when verified
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            One check works across all firms (buy once, use everywhere)
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            $90 for 2 years ($45/yr) — required industry standard
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-slate-700 font-medium">Step 1: Get your ShieldID</p>
        <a
          href="https://www.shieldhub.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition w-full justify-center"
        >
          Go to ShieldHub <ExternalLink className="w-4 h-4" />
        </a>
        <p className="text-xs text-slate-500">
          Complete the background check on ShieldHub. Takes 5-7 business days.
        </p>
      </div>

      <div className="space-y-3 pt-2 border-t border-slate-200">
        <p className="text-sm text-slate-700 font-medium">Step 2: Enter your ShieldID / ABC#</p>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            placeholder="e.g. TX750781032"
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={isSubmitting || !inputValue.trim()} size="sm">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
          </Button>
        </div>
        {message && (
          <p className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}

function ManualVerificationForm({ 
  type, 
  onSuccess 
}: { 
  type: 'phone' | 'identity', 
  onSuccess: (trustData?: { trustScore: number; trustTier: string; trustScoreBreakdown: ProfileData['trust_score_breakdown'] }) => void 
}) {
  const [value, setValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async () => {
    if (!value.trim()) return
    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/profile/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: value.trim() })
      })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setTimeout(() => onSuccess(
          data.trustScore !== undefined ? {
            trustScore: data.trustScore,
            trustTier: data.trustTier,
            trustScoreBreakdown: data.trustScoreBreakdown,
          } : undefined
        ), 1500)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-3 space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <p className="text-xs font-semibold text-slate-700 capitalize">Verify {type}</p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          placeholder={type === 'phone' ? 'e.g. +1 555-0123' : 'e.g. Driver License #'}
          className="flex-1 h-9 text-sm"
        />
        <Button onClick={handleSubmit} disabled={isSubmitting || !value.trim()} size="sm" className="h-9">
          {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify'}
        </Button>
      </div>
      {message && (
        <p className={`text-[10px] ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}

// --- Main Component ---

export default function ProfileView({ initialProfile, initialTrustStats }: { initialProfile: any; initialTrustStats: any }) {
  const { user, isLoading: authLoading, isAuthenticated, profileAvatarUrl, planUid } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(initialProfile || null)
  const [isLoading, setIsLoading] = useState(!initialProfile)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dashboardTrustSnapshot, setDashboardTrustSnapshot] = useState<DashboardTrustSnapshot | null>(initialTrustStats || null)

  // Editable form state
  const [formData, setFormData] = useState({
    headline: initialProfile?.headline || '',
    bio: initialProfile?.bio || '',
    city: initialProfile?.city || '',
    state: initialProfile?.state || '',
    primary_services: initialProfile?.primary_services || '',
    experience_level: initialProfile?.experience_level || '',
    service_areas: (initialProfile?.service_areas || []) as string[],
    max_travel_distance: initialProfile?.max_travel_distance?.toString() || '',
    is_published: initialProfile?.is_published || false,
  })

  // Set isLoading to false if auth resolves but no initial profile exists (meaning they need to save one).
  useEffect(() => {
    if (!authLoading && !isLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);

  // Fetch trust data and profile are now managed strictly on the Server (page.tsx) to prevent hydration lag and client waterfalls.

  // Save profile
  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: formData.headline || null,
          bio: formData.bio || null,
          city: formData.city || null,
          state: formData.state || null,
          primary_services: formData.primary_services || null,
          experience_level: formData.experience_level || null,
          service_areas: formData.service_areas.length > 0 ? formData.service_areas : null,
          max_travel_distance: formData.max_travel_distance ? parseInt(formData.max_travel_distance) : null,
          is_published: formData.is_published,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save profile')
      }

      const data = await res.json()
      setProfile(data.profile)
      setSuccess('Profile saved successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Unable to save your profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle service area
  const toggleServiceArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas.includes(area)
        ? prev.service_areas.filter(a => a !== area)
        : [...prev.service_areas, area]
    }))
  }

  // Open Outseta profile modal
  const openOutsetaProfile = () => {
    if (typeof window !== 'undefined' && (window as any).Outseta?.profile?.open) {
      (window as any).Outseta.profile.open()
    }
  }

  // Computed values
  const displayName = profile?.display_name || profile?.full_name || profile?.first_name || 'Member'
  const email = profile?.email || profile?.user_email || user?.email || ''
  const phone = profile?.phone || ''
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''
  const trustScore = dashboardTrustSnapshot?.trustScore ?? profile?.trust_score ?? 0
  const trustTier = dashboardTrustSnapshot?.trustTier ?? profile?.trust_tier ?? 'bronze'
  const trustScoreBreakdown = dashboardTrustSnapshot?.trustScoreBreakdown ?? profile?.trust_score_breakdown ?? null
  const backgroundCheckStatus = dashboardTrustSnapshot?.backgroundCheckStatus ?? profile?.background_check_status ?? 'not_started'

  if (authLoading || isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
        </div>
      </main>
    )
  }

  return (
    <Gate feature="directory_access">
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/inspector-dashboard" className="hover:text-brand-copper">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Profile</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Your Vendor Profile</h1>
          <p className="text-slate-600 mt-1">Manage your profile, track your trust score, and showcase your qualifications.</p>
        </header>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Profile Card & Trust Score */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="p-6 border-slate-200">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="mb-4">
                  <AvatarUpload size="lg" />
                </div>

                <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                {formData.headline && (
                  <p className="text-slate-600 mt-1">{formData.headline}</p>
                )}

                {/* Location */}
                {(formData.city || formData.state) && (
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-2">
                    <MapPin className="w-4 h-4" />
                    {[formData.city, formData.state].filter(Boolean).join(', ')}
                  </div>
                )}

                {/* Member Since */}
                {memberSince && (
                  <p className="text-xs text-slate-400 mt-2">Member since {memberSince}</p>
                )}

                {/* Trust Score Badge */}
                {profile && (
                  <div className="mt-4">
                    <TrustScoreBadge
                      score={trustScore}
                      tier={trustTier}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Trust Score Breakdown */}
            <Card className="p-6 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-copper" />
                Trust Score Breakdown
              </h3>

              {trustScoreBreakdown ? (
                <TrustScoreBreakdown
                  breakdown={trustScoreBreakdown}
                  total={trustScore}
                />
              ) : (
                <p className="text-sm text-slate-500">Complete your profile to build your trust score.</p>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <VerificationStatus verified={profile?.email_verified || false} label="Email verified" />
                
                <div className="space-y-1">
                  <VerificationStatus verified={profile?.phone_verified || false} label="Phone verified" />
                  {!profile?.phone_verified && (
                    <ManualVerificationForm 
                      type="phone" 
                      onSuccess={(trustData) => {
                        if (profile) setProfile({ ...profile, phone_verified: true })
                        if (trustData) {
                          setDashboardTrustSnapshot(prev => ({
                            ...(prev || { backgroundCheckStatus: 'not_started' }),
                            trustScore: trustData.trustScore,
                            trustTier: trustData.trustTier,
                            trustScoreBreakdown: trustData.trustScoreBreakdown,
                          }))
                        }
                      }} 
                    />
                  )}
                </div>

                <VerificationStatus verified={!!profile?.avatar_url || !!profileAvatarUrl} label="Profile photo" />
                
                <div className="space-y-1">
                  <VerificationStatus verified={profile?.identity_verified || false} label="Identity verified" />
                  {!profile?.identity_verified && (
                    <ManualVerificationForm 
                      type="identity" 
                      onSuccess={(trustData) => {
                        if (profile) setProfile({ ...profile, identity_verified: true })
                        if (trustData) {
                          setDashboardTrustSnapshot(prev => ({
                            ...(prev || { backgroundCheckStatus: 'not_started' }),
                            trustScore: trustData.trustScore,
                            trustTier: trustData.trustTier,
                            trustScoreBreakdown: trustData.trustScoreBreakdown,
                          }))
                        }
                      }} 
                    />
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Increase your Trust Score by verifying your phone and email.
                  <button onClick={openOutsetaProfile} className="text-brand-copper hover:underline font-semibold ml-1">
                    Manage in Account Settings
                  </button>
                </p>
              </div>
            </Card>

            {/* Background Check */}
            <Card className="p-6 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-copper" />
                Background Check
              </h3>

              <BackgroundCheckStatus status={backgroundCheckStatus} />

              <BackgroundCheckFlow
                status={backgroundCheckStatus}
                shieldId={profile?.shield_id}
                verifiedAt={profile?.background_check_verified_at}
                onStatusUpdate={(newStatus) => {
                  if (profile) {
                    setProfile({ ...profile, background_check_status: newStatus })
                  }
                  setDashboardTrustSnapshot((prev) => prev ? { ...prev, backgroundCheckStatus: newStatus } : prev)
                }}
              />
            </Card>
          </div>

          {/* Right Column - Editable Fields */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile Visibility */}
            <Card className="p-6 border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-copper" />
                    Profile Visibility
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Turn this on to publish your profile. When published, hiring firms can discover you in the directory and view your qualifications.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${formData.is_published ? 'text-green-600' : 'text-slate-500'}`}>
                    {formData.is_published ? 'Published' : 'Hidden'}
                  </span>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                  />
                </div>
              </div>
            </Card>

            {/* Account Info (Read-only, Outseta managed) */}
            <Card className="p-6 border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-copper" />
                  Account Information
                </h3>
                <button
                  onClick={openOutsetaProfile}
                  className="text-sm text-brand-copper hover:text-brand-copperDark flex items-center gap-1"
                >
                  Edit account <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</label>
                  <p className="text-slate-900 mt-1">{displayName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                  <p className="text-slate-900 mt-1 flex items-center gap-2">
                    {email}
                    {profile?.email_verified && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</label>
                  <p className="text-slate-900 mt-1">{phone || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Subscription</label>
                  <p className="text-slate-900 mt-1 capitalize">{(() => {
                    const planNames: Record<string, string> = {
                      'L9nbKV9Z': 'Starter',
                      'zWZD0rQp': 'Directory Pass',
                      'rQVqlLm6': 'Pro',
                      'NmdnNO90': 'Elite',
                      'rmk5Xk9g': 'Agency',
                    }
                    if (planUid && planNames[planUid]) return `${planNames[planUid]} Plan`
                    if (profile?.subscription_tier) return `${profile.subscription_tier} Plan`
                    return 'Free Plan'
                  })()}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-4">
                Name, email, phone, and billing are managed in your account settings.
              </p>
            </Card>

            {/* Vendor Profile (Editable) */}
            <Card className="p-6 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-copper" />
                Vendor Profile
              </h3>

              <div className="space-y-4">
                {/* Headline */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                    Professional Headline
                  </label>
                  <Input
                    placeholder="e.g. Certified Property Inspector | 5+ Years Experience"
                    value={formData.headline}
                    onChange={e => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                    maxLength={120}
                  />
                  <p className="text-xs text-slate-400 mt-1">{formData.headline.length}/120 characters</p>
                </div>

                {/* Bio */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                    Bio
                  </label>
                  <textarea
                    placeholder="Tell firms about your experience, certifications, and what makes you reliable..."
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    maxLength={500}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-copper focus:outline-none focus:ring-1 focus:ring-brand-copper"
                  />
                  <p className="text-xs text-slate-400 mt-1">{formData.bio.length}/500 characters</p>
                </div>

                {/* Location */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                      City
                    </label>
                    <Input
                      placeholder="e.g. Atlanta"
                      value={formData.city}
                      onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                      State
                    </label>
                    <Select
                      value={formData.state}
                      onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full"
                    >
                      {US_STATES.map(s => (
                        <option key={s.code} value={s.code}>{s.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                    Experience Level
                  </label>
                  <Select
                    value={formData.experience_level}
                    onChange={e => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                    className="w-full"
                  >
                    {EXPERIENCE_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </Select>
                </div>

                {/* Primary Services */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                    Primary Services
                  </label>
                  <Input
                    placeholder="e.g. Property Inspections, Occupancy Verification"
                    value={formData.primary_services}
                    onChange={e => setFormData(prev => ({ ...prev, primary_services: e.target.value }))}
                  />
                </div>

                {/* Service Areas (Checkboxes) */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                    Service Types You Offer
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_TYPES.map(service => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleServiceArea(service)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${formData.service_areas.includes(service)
                          ? 'bg-brand-copper text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Travel Distance */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                    Max Travel Distance (miles)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 50"
                    value={formData.max_travel_distance}
                    onChange={e => setFormData(prev => ({ ...prev, max_travel_distance: e.target.value }))}
                    min={0}
                    max={500}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Training Progress */}
            <Card className="p-6 border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-brand-copper" />
                  Training Progress
                </h3>
                <Link href="/challenges" className="text-sm text-brand-copper hover:text-brand-copperDark">
                  View courses →
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Modules completed</span>
                  <span className="font-semibold text-slate-900">
                    {profile?.training_modules_completed || 0} / {profile?.training_modules_total || 8}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-copper to-brand-teal transition-all"
                    style={{
                      width: `${((profile?.training_modules_completed || 0) / (profile?.training_modules_total || 8)) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Complete training modules to increase your trust score and unlock more opportunities.
                </p>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-copper" />
                Your Stats
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-3xl font-bold text-brand-copper">{profile?.inspections_completed || 0}</p>
                  <p className="text-sm text-slate-600">Inspections Completed</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-3xl font-bold text-brand-copper flex items-center justify-center gap-1">
                    {profile?.rating || 0}
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </p>
                  <p className="text-sm text-slate-600">Average Rating</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-3xl font-bold text-brand-copper">{profile?.rating_count || 0}</p>
                  <p className="text-sm text-slate-600">Reviews</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </Gate>
  )
}
