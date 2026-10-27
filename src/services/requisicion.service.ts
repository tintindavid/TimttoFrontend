import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import {
  AprobarRequisicionDto,
  CambiarEstadoRequisicionDto,
  CancelarRequisicionDto,
  CreateRequisicionDto,
  ReasignarAprobadoresDto,
  RechazarRequisicionDto,
  REQUISICION_QUERY_KEYS,
  Requisicion,
  RequisicionQueryParams,
  UpdateRequisicionDto,
} from '@/types/requisicion.types';

export const requisicionService = {
  list: async (params: RequisicionQueryParams = {}) => {
    // The backend rejects unknown query keys (400): only the contract's keys are ever sent.
    const allowed = new Set<string>(REQUISICION_QUERY_KEYS);
    const clean = Object.fromEntries(
      Object.entries(params).filter(([key, value]) => allowed.has(key) && value !== undefined && value !== '')
    );
    const response = await api.get<ApiResponse<Requisicion[]>>('/requisiciones', { params: clean });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Requisicion>>(`/requisiciones/${id}`);
    return response.data;
  },

  create: async (data: CreateRequisicionDto) => {
    const response = await api.post<ApiResponse<Requisicion>>('/requisiciones', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRequisicionDto) => {
    const response = await api.patch<ApiResponse<Requisicion>>(`/requisiciones/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/requisiciones/${id}`);
    return response.data;
  },

  enviar: async (id: string) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/enviar`);
    return response.data;
  },

  cancelar: async (id: string, data: CancelarRequisicionDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/cancelar`, data);
    return response.data;
  },

  /** Retire (Enviada/En_Aprobacion) or reopen (Rechazada): back to Borrador. */
  cambiarEstado: async (id: string, data: CambiarEstadoRequisicionDto) => {
    const response = await api.patch<ApiResponse<Requisicion>>(`/requisiciones/${id}/estado`, data);
    return response.data;
  },

  aprobar: async (id: string, data: AprobarRequisicionDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/aprobacion/aprobar`, data);
    return response.data;
  },

  rechazar: async (id: string, data: RechazarRequisicionDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/aprobacion/rechazar`, data);
    return response.data;
  },

  reasignarAprobadores: async (id: string, data: ReasignarAprobadoresDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/aprobacion/reasignar`, data);
    return response.data;
  },
};
