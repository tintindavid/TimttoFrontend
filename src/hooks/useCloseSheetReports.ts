import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiResponse } from '@/types/api.types';
import { sheetworkService } from '@/services/sheetwork.service';

/**
 * Admin-triggered closure of the `Procesado` reports linked to a specific
 * `SheetWork` (`sheet-report-closure`). Used by `WorkSheets.tsx`'s icon next
 * to "Reportes PDF" — retro mitigation for HTs that were signed via the
 * client portal before its `Procesado → Cerrado` bug fix.
 *
 * Takes `otId` so it can invalidate the same `['worksheets', otId]` query
 * key `useWorkSheets` reads from, making the icon disappear once the
 * refetched sheet no longer has any `Procesado` report.
 */
export const useCloseSheetReports = (otId: string) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{ modifiedCount: number }>, AxiosError, string>({
    mutationFn: (sheetId: string) => sheetworkService.closeReports(sheetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worksheets', otId] });
    },
  });
};
