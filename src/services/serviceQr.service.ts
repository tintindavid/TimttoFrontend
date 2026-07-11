import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import {
  CreateServiceQrDto,
  RotateServiceQrPasswordDto,
  ServiceQr,
  ServiceQrListFilters,
} from '@/types/serviceQr.types';

/**
 * Panel-side axios calls for `/api/service-qrs/*` (admin only).
 */
class ServiceQrService {
  private endpoint = '/service-qrs';

  async list(
    filters?: ServiceQrListFilters
  ): Promise<ApiResponse<ServiceQr[]>> {
    const res = await api.get<ApiResponse<ServiceQr[]>>(this.endpoint, {
      params: filters,
    });
    return res.data;
  }

  async getById(id: string): Promise<ApiResponse<ServiceQr>> {
    const res = await api.get<ApiResponse<ServiceQr>>(
      `${this.endpoint}/${id}`
    );
    return res.data;
  }

  async create(data: CreateServiceQrDto): Promise<ApiResponse<ServiceQr>> {
    const res = await api.post<ApiResponse<ServiceQr>>(this.endpoint, data);
    return res.data;
  }

  async rotatePassword(
    id: string,
    data: RotateServiceQrPasswordDto
  ): Promise<ApiResponse<ServiceQr>> {
    const res = await api.patch<ApiResponse<ServiceQr>>(
      `${this.endpoint}/${id}/rotate-password`,
      data
    );
    return res.data;
  }

  async deactivate(id: string): Promise<ApiResponse<ServiceQr>> {
    const res = await api.patch<ApiResponse<ServiceQr>>(
      `${this.endpoint}/${id}/deactivate`,
      {}
    );
    return res.data;
  }

  async activate(id: string): Promise<ApiResponse<ServiceQr>> {
    const res = await api.patch<ApiResponse<ServiceQr>>(
      `${this.endpoint}/${id}/activate`,
      {}
    );
    return res.data;
  }

  async softDelete(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(
      `${this.endpoint}/${id}`
    );
    return res.data;
  }

  /**
   * Returns the publicly shareable URL for the QR landing page.
   * The host is taken from `VITE_PUBLIC_APP_URL` falling back to the current origin.
   */
  buildPublicUrl(qrToken: string): string {
    const base =
      (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) ||
      window.location.origin;
    return `${base.replace(/\/$/, '')}/public/ticket/${qrToken}`;
  }
}

export const serviceQrService = new ServiceQrService();
export default serviceQrService;
