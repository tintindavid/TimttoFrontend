import { useQuery } from '@tanstack/react-query';
import { PlatformAuditService } from '@/services/platformAudit.service';
import type { PlatformAuditListParams } from '@/types';

const getPlatformTenantId = (): string =>
  localStorage.getItem('tenantId') || '__platform__';

export const useGetPlatformAudit = (params?: PlatformAuditListParams) => {
  const tenantId = getPlatformTenantId();
  return useQuery(
    ['platform-audit', tenantId, params],
    () => PlatformAuditService.list(params),
    { keepPreviousData: true }
  );
};
