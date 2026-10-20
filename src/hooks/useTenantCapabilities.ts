import { useQuery } from '@tanstack/react-query';
import { TenantCapabilitiesService } from '@/services/tenantCapabilities.service';
import type { TenantCapabilities } from '@/types';

export const TENANT_CAPABILITIES_STALE_TIME_MS = 60 * 1000;

/**
 * Fetches the capabilities of the effective tenant. The key carries the effective
 * tenant (view-as tenant or the user's own) so switching tenants never reuses
 * another tenant's flags.
 */
export const useGetTenantCapabilities = (effectiveTenantId: string | null, enabled = true) =>
  useQuery<TenantCapabilities>(
    ['tenant-capabilities', effectiveTenantId],
    () => TenantCapabilitiesService.getMine(),
    {
      enabled: enabled && !!effectiveTenantId,
      staleTime: TENANT_CAPABILITIES_STALE_TIME_MS,
      retry: false,
    }
  );
