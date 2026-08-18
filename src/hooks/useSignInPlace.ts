import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse } from '@/types/api.types';
import { sheetworkService } from '@/services/sheetwork.service';

interface Variables {
  sheetId: string;
  signature: { imagePng: string; signerName: string; cargo?: string; observaciones?: string };
  personaRecibe?: string;
  cargoRecibe?: string;
  observaciones?: string;
  /** Firmante técnico opcional; default backend = user en sesión (report-processor-and-signer-traceability). */
  firmanteUserId?: string;
}

interface Data {
  sheetId: string;
  estado: string;
  pdfStatus: string;
}

export const useSignInPlace = (otId: string) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Data>, AxiosError<any>, Variables>({
    mutationFn: (vars) =>
      sheetworkService.signInPlace(vars.sheetId, {
        signature: vars.signature,
        personaRecibe: vars.personaRecibe,
        cargoRecibe: vars.cargoRecibe,
        observaciones: vars.observaciones,
        firmanteUserId: vars.firmanteUserId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worksheets', otId] });
      toast.success('Hoja firmada en sitio.');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'No fue posible firmar en sitio.';
      toast.error(msg);
    },
  });
};

export default useSignInPlace;
