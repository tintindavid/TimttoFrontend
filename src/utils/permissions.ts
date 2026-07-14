import { User } from '@/types/user.types';

/**
 * Pure predicate: does the given user have the permission?
 *
 * Rules:
 *   - superadmin bypasses all permission checks (platform operators).
 *   - Missing/null user → false.
 *   - Empty permissions array → false unless superadmin.
 */
export function userHasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

/** True when the user has at least one of the listed permissions (or is superadmin). */
export function userHasAnyPermission(
  user: User | null | undefined,
  permissions: string[],
): boolean {
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  if (!Array.isArray(user.permissions)) return false;
  return permissions.some((permission) => user.permissions!.includes(permission));
}
