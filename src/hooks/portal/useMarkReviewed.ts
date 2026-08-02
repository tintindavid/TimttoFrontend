import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiResponse } from '@/types/api.types';
import { publicPortalService } from '@/services/publicPortal.service';
import { portalKeys } from './usePortalData';

/**
 * Toggles `Report.clientReview` from the public portal (D1). Both mutations
 * invalidate the consolidated listing (badges/counters) and every open
 * report-detail query for this token, so `PortalHome` and `ReportDetailModal`
 * reflect the new state without a manual refetch.
 */
const invalidateReviewQueries = (queryClient: ReturnType<typeof useQueryClient>, token: string) => {
  queryClient.invalidateQueries({ queryKey: portalKeys.consolidated(token) });
  queryClient.invalidateQueries({ queryKey: [...portalKeys.all, 'report', token] });
};

export const useMarkReviewed = (token: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{ clientReview: { reviewedAt: string } }>, AxiosError, string>({
    mutationFn: (reportId) => publicPortalService.markReviewed(token as string, reportId),
    onSuccess: () => {
      if (token) invalidateReviewQueries(queryClient, token);
    },
  });
};

export const useUnmarkReviewed = (token: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, string>({
    mutationFn: (reportId) => publicPortalService.unmarkReviewed(token as string, reportId),
    onSuccess: () => {
      if (token) invalidateReviewQueries(queryClient, token);
    },
  });
};

/**
 * Persists the client's per-report free-form note (2026-08-02). Mutation
 * variable: `{ reportId, text }`. Empty `text` clears the note. Invalidates
 * the same queries as the review toggle so the consolidated listing icon
 * and modal state update in place.
 */
export const useUpdateClientNote = (token: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<{ clientNote: { text: string; updatedAt: string } | null }>,
    AxiosError,
    { reportId: string; text: string }
  >({
    mutationFn: ({ reportId, text }) =>
      publicPortalService.updateClientNote(token as string, reportId, text),
    onSuccess: () => {
      if (token) invalidateReviewQueries(queryClient, token);
    },
  });
};
