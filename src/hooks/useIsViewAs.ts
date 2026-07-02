import { useAuth } from '@/context/AuthContext';

export interface UseIsViewAsResult {
  isViewAs: boolean;
  tenantId: string | null;
  tenantName: string | null;
}

/**
 * Convenience hook that surfaces the view-as state from AuthContext.
 * Use this in components and forms to disable mutating actions when
 * the SuperAdmin is impersonating a tenant (UX layer — backend enforces too).
 */
export const useIsViewAs = (): UseIsViewAsResult => {
  const { viewAsTenantId, viewAsTenantName } = useAuth();
  return {
    isViewAs: !!viewAsTenantId,
    tenantId: viewAsTenantId,
    tenantName: viewAsTenantName,
  };
};
