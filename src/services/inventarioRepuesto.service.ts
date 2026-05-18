import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import {
  CreateInventarioRepuestoDto,
  InventarioRepuesto,
  InventarioRepuestoQueryParams,
  UpdateInventarioRepuestoDto,
} from '@/types/inventarioRepuesto.types';

export const inventarioRepuestoService = {
  list: async (params: InventarioRepuestoQueryParams = {}) => {
    const response = await api.get<ApiResponse<InventarioRepuesto[]>>('/inventario-repuestos', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<InventarioRepuesto>>(`/inventario-repuestos/${id}`);
    return response.data;
  },

  create: async (data: CreateInventarioRepuestoDto) => {
    const response = await api.post<ApiResponse<InventarioRepuesto>>('/inventario-repuestos', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInventarioRepuestoDto) => {
    const response = await api.put<ApiResponse<InventarioRepuesto>>(`/inventario-repuestos/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/inventario-repuestos/${id}`);
    return response.data;
  },
};
