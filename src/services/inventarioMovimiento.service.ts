import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import {
  CreateInventarioMovimientoDto,
  InventarioMovimiento,
  InventarioMovimientoQueryParams,
} from '@/types/inventarioRepuesto.types';

export const inventarioMovimientoService = {
  list: async (params: InventarioMovimientoQueryParams = {}) => {
    const response = await api.get<ApiResponse<InventarioMovimiento[]>>('/inventario-movimientos', { params });
    return response.data;
  },

  create: async (data: CreateInventarioMovimientoDto) => {
    const response = await api.post<ApiResponse<InventarioMovimiento>>('/inventario-movimientos', data);
    return response.data;
  },
};
