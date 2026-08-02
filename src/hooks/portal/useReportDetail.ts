import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiResponse } from '@/types/api.types';
import { PortalReportDetail } from '@/types/publicPortal.types';
import { publicPortalService } from '@/services/publicPortal.service';
import { portalKeys } from './usePortalData';

/**
 * Fetches the full detail of a single report for `ReportDetailModal`.
 * Only enabled while the modal is open (`reportId` truthy). Does not poll —
 * the detail is a snapshot opened on demand, unlike the consolidated list.
 */
export const useReportDetail = (token: string | undefined, reportId: string | undefined) => {
  return useQuery<ApiResponse<PortalReportDetail>, AxiosError>({
    queryKey: portalKeys.reportDetail(token ?? '', reportId ?? ''),
    queryFn: () => publicPortalService.getReportDetail(token as string, reportId as string),
    enabled: !!token && !!reportId,
    retry: false,
  });
};
