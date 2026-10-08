import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@/types/api.types';
import { PublicEquipmentPayload } from '@/types/equipmentQr.types';

/**
 * D16/D7: separate axios instance for the public equipment-history view —
 * NO panel auth interceptor, no sessionToken, no tenant header. Anyone with
 * the `qrToken` can call this. Mirrors `publicTicket.service.ts`'s
 * `publicApi` instance (sibling public app) minus the sessionToken header.
 */

const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined) ||
  'http://localhost:3000/api/v1';

const computePublicBase = (apiUrl: string): string => {
  // `VITE_API_URL` typically ends with `/api/v1`. Backend mounts the public
  // equipment router at `${origin}/api/public/equipo` (NOT `/public/equipo`),
  // so strip only the trailing `/v1` to land at `${origin}/api` and append
  // `/public/equipo/...`.
  const trimmed = apiUrl.replace(/\/$/, '');
  if (trimmed.endsWith('/v1')) {
    return trimmed.slice(0, -'/v1'.length);
  }
  return trimmed;
};

const PUBLIC_BASE_URL = computePublicBase(RAW_API_URL);

const publicEquipmentApi: AxiosInstance = axios.create({
  baseURL: PUBLIC_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
});

class PublicEquipmentService {
  private endpoint = '/public/equipo';

  async getByToken(qrToken: string): Promise<ApiResponse<PublicEquipmentPayload>> {
    const res = await publicEquipmentApi.get<ApiResponse<PublicEquipmentPayload>>(
      `${this.endpoint}/${qrToken}`
    );
    return res.data;
  }
}

export const publicEquipmentService = new PublicEquipmentService();
export { publicEquipmentApi };
export default publicEquipmentService;
