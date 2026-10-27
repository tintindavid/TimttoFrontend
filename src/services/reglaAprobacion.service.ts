import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import {
  ReglaAprobacion,
  ReglaAprobacionQueryParams,
  ReglaWarning,
  CreateReglaAprobacionDto,
  UpdateReglaAprobacionDto,
} from '@/types/requisicion.types';

export const reglaAprobacionService = {
  list: async (params: ReglaAprobacionQueryParams = {}) => {
    const response = await api.get<ApiResponse<ReglaAprobacion[]> & { warnings?: ReglaWarning[] }>('/reglas-aprobacion', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<ReglaAprobacion>>(`/reglas-aprobacion/${id}`);
    return response.data;
  },

  create: async (data: CreateReglaAprobacionDto) => {
    const response = await api.post<ApiResponse<ReglaAprobacion>>('/reglas-aprobacion', data);
    return response.data;
  },

  update: async (id: string, data: UpdateReglaAprobacionDto) => {
    const response = await api.patch<ApiResponse<ReglaAprobacion>>(`/reglas-aprobacion/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/reglas-aprobacion/${id}`);
    return response.data;
  },
};
