import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import {
  TipoRequisicion,
  TipoRequisicionQueryParams,
  CreateTipoRequisicionDto,
  UpdateTipoRequisicionDto,
} from '@/types/requisicion.types';

export const tipoRequisicionService = {
  list: async (params: TipoRequisicionQueryParams = {}) => {
    const response = await api.get<ApiResponse<TipoRequisicion[]>>('/tipos-requisicion', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<TipoRequisicion>>(`/tipos-requisicion/${id}`);
    return response.data;
  },

  create: async (data: CreateTipoRequisicionDto) => {
    const response = await api.post<ApiResponse<TipoRequisicion>>('/tipos-requisicion', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTipoRequisicionDto) => {
    const response = await api.patch<ApiResponse<TipoRequisicion>>(`/tipos-requisicion/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/tipos-requisicion/${id}`);
    return response.data;
  },
};
