import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiResponse } from '@/types/api.types';
import { PortalSheetsResponse } from '@/types/publicPortal.types';
import { publicPortalService } from '@/services/publicPortal.service';
import { portalKeys } from './usePortalData';

/**
 * Backs `PortalSheetsHistory` (D12). Polls every 3s while any sheet is still
 * generating its PDF (`pdfStatus: 'pending'`), matching D8's async PDF
 * generation; stops polling once every sheet is `ready` or `error`.
 * `refetchIntervalInBackground` keeps the poll running even if the client
 * tabs away right after signing. Never retries — same terminal-state
 * rationale as `usePortalConsolidated` (404/410/425 are all states the UI
 * must react to immediately, not transient failures).
 */
export const useSheetsHistory = (token: string | undefined) => {
  return useQuery<ApiResponse<PortalSheetsResponse>, AxiosError>({
    queryKey: portalKeys.sheets(token ?? ''),
    queryFn: () => publicPortalService.listSheets(token as string),
    enabled: !!token,
    retry: false,
    refetchIntervalInBackground: true,
    refetchInterval: (data) =>
      data?.data?.sheets?.some((sheet) => sheet.pdfStatus === 'pending') ? 3000 : false,
  });
};
