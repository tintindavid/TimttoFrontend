import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiResponse } from '@/types/api.types';
import { PortalSignRequest, PortalSignResponse } from '@/types/publicPortal.types';
import { publicPortalService } from '@/services/publicPortal.service';
import { portalKeys } from './usePortalData';

/**
 * Stub for the multi-HT signature mutation (D6/D8). The full UX — canvas
 * capture, `signerName`/`signerId`/`cargo` inputs, error branches for
 * `SIGN_REQUIRES_REVIEW` / `TOKEN_CREATOR_INVALID` / `INVALID_SIGNATURE_IMAGE`
 * — is implemented by the follow-up frontend agent in `SignatureModal.tsx`.
 * This hook only wires the mutation + cache invalidation so that agent can
 * call `useSign(token)` without touching the service layer.
 */
export const useSign = (token: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<PortalSignResponse>, AxiosError, PortalSignRequest>({
    mutationFn: (body) => publicPortalService.sign(token as string, body),
    onSuccess: () => {
      if (!token) return;
      queryClient.invalidateQueries({ queryKey: portalKeys.consolidated(token) });
      queryClient.invalidateQueries({ queryKey: portalKeys.sheets(token) });
    },
  });
};
