import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import {
  PresupuestoArea,
  PresupuestoResumen,
  PresupuestoResumenParams,
  PresupuestoAreaQueryParams,
  CreatePresupuestoAreaDto,
  UpdatePresupuestoAreaDto,
} from '@/types/requisicion.types';

export const presupuestoAreaService = {
  list: async (params: PresupuestoAreaQueryParams = {}) => {
    const response = await api.get<ApiResponse<PresupuestoArea[]>>('/presupuestos-area', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<PresupuestoArea>>(`/presupuestos-area/${id}`);
    return response.data;
  },

  create: async (data: CreatePresupuestoAreaDto) => {
    const response = await api.post<ApiResponse<PresupuestoArea>>('/presupuestos-area', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePresupuestoAreaDto) => {
    const response = await api.patch<ApiResponse<PresupuestoArea>>(`/presupuestos-area/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/presupuestos-area/${id}`);
    return response.data;
  },

  getResumen: async (params: PresupuestoResumenParams) => {
    const response = await api.get<ApiResponse<PresupuestoResumen>>('/presupuestos-area/resumen', { params });
    return response.data;
  },
};
