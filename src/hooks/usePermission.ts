import { useAuth } from '@/context/AuthContext';
import { userHasAnyPermission, userHasPermission } from '@/utils/permissions';

/**
 * Read-only accessor for the current user's effective permission list.
 * Populated by GET /auth/me — the array is empty for users without a roleId.
 * superadmin returns an empty array here but bypasses via `has()`.
 */
export function useCurrentUserPermissions() {
  const { user } = useAuth();
  const permissions = Array.isArray(user?.permissions) ? user!.permissions! : [];
  return {
    permissions,
    isSuperadmin: user?.role === 'superadmin',
    has: (permission: string) => userHasPermission(user, permission),
    hasAny: (list: string[]) => userHasAnyPermission(user, list),
  };
}

/** Sugar for a single-permission gate — most call sites only need this. */
export function useHasPermission(permission: string): boolean {
  const { user } = useAuth();
  return userHasPermission(user, permission);
}
