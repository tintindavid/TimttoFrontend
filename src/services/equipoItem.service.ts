import { BaseService } from './base.service';
import { EquipoItem, CreateEquipoItemDto, UpdateEquipoItemDto } from '@/types/equipoItem.types';
import { api } from './api';

class EquipoItemService extends BaseService<EquipoItem, CreateEquipoItemDto, UpdateEquipoItemDto> {
  constructor() {
    super('/equipo-items');
  }

  // Métodos específicos si aplica
  async getByCliente(clienteId: string) {
    const response = await this.getAll({ clienteId });
    return response;
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
