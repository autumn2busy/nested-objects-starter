/** Legacy source stores both provenance notes and work settings. Never display notes as a setting. */
const settings = [
  { label: 'Field Operations', aliases: ['Field Operations', 'Field'] },
  { label: 'Remote / Desk', aliases: ['Remote/Desk', 'Remote / Desk', 'Remote'] },
  { label: 'Field + Desk', aliases: ['Field + Desk', 'Field + Remote'] },
  { label: 'Field + Drone', aliases: ['Field + Drone'] },
  { label: 'On-Site + Remote', aliases: ['On-Site + Remote', 'Remote + On-Site'] },
  { label: 'Drive-by only', aliases: ['Drive-by only'] },
] as const
const key = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()

export function normalizeFirmWorkSetting(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return settings.find(setting => setting.aliases.some(alias => key(alias) === key(value)))?.label ?? null
}

/** Exact category aliases prevent provenance text from matching a work-setting filter. */
export function firmWorkSettingFilter(value: string): string | null {
  const normalized = normalizeFirmWorkSetting(value)
  const setting = settings.find(setting => setting.label === normalized)
  return setting ? [...new Set([setting.label, ...setting.aliases])].map(alias => 'source.eq.' + alias).join(',') : null
}
