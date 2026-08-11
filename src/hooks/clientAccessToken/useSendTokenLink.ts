import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse } from '@/types/api.types';
import { clientAccessTokenService } from '@/services/clientAccessToken.service';
import { clientAccessTokenKeys } from './useClientTokens';

interface Variables {
  id: string;
  email: string;
}

interface Data {
  id: string;
  email: string;
  sentAt: string;
  emailSent: boolean;
}

export const useSendTokenLink = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Data>, AxiosError<any>, Variables>({
    mutationFn: ({ id, email }) => clientAccessTokenService.sendLink(id, email),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: clientAccessTokenKeys.lists() });
      qc.invalidateQueries({ queryKey: clientAccessTokenKeys.detail(vars.id) });
      if (res.data?.emailSent) {
        toast.success(`Correo enviado a ${res.data.email}.`);
      } else {
        toast.warning(
          'Se registró el envío, pero el correo no salió. Verifica la configuración de notificaciones.'
        );
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'No fue posible enviar el correo.';
      toast.error(msg);
    },
  });
};

export default useSendTokenLink;
