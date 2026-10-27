import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import {
  Area,
  AreaQueryParams,
  CreateAreaDto,
  UpdateAreaDto,
} from '@/types/requisicion.types';

export const areaService = {
  list: async (params: AreaQueryParams = {}) => {
    const response = await api.get<ApiResponse<Area[]>>('/areas', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Area>>(`/areas/${id}`);
    return response.data;
  },

  create: async (data: CreateAreaDto) => {
    const response = await api.post<ApiResponse<Area>>('/areas', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAreaDto) => {
    const response = await api.patch<ApiResponse<Area>>(`/areas/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/areas/${id}`);
    return response.data;
  },
};
