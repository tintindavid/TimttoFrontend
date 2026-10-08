import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import {
  BulkGenerateEquipmentQrDto,
  BulkGenerateEquipmentQrResponse,
  CreateEquipmentQrDto,
  EquipmentQr,
  EquipmentQrBulkFilter,
  EquipmentQrListFilters,
  EquipmentQrListResponse,
} from '@/types/equipmentQr.types';

/**
 * Panel-side axios calls for `/api/equipment-qrs/*` (admin only, gated by the
 * existing `service-qrs:*` permissions per D9).
 */
class EquipmentQrService {
  private endpoint = '/equipment-qrs';

  async list(filters?: EquipmentQrListFilters): Promise<EquipmentQrListResponse> {
    const res = await api.get<EquipmentQrListResponse>(this.endpoint, {
      params: filters,
    });
    return res.data;
  }

  async generateOne(data: CreateEquipmentQrDto): Promise<ApiResponse<EquipmentQr>> {
    const res = await api.post<ApiResponse<EquipmentQr>>(this.endpoint, data);
    return res.data;
  }

  async generateBulk(
    data: BulkGenerateEquipmentQrDto
  ): Promise<ApiResponse<BulkGenerateEquipmentQrResponse>> {
    const res = await api.post<ApiResponse<BulkGenerateEquipmentQrResponse>>(
      `${this.endpoint}/bulk-generate`,
      data
    );
    return res.data;
  }

  async deactivate(id: string): Promise<ApiResponse<EquipmentQr>> {
    const res = await api.post<ApiResponse<EquipmentQr>>(
      `${this.endpoint}/${id}/deactivate`,
      {}
    );
    return res.data;
  }

  async softDelete(id: string): Promise<ApiResponse<{ ok: true }>> {
    const res = await api.delete<ApiResponse<{ ok: true }>>(`${this.endpoint}/${id}`);
    return res.data;
  }

  /** Triggers a browser download of the single-sticker A6 PDF. */
  async exportPdfOne(id: string): Promise<void> {
    const response = await api.get(`${this.endpoint}/export-pdf/${id}`, {
      responseType: 'blob',
    });
    this.downloadBlob(response.data, `qr-equipo-${id}.pdf`);
  }

  /** Triggers a browser download of the bulk A4-landscape PDF (2x5 grid, cap 100). */
  async exportPdfBulk(params: { ids?: string[]; filter?: EquipmentQrBulkFilter }): Promise<void> {
    const query: Record<string, string> = {};
    if (params.ids && params.ids.length > 0) {
      query.ids = params.ids.join(',');
    }
    if (params.filter) {
      query.filter = JSON.stringify(params.filter);
    }
    const response = await api.get(`${this.endpoint}/export-pdf`, {
      params: query,
      responseType: 'blob',
    });
    this.downloadBlob(response.data, `qr-equipos-${Date.now()}.pdf`);
  }

  private downloadBlob(data: BlobPart, filename: string): void {
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Returns the publicly shareable URL for the equipment history landing
   * page. Mirrors `serviceQrService.buildPublicUrl` (serviceQr.service.ts:75-80).
   */
  buildPublicUrl(qrToken: string): string {
    const base =
      (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) ||
      window.location.origin;
    return `${base.replace(/\/$/, '')}/public/equipo/${qrToken}`;
  }
}

export const equipmentQrService = new EquipmentQrService();
export default equipmentQrService;
