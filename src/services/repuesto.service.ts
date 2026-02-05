import { api } from './api';
import { Repuesto, CreateRepuestoSolicitudDto, InstalarRepuestoDto } from '@/types/repuesto.types';
import { ApiResponse } from '@/types/api.types';

export const repuestoService = {
  // Obtener repuestos por reporte
  getByReporte: async (reporteId: string) => {
    const response = await api.get<ApiResponse<Repuesto[]>>(`/repuestos/reporte/${reporteId}`);
    return response.data;
  },

  // Obtener repuestos por OT
  getByOt: async (otId: string) => {
    const response = await api.get<ApiResponse<Repuesto[]>>(`/repuestos/ot/${otId}`);
    return response.data;
  },

  // Obtener repuestos por EquipoId
  getByEquipo: async (equipoId: string, estado?: string) => {
    const params: any = {};
    if (estado) {
      params.estado = estado;
    }
    const response = await api.get<ApiResponse<Repuesto[]>>(`/repuestos/equipo/${equipoId}`, { params });
    return response.data;
  },

  // Crear solicitud de repuesto
  createSolicitud: async (reporteId: string, otId: string, equipoId: string, data: CreateRepuestoSolicitudDto) => {
    const repuestoData = {
      ...data,
      OrdenId: otId,
      EquipoId: equipoId,
      ReporteSolicitudId: reporteId,
      FechaSolicitud: new Date(),
      EstadoSolicitud: 'Solicitado'
    };
    const response = await api.post<ApiResponse<Repuesto>>('/repuestos', repuestoData);
    return response.data;
  },

  // Instalar repuesto (actualizar solicitud existente)
  instalarRepuesto: async (data: InstalarRepuestoDto, reporteId: string) => {
    const repuestoData = {
      CantidadInstalacion: data.CantidadInstalacion,
      FechaInstalacion: data.FechaInstalacion,
      ObservacionInstalacion: data.ObservacionInstalacion,
      ResponsableInstalacion: data.ResponsableInstalacion,
      ReporteInstalacionId: reporteId,
      EstadoSolicitud: 'Instalado'
    };
    const response = await api.put<ApiResponse<Repuesto>>(`/repuestos/${data._id}`, repuestoData);
    return response.data;
  },

  // Obtener repuesto por ID
  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Repuesto>>(`/repuestos/${id}`);
    return response.data;
  },

  // Actualizar repuesto
  update: async (id: string, data: Partial<Repuesto>) => {
    const response = await api.put<ApiResponse<Repuesto>>(`/repuestos/${id}`, data);
    return response.data;
  },

  // Eliminar repuesto
  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/repuestos/${id}`);
    return response.data;
  }
};