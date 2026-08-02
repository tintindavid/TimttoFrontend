import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiResponse } from '@/types/api.types';
import { PortalConsolidatedView } from '@/types/publicPortal.types';
import { publicPortalService } from '@/services/publicPortal.service';

export const portalKeys = {
  all: ['public-portal'] as const,
  consolidated: (token: string) => [...portalKeys.all, 'consolidated', token] as const,
  reportDetail: (token: string, reportId: string) =>
    [...portalKeys.all, 'report', token, reportId] as const,
  /** `GET /public/client-view/:token/sheets` history (D12) — shared by `useSign` (invalidation) and `useSheetsHistory` (query key). */
  sheets: (token: string) => [...portalKeys.all, 'sheets', token] as const,
};

/**
 * Polls the consolidated OT/report view for the public portal.
 * `refetchInterval: 15000` / `staleTime: 10000` per D12 — gives a
 * "near real-time" feel without hammering the backend. Never retries: a
 * 404 (unknown token) or 410 (revoked) is a terminal state the UI must
 * react to immediately (`PortalRevoked` / not-found message), not a
 * transient failure to retry.
 */
export const usePortalConsolidated = (token: string | undefined) => {
  return useQuery<ApiResponse<PortalConsolidatedView>, AxiosError>({
    queryKey: portalKeys.consolidated(token ?? ''),
    queryFn: () => publicPortalService.getConsolidatedView(token as string),
    enabled: !!token,
    refetchInterval: 15000,
    staleTime: 10000,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
