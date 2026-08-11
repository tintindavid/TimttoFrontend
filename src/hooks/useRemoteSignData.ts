import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { publicSheetSignService, PublicSheetSignData } from '@/services/publicSheetSign.service';
import { ApiResponse } from '@/types/api.types';

/**
 * Public query for GET /public/sheet-sign/:token.
 *
 * Polls every 2s (max 15 tries) when the sheet was just signed and the PDF
 * is still generating, so the download button unhides as soon as the file
 * lands in Firebase.
 */
export const useRemoteSignData = (token: string) => {
  return useQuery<ApiResponse<PublicSheetSignData>, AxiosError<any>>({
    queryKey: ['public-sheet-sign', token],
    queryFn: () => publicSheetSignService.getByToken(token),
    retry: false,
    refetchOnWindowFocus: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refetchInterval: (data: any) => {
      const status = data?.data?.status;
      const pdfStatus = data?.data?.pdfStatus;
      if (status === 'signed' && pdfStatus === 'pending') return 2000;
      return false;
    },
    enabled: Boolean(token),
  });
};

export default useRemoteSignData;
