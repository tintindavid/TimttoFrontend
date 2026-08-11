import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  publicSheetSignService,
  SubmitSignaturePayload,
  SubmitSignatureResponse,
} from '@/services/publicSheetSign.service';
import { ApiResponse } from '@/types/api.types';

/**
 * Public mutation for POST /public/sheet-sign/:token.
 * On success invalidates the cached read so the page transitions from
 * the sign surface to the read-only view.
 */
export const useSubmitRemoteSign = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<SubmitSignatureResponse>, AxiosError<any>, SubmitSignaturePayload>({
    mutationFn: (payload) => publicSheetSignService.sign(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-sheet-sign', token] });
    },
  });
};

export default useSubmitRemoteSign;
