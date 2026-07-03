import { useQuery } from '@tanstack/react-query';
import { PlatformAnalyticsService } from '@/services/platformAnalytics.service';
import type { AnalyticsFilters } from '@/types';

/**
 * SuperAdmin queries don't filter by tenantId (cross-tenant scope).
 * We include tenantId in cache key for RQ invalidation consistency.
 */
const getPlatformTenantId = (): string =>
  localStorage.getItem('tenantId') || '__platform__';

/**
 * Fetches the global analytics summary: KPIs + chart datasets.
 * staleTime: 30s to avoid re-fetching on every minor re-render.
 */
export const useGetAnalyticsSummary = (filters?: AnalyticsFilters) => {
  const tenantId = getPlatformTenantId();
  return useQuery(
    ['analytics-summary', tenantId, filters],
    () => PlatformAnalyticsService.getSummary(filters),
    { staleTime: 30_000, keepPreviousData: true }
  );
};

/**
 * Fetches the per-tenant breakdown rows for the drill-down table.
 * staleTime: 30s in line with summary.
 */
export const useGetAnalyticsTenants = (filters?: AnalyticsFilters) => {
  const tenantId = getPlatformTenantId();
  return useQuery(
    ['analytics-tenants', tenantId, filters],
    () => PlatformAnalyticsService.getTenants(filters),
    { staleTime: 30_000, keepPreviousData: true }
  );
};
