import { NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function resolveUserId(outsetaUser: any) {
  return (
    getOutsetaUserId(outsetaUser) ||
    outsetaUser?.Uid ||
    outsetaUser?.uid ||
    outsetaUser?.Id ||
    outsetaUser?.id ||
    outsetaUser?.UserAccountUid ||
    null
  )
}

export async function GET() {
  try {
    const outsetaUser = await getCurrentUser()

    if (!outsetaUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = resolveUserId(outsetaUser)

    if (!userId) {
      return NextResponse.json({ error: 'Could not identify user' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Fetch profile data (trust score, training, etc.)
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id,
        outseta_person_uid,
        user_id,
        trust_score,
        trust_tier,
        trust_score_breakdown,
        training_modules_completed,
        training_modules_total,
        inspections_completed,
        background_check_status,
        rating,
        rating_count,
        verified_at,
        created_at
      `)
      .or(`outseta_person_uid.eq.${userId},user_id.eq.${userId}`)
      .limit(1)
      .single()

    // Fetch job pipeline stats
    const { data: pipelineJobs } = await supabase
      .from('member_job_tracker')
      .select('id, status, created_at')
      .eq('user_id', userId)

    // Calculate pipeline stats
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const jobs = pipelineJobs || []
    const terminalStatuses = ['accepted', 'rejected', 'withdrawn']
    
    const activeJobs = jobs.filter(j => !terminalStatuses.includes(j.status)).length
    const offers = jobs.filter(j => j.status === 'offer').length
    const applied = jobs.filter(j => j.status === 'applied').length
    const interviewing = jobs.filter(j => j.status === 'interviewing').length
    const addedThisWeek = jobs.filter(j => new Date(j.created_at) >= weekStart).length

    // Fetch total active job listings count
    const { count: totalJobListings } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    // Fetch total firms count
    const { count: totalFirms } = await supabase
      .from('firms')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)

    // Calculate training level based on modules completed
    // Use profile field, but also do a live count from quiz_attempts as source of truth
    let modulesCompleted = profile?.training_modules_completed || 0
    
    // Live count from quiz_attempts — use all possible linked IDs for this user
    const lookupIds = [userId, profile?.outseta_person_uid, profile?.user_id].filter(Boolean) as string[]
    const uniqueLookupIds = Array.from(new Set(lookupIds))
    
    let { data: passedQuizzes } = await supabase
      .from('quiz_attempts')
      .select('module_id')
      .in('user_id', uniqueLookupIds)
      .eq('passed', true)

    // Fallback search by profile_id if user_id records are missing
    if (profile?.id) {
       const { data: profileQuizzes } = await supabase
        .from('quiz_attempts')
        .select('module_id')
        .eq('profile_id', profile.id)
        .eq('passed', true)
      
      if (profileQuizzes) {
        passedQuizzes = [...(passedQuizzes || []), ...profileQuizzes]
      }
    }
    
    if (passedQuizzes && passedQuizzes.length > 0) {
      const uniqueModules = new Set(passedQuizzes.map(q => q.module_id))
      modulesCompleted = Math.max(modulesCompleted, uniqueModules.size)
    }

    const modulesTotal = profile?.training_modules_total || 8
    const trainingLevel = modulesCompleted === 0 ? 0 
      : modulesCompleted >= modulesTotal ? 3 
      : modulesCompleted >= Math.floor(modulesTotal / 2) ? 2 
      : 1

    // Calculate account age in days
    const accountCreated = profile?.created_at ? new Date(profile.created_at) : new Date()
    const accountAgeDays = Math.floor((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24))

    return NextResponse.json({
      // Trust score
      trustScore: profile?.trust_score || 0,
      trustTier: profile?.trust_tier || 'bronze',
      trustScoreBreakdown: profile?.trust_score_breakdown || null,
      
      // Profile stats
      rating: profile?.rating || 0,
      ratingCount: profile?.rating_count || 0,
      isVerified: !!profile?.verified_at,
      verifiedAt: profile?.verified_at || null,
      backgroundCheckStatus: profile?.background_check_status || 'not_started',
      
      // Training
      trainingLevel,
      trainingModulesCompleted: modulesCompleted,
      trainingModulesTotal: modulesTotal,
      trainingProgress: modulesTotal > 0 ? Math.round((modulesCompleted / modulesTotal) * 100) : 0,
      
      // Work stats
      inspectionsCompleted: profile?.inspections_completed || 0,
      
      // Pipeline stats
      pipeline: {
        active: activeJobs,
        offers,
        applied,
        interviewing,
        addedThisWeek,
        total: jobs.length,
      },
      
      // Platform stats
      platform: {
        totalJobListings: totalJobListings || 0,
        totalFirms: totalFirms || 0,
      },
      
      // Account
      accountAgeDays,
    })
  } catch (err) {
    console.error('[DASHBOARD_STATS_ERROR]', err)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}