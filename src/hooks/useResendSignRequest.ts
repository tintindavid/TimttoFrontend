import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse } from '@/types/api.types';
import { sheetworkService } from '@/services/sheetwork.service';

interface Variables {
  sheetId: string;
  email: string;
  message?: string;
}

interface Data {
  sheetId: string;
  tokenId: string;
  expiresAt: string;
  email: string;
  emailSent: boolean;
}

export const useResendSignRequest = (otId: string) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Data>, AxiosError<any>, Variables>({
    mutationFn: (vars) =>
      sheetworkService.resendSignRequest(vars.sheetId, { email: vars.email, message: vars.message }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['worksheets', otId] });
      if (res.data?.emailSent) toast.success('Correo reenviado correctamente.');
      else toast.warning('No se pudo reenviar el correo. Verifica la configuración de notificaciones.');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'No fue posible reenviar la solicitud.';
      toast.error(msg);
    },
  });
};

export default useResendSignRequest;
