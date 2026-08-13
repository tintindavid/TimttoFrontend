import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse } from '@/types/api.types';
import { sheetworkService } from '@/services/sheetwork.service';

interface Variables {
  sheetId: string;
  email: string;
  allowReports?: boolean;
}

interface Data {
  sheetId: string;
  token: string;
  expiresAt: string;
  downloadsAllowed: number;
  allowReports: boolean;
  reportDownloadsAllowed: number;
  emailSent: boolean;
}

/**
 * Shares a signed HT via a one-off download link. `otId` is optional (used
 * only to invalidate the corresponding `useWorkSheets` query when the modal
 * is opened from the OT detail page — the Diario page doesn't need it).
 */
export const useShareSignedSheet = (otId?: string) => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Data>, AxiosError<any>, Variables>({
    mutationFn: (vars) => sheetworkService.share(vars.sheetId, { email: vars.email, allowReports: vars.allowReports }),
    onSuccess: (res) => {
      if (otId) qc.invalidateQueries({ queryKey: ['worksheets', otId] });
      qc.invalidateQueries({ queryKey: ['worksheets'] });
      const d = res.data;
      if (d?.emailSent) {
        toast.success(
          `Link enviado — ${d.downloadsAllowed} descargas de HT` +
            (d.allowReports ? ` / ${d.reportDownloadsAllowed} descargas de reportes` : '') +
            `.`
        );
      } else {
        toast.warning(
          'Se registró el envío, pero el correo no salió. Verifica la configuración de notificaciones.'
        );
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'No fue posible generar el enlace.';
      toast.error(msg);
    },
  });
};

export default useShareSignedSheet;
