import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@/types/api.types';
import {
  PUBLIC_SESSION_QR_TOKEN_KEY,
  PUBLIC_SESSION_STORAGE_KEY,
} from '@/constants/ticket.constants';
import {
  PublicValidateAccessDto,
  PublicValidateAccessResponse,
  PublicSessionDescriptors,
} from '@/types/serviceQr.types';
import {
  CreateTicketBatchPublicDto,
  CreateTicketBatchResponse,
  PublicTicket,
} from '@/types/ticket.types';
import { EquipoItem } from '@/types/equipoItem.types';

/**
 * D7: separate axios instance for the public app — NO panel auth interceptor,
 * sessionToken from `sessionStorage` only (D8), no tenant header, no `x-user-id`.
 *
 * Base URL strips `/api/v1` if present in `VITE_API_URL` so we hit `/public/...`
 * at the API root (backend mounts routes under `/public/tickets`).
 */

const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined) ||
  'http://localhost:3000/api/v1';

const computePublicBase = (apiUrl: string): string => {
  // `VITE_API_URL` typically ends with `/api/v1`. Backend mounts public router at `/public`.
  // Strip the `/api/v1` suffix so we resolve `${origin}/public/tickets/...`.
  const trimmed = apiUrl.replace(/\/$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed.slice(0, -'/api/v1'.length);
  }
  return trimmed;
};

const PUBLIC_BASE_URL = computePublicBase(RAW_API_URL);

const publicApi: AxiosInstance = axios.create({
  baseURL: PUBLIC_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
});

// Attach sessionToken from sessionStorage on every request (NEVER localStorage).
publicApi.interceptors.request.use((config) => {
  const sessionToken = sessionStorage.getItem(PUBLIC_SESSION_STORAGE_KEY);
  if (sessionToken && config.headers) {
    config.headers.Authorization = `Bearer ${sessionToken}`;
  }
  return config;
});

/** Helpers for the sessionStorage-based session lifecycle. */
export const publicSessionStorage = {
  getToken(): string | null {
    return sessionStorage.getItem(PUBLIC_SESSION_STORAGE_KEY);
  },
  setToken(token: string): void {
    sessionStorage.setItem(PUBLIC_SESSION_STORAGE_KEY, token);
  },
  clear(): void {
    sessionStorage.removeItem(PUBLIC_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(PUBLIC_SESSION_QR_TOKEN_KEY);
  },
  getQrToken(): string | null {
    return sessionStorage.getItem(PUBLIC_SESSION_QR_TOKEN_KEY);
  },
  setQrToken(qrToken: string): void {
    sessionStorage.setItem(PUBLIC_SESSION_QR_TOKEN_KEY, qrToken);
  },
};

class PublicTicketService {
  private endpoint = '/public/tickets';

  async validateAccess(
    data: PublicValidateAccessDto
  ): Promise<ApiResponse<PublicValidateAccessResponse>> {
    const res = await publicApi.post<ApiResponse<PublicValidateAccessResponse>>(
      `${this.endpoint}/validate-access`,
      data
    );
    return res.data;
  }

  async sessionMe(): Promise<ApiResponse<PublicSessionDescriptors>> {
    const res = await publicApi.get<ApiResponse<PublicSessionDescriptors>>(
      `${this.endpoint}/session/me`
    );
    return res.data;
  }

  async listEquipments(): Promise<ApiResponse<EquipoItem[]>> {
    const res = await publicApi.get<ApiResponse<EquipoItem[]>>(
      `${this.endpoint}/equipments`
    );
    return res.data;
  }

  async createTickets(
    data: CreateTicketBatchPublicDto
  ): Promise<ApiResponse<CreateTicketBatchResponse>> {
    const res = await publicApi.post<ApiResponse<CreateTicketBatchResponse>>(
      this.endpoint,
      data
    );
    return res.data;
  }

  async listTickets(): Promise<ApiResponse<PublicTicket[]>> {
    const res = await publicApi.get<ApiResponse<PublicTicket[]>>(
      `${this.endpoint}/list`
    );
    return res.data;
  }

  async getTicket(id: string): Promise<ApiResponse<PublicTicket>> {
    const res = await publicApi.get<ApiResponse<PublicTicket>>(
      `${this.endpoint}/${id}`
    );
    return res.data;
  }
}

export const publicTicketService = new PublicTicketService();
export { publicApi };
export default publicTicketService;
