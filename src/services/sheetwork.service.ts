import { ApiResponse } from '@/types';
import { api } from './api';
import { SheetWork } from '@/types/reporte.types';

/**
 * Servicio para gestión de hojas de trabajo (worksheets)
 */
export const sheetworkService = {
  /**
   * Obtener todas las hojas de trabajo con filtros y paginación
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    clienteId?: string;
    estado?: string;
    startDate?: string;
    endDate?: string;
    numeroHoja?: string;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.clienteId) queryParams.append('clienteId', params.clienteId);
    if (params?.estado) queryParams.append('estado', params.estado);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.numeroHoja) queryParams.append('numeroHoja', params.numeroHoja);
    
    const url = `/worksheets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<SheetWork[]>>(url);
    return response.data;
  },

  /**
   * Obtener hojas de trabajo por OT
   */
  getByOT: async (otId: string) => {
    const response = await api.get<ApiResponse<SheetWork[]>>(`/worksheets/ot/${otId}`);
    return response.data;
  },

  /**
   * Obtener una hoja de trabajo por ID
   */
  getById: async (id: string) => {
    const response = await api.get<ApiResponse<SheetWork>>(`/worksheets/${id}`);
    return response.data;
  },

  /**
   * Crear hoja de trabajo
   */
  create: async (data: {
    otId: string;
    reports: string[];
    personaRecibe?: string;
    cargoRecibe?: string;
    firmaFile?: string;
    responsable?: string;
    cargoResponsable?: string;
    fullNameResponsable?: string;
    firmaResponsableFile?: string;
    clienteId?: string;
    observaciones?: string;
  }) => {
    const response = await api.post<ApiResponse<SheetWork>>('/worksheets', {
      ...data,
      estado: 'Borrador',
      fechaCreacion: new Date().toISOString(),
    });
    return response.data;
  },

  /**
   * Firmar hoja de trabajo
   */
  sign: async (id: string, firmaCliente: string) => {
    const response = await api.put<ApiResponse<SheetWork>>(
      `/worksheets/${id}/sign`,
      { firmaCliente, fechaFirma: new Date().toISOString() }
    );
    return response.data;
  },

  /**
   * Cerrar hoja de trabajo
   */
  close: async (id: string) => {
    const response = await api.put<ApiResponse<SheetWork>>(
      `/worksheets/${id}/close`,
      { estado: 'Cerrada' }
    );
    return response.data;
  },

  /**
   * Actualizar observaciones
   */
  updateObservaciones: async (id: string, observaciones: string) => {
    const response = await api.put<ApiResponse<SheetWork>>(
      `/worksheets/${id}/observaciones`,
      { observaciones }
    );
    return response.data;
  },

  /**
   * Obtener PDF de hoja de trabajo
   */
  getPDF: async (id: string) => {
    const response = await api.get(`/worksheets/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default sheetworkService;
