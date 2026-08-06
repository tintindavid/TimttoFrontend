import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiResponse } from '@/types/api.types';
import { PortalSignLateRequest, PortalSignLateResponse } from '@/types/publicPortal.types';
import { publicPortalService } from '@/services/publicPortal.service';
import { portalKeys } from './usePortalData';

/**
 * Late-sign mutation for a `SheetWork` whose `firmaFile` is empty
 * (`portal-signature-flow` D3/D7). Mirrors `useSign.ts`'s wiring pattern —
 * `SignatureModal` dispatches this one instead of `useSign` when
 * `mode === 'late'`. On success, invalidates the sheets-history query so the
 * "Firmar hoja" icon disappears once the row refetches.
 */
export const useSignExistingSheet = (token: string | undefined, sheetId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<PortalSignLateResponse>, AxiosError, PortalSignLateRequest>({
    mutationFn: (body) =>
      publicPortalService.signExistingSheet(token as string, sheetId as string, body),
    onSuccess: () => {
      if (!token) return;
      queryClient.invalidateQueries({ queryKey: portalKeys.sheets(token) });
    },
  });
};
