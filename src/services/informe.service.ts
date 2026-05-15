import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import { GenerateInformeDto, InformePayload } from '@/types/informe.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['x-tenant-id'] = tenantId;
  return headers;
}

class InformeService {
  /**
   * Fetches the aggregated JSON payload for the maintenance report.
   */
  async generate(dto: GenerateInformeDto): Promise<ApiResponse<InformePayload>> {
    const response = await api.post<ApiResponse<InformePayload>>('/informes/generate', dto);
    return response.data;
  }

  /**
   * Requests the PDF and triggers a browser download.
   * Uses raw fetch (like downloadInventario) because axios does not handle
   * binary Content-Disposition downloads well for this pattern.
   */
  async downloadPdf(dto: GenerateInformeDto): Promise<void> {
    const response = await fetch(`${API_URL}/informes/generate/pdf`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      let message = `Error ${response.status}`;
      try {
        const data = await response.json();
        message = data.message || message;
      } catch { /* ignore parse errors */ }
      throw new Error(message);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Try to get the filename from the Content-Disposition header
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    a.download = match ? match[1] : `Informe_${dto.clienteId}_${dto.mesDesde}-${dto.mesHasta}.pdf`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const informeService = new InformeService();
