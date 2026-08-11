import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@/types/api.types';

/**
 * Public sheet-sign axios instance (`/firma/:token/*`). Mirrors
 * publicPortal.service.ts — no auth interceptor, opaque token in URL path.
 * Base URL strips `/api/v1` so we hit `${origin}/public/sheet-sign/...`.
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

export type PublicSheetSignStatus = 'active' | 'signed' | 'expired' | 'revoked' | 'superseded';

export interface PublicSheetSignData {
  status: PublicSheetSignStatus;
  expiresAt: string;
  sheet: {
    _id: string;
    numeroHoja: string | null;
    otConsecutivo: string | null;
    clienteNombre: string | null;
    estado: string;
  };
  tenant: {
    name: string | null;
    logoUrl: string | null;
  };
  previewHtml?: string;
  pdfUrl?: string | null;
  pdfStatus?: 'pending' | 'ready' | 'error';
}

export interface SubmitSignaturePayload {
  signature: {
    imagePng: string;
    signerName: string;
    cargo?: string;
    observaciones?: string;
  };
}

export interface SubmitSignatureResponse {
  status: 'signed';
  sheetId: string;
  pdfStatus: 'pending' | 'ready';
  expiresAt: string;
}

class PublicSheetSignService {
  private endpoint = '/public/sheet-sign';

  async getByToken(token: string): Promise<ApiResponse<PublicSheetSignData>> {
    const res = await api.get<ApiResponse<PublicSheetSignData>>(`${this.endpoint}/${token}`);
    return res.data;
  }

  async sign(token: string, payload: SubmitSignaturePayload): Promise<ApiResponse<SubmitSignatureResponse>> {
    const res = await api.post<ApiResponse<SubmitSignatureResponse>>(
      `${this.endpoint}/${token}`,
      payload
    );
    return res.data;
  }
}

export const publicSheetSignService = new PublicSheetSignService();
export default publicSheetSignService;
