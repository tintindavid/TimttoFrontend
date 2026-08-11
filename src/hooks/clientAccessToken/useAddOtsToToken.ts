import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse } from '@/types/api.types';
import { ClientAccessToken } from '@/types/clientAccessToken.types';
import { clientAccessTokenService } from '@/services/clientAccessToken.service';
import { clientAccessTokenKeys } from './useClientTokens';

interface Variables {
  id: string;
  otIds: string[];
}

export const useAddOtsToToken = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ClientAccessToken>, AxiosError<any>, Variables>({
    mutationFn: ({ id, otIds }) => clientAccessTokenService.addOts(id, otIds),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: clientAccessTokenKeys.lists() });
      qc.invalidateQueries({ queryKey: clientAccessTokenKeys.detail(vars.id) });
      toast.success('OTs añadidas al acceso.');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'No fue posible añadir las OTs.';
      toast.error(msg);
    },
  });
};

export default useAddOtsToToken;
