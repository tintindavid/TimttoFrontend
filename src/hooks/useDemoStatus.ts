import { useQuery } from '@tanstack/react-query';
import { DemoService } from '@/services/demo.service';
import type { DemoStatus } from '@/types/demo.types';

export const DEMO_STATUS_KEY = 'demo-status';

/** The viewed tenant (superadmin view-as) or the user's own. */
const effectiveTenantId = (): string =>
  sessionStorage.getItem('viewAsTenantId') || localStorage.getItem('tenantId') || '';

/** Demo limits of the effective tenant; `isDemo` is false while unknown (the backend enforces every rule). */
export function useDemoStatus() {
  const tenantId = effectiveTenantId();
  const { data } = useQuery<DemoStatus>(
    [DEMO_STATUS_KEY, tenantId],
    () => DemoService.getStatus(),
    { enabled: !!tenantId, staleTime: 60 * 1000, retry: false },
  );
  return data?.enabled
    ? { isDemo: true as const, limits: data.limits, usage: data.usage }
    : { isDemo: false as const, limits: undefined, usage: undefined };
}
