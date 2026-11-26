import { api } from './api';
import type { ApiResponse } from '@/types/api.types';
import type { EquipoEncontrado, ResumenEquipo } from '@/types/busquedaEquipo.types';

export class BusquedaEquipoService {
  static async buscar(q: string, signal?: AbortSignal): Promise<EquipoEncontrado[]> {
    const response = await api.get<ApiResponse<EquipoEncontrado[]>>('/busqueda/equipos', { params: { q }, signal });
    return response.data.data;
  }

  static async getResumen(equipoId: string): Promise<ResumenEquipo> {
    const response = await api.get<ApiResponse<ResumenEquipo>>(
      `/busqueda/equipos/${encodeURIComponent(equipoId)}/resumen`
    );
    return response.data.data;
  }
}
