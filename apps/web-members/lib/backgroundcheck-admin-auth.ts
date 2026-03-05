export type AdminRoleLookupResult = {
  role?: string | null
  permissions?: string[] | null
} | null

export type LookupAdminRole = (outsetaId: string) => Promise<AdminRoleLookupResult>

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'owner'])
const ADMIN_PERMISSIONS = new Set([
  'background_check:review',
  'background_check:verify',
  'admin:background_check',
  'admin:*',
  '*',
])

function normalizeClaimValues(raw: unknown): string[] {
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw
      .flatMap((entry) => normalizeClaimValues(entry))
      .filter((entry): entry is string => Boolean(entry))
  }

  if (typeof raw === 'string') {
    return raw
      .split(/[\s,]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  }

  return []
}

export function hasAdminClaims(user: Record<string, any> | null): boolean {
  if (!user) return false

  const roleClaims = [
    ...normalizeClaimValues(user.role),
    ...normalizeClaimValues(user.roles),
    ...normalizeClaimValues(user['outseta:role']),
    ...normalizeClaimValues(user['outseta:roles']),
  ]

  if (roleClaims.some((role) => ADMIN_ROLES.has(role))) {
    return true
  }

  const permissionClaims = [
    ...normalizeClaimValues(user.permissions),
    ...normalizeClaimValues(user.permission),
    ...normalizeClaimValues(user['outseta:permissions']),
  ]

  return permissionClaims.some((permission) => ADMIN_PERMISSIONS.has(permission))
}

export async function isBackgroundCheckAdmin(
  user: Record<string, any> | null,
  outsetaId: string | null,
  lookupAdminRole: LookupAdminRole,
): Promise<boolean> {
  if (!user || !outsetaId) return false

  if (hasAdminClaims(user)) {
    return true
  }

  const roleMapping = await lookupAdminRole(outsetaId)
  if (!roleMapping) return false

  const mappedRoles = normalizeClaimValues(roleMapping.role)
  if (mappedRoles.some((role) => ADMIN_ROLES.has(role))) {
    return true
  }

  const mappedPermissions = normalizeClaimValues(roleMapping.permissions)
  return mappedPermissions.some((permission) => ADMIN_PERMISSIONS.has(permission))
}
