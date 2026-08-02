import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import {
  ClientAccessToken,
  ClientAccessTokenCreatePayload,
  ClientAccessTokenCreateResponse,
  ClientAccessTokenListFilters,
} from '@/types/clientAccessToken.types';

/**
 * Admin-side axios calls for `/api/client-tokens/*` (role `admin` only).
 */
class ClientAccessTokenService {
  private endpoint = '/client-tokens';

  async list(
    filters?: ClientAccessTokenListFilters
  ): Promise<ApiResponse<ClientAccessToken[]>> {
    const res = await api.get<ApiResponse<ClientAccessToken[]>>(this.endpoint, {
      params: filters,
    });
    return res.data;
  }

  async getById(id: string): Promise<ApiResponse<ClientAccessToken>> {
    const res = await api.get<ApiResponse<ClientAccessToken>>(
      `${this.endpoint}/${id}`
    );
    return res.data;
  }

  async create(
    data: ClientAccessTokenCreatePayload
  ): Promise<ApiResponse<ClientAccessTokenCreateResponse>> {
    const res = await api.post<ApiResponse<ClientAccessTokenCreateResponse>>(
      this.endpoint,
      data
    );
    return res.data;
  }

  async revoke(id: string): Promise<ApiResponse<ClientAccessToken>> {
    const res = await api.patch<ApiResponse<ClientAccessToken>>(
      `${this.endpoint}/${id}/revoke`,
      {}
    );
    return res.data;
  }

  async softDelete(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`${this.endpoint}/${id}`);
    return res.data;
  }

  /**
   * Builds the public portal URL for a raw token value. The host is taken
   * from `VITE_PUBLIC_APP_URL` falling back to the current origin, same
   * convention as `serviceQrService.buildPublicUrl`.
   */
  buildPublicUrl(token: string): string {
    const base =
      (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) ||
      window.location.origin;
    return `${base.replace(/\/$/, '')}/portal/${token}`;
  }
}

export const clientAccessTokenService = new ClientAccessTokenService();
export default clientAccessTokenService;
