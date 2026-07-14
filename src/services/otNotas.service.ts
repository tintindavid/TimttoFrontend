import { api } from './api';
import { ApiResponse } from '@/types/api.types';

export interface OtNota {
  _id?: string;
  descripcion: string;
  fecha: string;
  usuarioId: string;
  usuarioNombre: string;
}

/**
 * Thin wrapper over the /ots/:id/notas endpoints. Each endpoint returns the
 * full notas array so the caller doesn't have to refetch the OT to sync UI.
 */
export const otNotasService = {
  async list(otId: string): Promise<OtNota[]> {
    const response = await api.get<ApiResponse<OtNota[]>>(`/ots/${otId}/notas`);
    return response.data.data || [];
  },

  async add(otId: string, descripcion: string, usuarioNombre: string): Promise<OtNota[]> {
    const response = await api.post<ApiResponse<OtNota[]>>(`/ots/${otId}/notas`, {
      descripcion,
      usuarioNombre,
    });
    return response.data.data || [];
  },

  async remove(otId: string, notaId: string): Promise<OtNota[]> {
    const response = await api.delete<ApiResponse<OtNota[]>>(`/ots/${otId}/notas/${notaId}`);
    return response.data.data || [];
  },
};
