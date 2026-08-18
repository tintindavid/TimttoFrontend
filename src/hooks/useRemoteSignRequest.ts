import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse } from '@/types/api.types';
import { sheetworkService } from '@/services/sheetwork.service';

interface Variables {
  otId: string;
  reportIds: string[];
  email: string;
  message?: string;
  /** Firmante técnico opcional; default backend = user en sesión (report-processor-and-signer-traceability). */
  firmanteUserId?: string;
}

interface Data {
  sheetId: string;
  tokenId: string;
  expiresAt: string;
  emailSent: boolean;
  numeroHoja?: string;
}

/**
 * Creates a remote sign request for a set of reports. Invalidates the
 * OT's worksheets query so the new sheet in `EnviadaAFirmar` shows up.
 */
export const useRemoteSignRequest = (otId: string) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Data>, AxiosError<any>, Variables>({
    mutationFn: (vars) =>
      sheetworkService.remoteSignRequest({
        otId: vars.otId,
        reportIds: vars.reportIds,
        email: vars.email,
        message: vars.message,
        firmanteUserId: vars.firmanteUserId,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['worksheets', otId] });
      if (res.data?.emailSent) {
        toast.success('Solicitud de firma enviada al correo del cliente.');
      } else {
        toast.warning(
          'HT creada, pero el correo no pudo enviarse. Reenvíalo desde la lista de hojas.'
        );
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'No fue posible enviar la solicitud.';
      toast.error(msg);
    },
  });
};

export default useRemoteSignRequest;
