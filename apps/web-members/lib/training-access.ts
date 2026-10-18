import { PLAN_UIDS } from './plan-config'

export type TrainingModuleAccess = { id: string; slug?: string; module_number: number; requires_previous_module: boolean | null }
export type TrainingAccessState = {
  modules: TrainingModuleAccess[]
  completedModuleIds: string[]
  waivedModuleIds: string[]
  profileId: string | null
  lookupUserIds: string[]
}
const PAID_TRAINING_PLANS: string[] = [PLAN_UIDS.STARTER, PLAN_UIDS.FOUNDERS, PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY]

export function canOpenTrainingModule(planUid: unknown, module: TrainingModuleAccess, state: Pick<TrainingAccessState, 'modules' | 'completedModuleIds' | 'waivedModuleIds'>) {
  if (typeof planUid !== 'string' || ![PLAN_UIDS.FREE, ...PAID_TRAINING_PLANS].includes(planUid)) return false
  if (module.module_number === 1) return true
  if (!PAID_TRAINING_PLANS.includes(planUid)) return false
  if (state.completedModuleIds.includes(module.id)) return true
  if (module.requires_previous_module === false) return true
  const previous = state.modules.find(item => item.module_number === module.module_number - 1)
  if (!previous) return false
  return state.completedModuleIds.includes(previous.id) || state.waivedModuleIds.includes(module.id)
}

/** Only verified server identity selects progress and waivers. No GET-time repair. */
export async function readTrainingAccess(supabase: any, user: { sub?: unknown; 'outseta:accountUid'?: unknown }, now = Date.now()): Promise<TrainingAccessState> {
  if (typeof user.sub !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(user.sub)) throw new Error('Training identity unavailable')
  const modulesResult = await supabase.from('training_modules')
    .select('id,slug,module_number,requires_previous_module').eq('is_active', true).order('module_number')
  if (modulesResult.error || !Array.isArray(modulesResult.data)) throw new Error('Training catalog unavailable')
  const modules: TrainingModuleAccess[] = modulesResult.data
  const profilesResult = await supabase.from('profiles').select('id,user_id,outseta_person_uid,outseta_account_id')
    .or('outseta_person_uid.eq.' + user.sub + ',user_id.eq.' + user.sub).limit(2)
  if (profilesResult.error || !Array.isArray(profilesResult.data) || profilesResult.data.length > 1) throw new Error('Training identity unavailable')
  const profile = profilesResult.data[0]
  const empty = { modules, completedModuleIds: [], waivedModuleIds: [], profileId: null, lookupUserIds: [user.sub] }
  if (!profile) return empty
  if (profile.outseta_person_uid && profile.outseta_person_uid !== user.sub) throw new Error('Training identity conflict')
  const lookupUserIds = [...new Set<string>([user.sub, profile.user_id, profile.outseta_person_uid].filter(value => typeof value === 'string' && value.length > 0))]
  const [byUser, byProfile] = await Promise.all([
    supabase.from('quiz_attempts').select('module_id').in('user_id', lookupUserIds).eq('passed', true),
    supabase.from('quiz_attempts').select('module_id').eq('profile_id', profile.id).eq('passed', true),
  ])
  if (byUser.error || byProfile.error) throw new Error('Training assessment history unavailable')
  const completedModuleIds = [...new Set<string>([...(byUser.data || []), ...(byProfile.data || [])].map(row => row.module_id))]
  let waivedModuleIds: string[] = []
  if (profile.outseta_person_uid === user.sub && typeof user['outseta:accountUid'] === 'string'
      && profile.outseta_account_id === user['outseta:accountUid']) {
    const result = await supabase.from('training_prerequisite_waivers')
      .select('module_id,prerequisite_module_id,approved_at,expires_at,revoked_at')
      .eq('profile_id', profile.id).eq('outseta_person_uid', user.sub)
      .eq('outseta_account_uid', user['outseta:accountUid']).is('revoked_at', null)
    // A missing/unavailable waiver store must never block ordinary earned progress
    // or become permission to waive a prerequisite.
    if (!result.error) {
      waivedModuleIds = [...new Set<string>((result.data || []).filter((row: any) => {
        const target = modules.find(module => module.id === row.module_id)
        const prerequisite = modules.find(module => module.id === row.prerequisite_module_id)
        const approved = Date.parse(row.approved_at)
        const expires = row.expires_at === null ? Infinity : Date.parse(row.expires_at)
        return target && prerequisite && target.module_number === prerequisite.module_number + 1
          && target.requires_previous_module !== false && row.revoked_at === null
          && Number.isFinite(approved) && approved <= now && expires > now
      }).map((row: any) => row.module_id))]
    } else console.warn('[Training] Prerequisite waiver lookup unavailable')
  }
  return { modules, completedModuleIds, waivedModuleIds, profileId: profile.id, lookupUserIds }
}
