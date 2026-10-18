import { PLAN_UIDS } from './plan-config'

export type TrainingModuleAccess = { id: string; slug?: string; module_number: number; requires_previous_module: boolean | null }
export type TrainingAccessState = {
  modules: TrainingModuleAccess[]
  completedModuleIds: string[]
  waivedModuleIds: string[]
  profileId: string | null
  lookupUserIds: string[]
}
export const PAID_TRAINING_PLANS: string[] = [PLAN_UIDS.STARTER, PLAN_UIDS.FOUNDERS, PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY]

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

