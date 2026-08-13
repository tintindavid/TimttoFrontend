import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  publicSheetDownloadService,
  SheetDownloadMeta,
} from '@/services/publicSheetDownload.service';
import { ApiResponse } from '@/types/api.types';

/**
 * Public query for GET /public/sheet-download/:token. Refetches on window
 * focus so the counters stay live when the user opens the link in more than
 * one tab.
 */
export const useSheetDownloadData = (token: string) => {
  return useQuery<ApiResponse<SheetDownloadMeta>, AxiosError<any>>({
    queryKey: ['public-sheet-download', token],
    queryFn: () => publicSheetDownloadService.getByToken(token),
    retry: false,
    enabled: Boolean(token),
    refetchOnWindowFocus: true,
  });
};

export default useSheetDownloadData;
