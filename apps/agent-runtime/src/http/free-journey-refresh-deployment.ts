const refreshPath = '/api/operations/free-journey-refresh'

/** Register only the separately approved Production refresh; never the synthetic Preview. */
export function freeJourneyRefreshDeployment(env: Record<string, string | undefined>) {
  const enabled = env.VERCEL_ENV === 'production' && env.FREE_JOURNEY_REFRESH_ENABLED === 'true'
  if (enabled && (env.CRON_SECRET?.length ?? 0) < 32) {
    throw new Error('Enabled Free journey schedule requires its dedicated Production credential')
  }
  return {
    functionRules: { [refreshPath]: { maxDuration: 300 } },
    config: { version: 3 as const, crons: enabled ? [{ path: refreshPath, schedule: '0 * * * *' }] : [] },
  }
}
