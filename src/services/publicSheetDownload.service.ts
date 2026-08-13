import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@/types/api.types';

/**
 * Public sheet-download axios instance — no auth, no interceptors, opaque
 * token in the URL. Same base-URL scheme as publicSheetSign / publicPortal.
 */

const RAW_API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000/api/v1';

const computePublicBase = (apiUrl: string): string => {
  const trimmed = apiUrl.replace(/\/$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed.slice(0, -'/api/v1'.length);
  return trimmed;
};

const PUBLIC_BASE_URL = computePublicBase(RAW_API_URL);

const api: AxiosInstance = axios.create({
  baseURL: PUBLIC_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

export type SheetDownloadStatus = 'active' | 'exhausted' | 'expired' | 'revoked';

export interface SheetDownloadMeta {
  status: SheetDownloadStatus;
  sheetNumero: string | null;
  otConsecutivo: string | null;
  tenantName: string | null;
  expiresAt: string;
  downloadsAllowed: number;
  downloadsUsed: number;
  allowReports: boolean;
  reportDownloadsAllowed: number;
  reportDownloadsUsed: number;
}

class PublicSheetDownloadService {
  private endpoint = '/public/sheet-download';

  async getByToken(token: string): Promise<ApiResponse<SheetDownloadMeta>> {
    const res = await api.get<ApiResponse<SheetDownloadMeta>>(`${this.endpoint}/${token}`);
    return res.data;
  }

  buildHtPdfUrl(token: string): string {
    return `${PUBLIC_BASE_URL}${this.endpoint}/${token}/pdf`;
  }

  buildReportsZipUrl(token: string): string {
    return `${PUBLIC_BASE_URL}${this.endpoint}/${token}/reports.zip`;
  }
}

export const publicSheetDownloadService = new PublicSheetDownloadService();
export default publicSheetDownloadService;
