import { BaseService } from './base.service';
import {
  EquipoItem,
  CreateEquipoItemDto,
  UpdateEquipoItemDto,
  DuplicateCheckParams,
  DuplicateCheckBulkItem,
  DuplicateCheckResult,
  DuplicateCheckBulkResult,
} from '@/types/equipoItem.types';
import { api } from './api';

// Bulk pre-check endpoint caps at 500 items per request (see spec).
const DUPLICATE_CHECK_BULK_CHUNK_SIZE = 500;

class EquipoItemService extends BaseService<EquipoItem, CreateEquipoItemDto, UpdateEquipoItemDto> {
  constructor() {
    super('/equipo-items');
  }

  // Métodos específicos si aplica
  async getByCliente(clienteId: string) {
    const response = await this.getAll({ clienteId });
    return response;
  }

  // Pre-check unario usado por el live-check de EquipoForm
  async checkDuplicate(params: DuplicateCheckParams): Promise<DuplicateCheckResult> {
    const response = await api.get<{ success: boolean; data: DuplicateCheckResult }>(
      '/equipo-items/duplicate-check',
      { params }
    );
    return response.data.data;
  }

  // Pre-check masivo usado por EquipoBulkUpload; chunquea client-side a 500 items por llamada
  async checkDuplicateBulk(items: DuplicateCheckBulkItem[]): Promise<DuplicateCheckBulkResult> {
    if (items.length <= DUPLICATE_CHECK_BULK_CHUNK_SIZE) {
      const response = await api.post<{ success: boolean; data: DuplicateCheckBulkResult }>(
        '/equipo-items/duplicate-check/bulk',
        { items }
      );
      return response.data.data;
    }

    const merged: DuplicateCheckBulkResult = { results: {} };
    for (let i = 0; i < items.length; i += DUPLICATE_CHECK_BULK_CHUNK_SIZE) {
      const chunk = items.slice(i, i + DUPLICATE_CHECK_BULK_CHUNK_SIZE);
      const response = await api.post<{ success: boolean; data: DuplicateCheckBulkResult }>(
        '/equipo-items/duplicate-check/bulk',
        { items: chunk }
      );
      Object.assign(merged.results, response.data.data.results);
    }
    return merged;
  }

  // Obtener equipos por mes con jerarquía Cliente → Servicio → Sede → Equipos
  async getByMes(mes: string) {
    const response = await api.get(`/equipo-items/mes/${mes.toLowerCase()}`);
    return response.data;
  }

  // Actualizar snapshot del equipo desde un reporte
  async updateSnapshot(equipoId: string, data: any) {
    const response = await api.put(`/equipo-items/${equipoId}/snapshot`, {
      ...data,
    });
    return response.data;
  }
}

export const equipoItemService = new EquipoItemService();
