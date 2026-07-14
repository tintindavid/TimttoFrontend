import { ApiResponse } from '@/types';
import { api } from './api';
import {
  Reporte,
  ActividadRealizada,
  Evidencia,
  RepuestoReporte,
  VerificationParam,
} from '@/types/reporte.types';


export const reporteService = {
  // Get all reportes with filters (for closed reports, etc.)
  getAll: async (params?: { 
    page?: number; 
    limit?: number;
    estado?: string;
    clienteId?: string;
    equipoId?: string;
    startDate?: string;
    endDate?: string;
    tipoMtto?: string;
    servicio?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.estado) queryParams.append('estado', params.estado);
    if (params?.clienteId) queryParams.append('clienteId', params.clienteId);
    if (params?.equipoId) queryParams.append('equipoId', params.equipoId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.tipoMtto) queryParams.append('tipoMtto', params.tipoMtto);
    if (params?.servicio) queryParams.append('servicio', params.servicio);
    
    const url = `/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<Reporte[]>>(url);
    return response.data;
  },

  // Get reportes by OT ID
  getReportesByOT: async (otId: string) => {
    const response = await api.get<ApiResponse<Reporte[]>>(`/reports/ot/${otId}`);
    return response.data;
  },

  // Get reportes by Equipo ID
  getReportesByEquipo: async (equipoId: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/reports/equipo/${equipoId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<Reporte[]>>(url);
    return response.data;
  },

  // Get single reporte
  getReporte: async (id: string) => {
    const response = await api.get<ApiResponse<Reporte>>(`/reports/${id}`);
    return response.data;
  },

  // Update reporte
  updateReporte: async (id: string, data: Partial<Reporte>) => {
    const response = await api.put<ApiResponse<Reporte>>(`/reportes/${id}`, data);
    return response.data;
  },

  // Revert a processed reporte back to Pendiente. Dedicated endpoint because
  // the generic PUT rejects null on fechaProcesado / ResponsableMtto — the
  // backend uses $unset to actually clear those fields.
  unprocessReporte: async (id: string) => {
    const response = await api.put<ApiResponse<Reporte>>(`/reports/${id}/unprocess`);
    return response.data;
  },

  // Update equipment snapshot
  updateEquipoSnapshot: async (reporteId: string, equipoSnapshot: any) => {
    const response = await api.put<ApiResponse<Reporte>>(
      `/reportes/${reporteId}/equipo-snapshot`, 
      { equipoSnapshot }
    );
    return response.data;
  },

  // Add activity
  addActividad: async (reporteId: string, actividad: Omit<ActividadRealizada, '_id' | 'fecha'>) => {
    const response = await api.post<ApiResponse<Reporte>>(
      `/reportes/${reporteId}/actividades`, 
      actividad
    );
    return response.data;
  },

  // Update activity
  updateActividad: async (reporteId: string, actividadId: string, data: Partial<ActividadRealizada>) => {
    const response = await api.put<ApiResponse<Reporte>>(
      `/reportes/${reporteId}/actividades/${actividadId}`, 
      data
    );
    return response.data;
  },

  // Delete activity
  deleteActividad: async (reporteId: string, actividadId: string) => {
    const response = await api.delete<ApiResponse<null>>(
      `/reportes/${reporteId}/actividades/${actividadId}`
    );
    return response.data;
  },

  // Upload 1..N evidences in a single multipart request.
  // `descripciones`, when provided, must be a parallel array of strings (use '' for none).
  //
  // Override the global 10s axios timeout: mobile uploads with several 5MB
  // photos routinely take 20-60s. Under the default the request timed out
  // client-side while the backend still finished the write, causing the user
  // to retry and produce duplicate evidences.
  uploadEvidencias: async (reporteId: string, files: File[], descripciones?: string[]) => {
    const formData = new FormData();
    files.forEach((file, i) => {
      formData.append('evidencias', file);
      // Always append a value (possibly empty) for each file so server-side indices line up.
      formData.append('descripciones', (descripciones?.[i] ?? '').toString());
    });
    const response = await api.post<ApiResponse<{ evidencias: Evidencia[] }>>(
      `/reports/${reporteId}/evidencias`,
      formData,
      { timeout: 120000 },
    );
    return response.data;
  },

  // Update the descripcion of one already-saved evidence
  updateEvidencia: async (reporteId: string, evidenciaId: string, descripcion: string) => {
    const response = await api.patch<ApiResponse<{ evidencias: Evidencia[] }>>(
      `/reports/${reporteId}/evidencias/${evidenciaId}`,
      { descripcion }
    );
    return response.data;
  },

  // Delete a single evidence
  deleteEvidencia: async (reporteId: string, evidenciaId: string) => {
    const response = await api.delete<ApiResponse<{ evidencias: Evidencia[] }>>(
      `/reports/${reporteId}/evidencias/${evidenciaId}`
    );
    return response.data;
  },

  // Replace the full verificationParam[] array on a Report.
  updateVerificationParams: async (
    reporteId: string,
    verificationParam: VerificationParam[]
  ) => {
    const response = await api.patch<ApiResponse<Reporte>>(
      `/reports/${reporteId}/verification-params`,
      { verificationParam }
    );
    return response.data;
  },

  // Add repuesto
  addRepuesto: async (reporteId: string, repuesto: Omit<RepuestoReporte, '_id'>) => {
    const response = await api.post<ApiResponse<Reporte>>(
      `/reportes/${reporteId}/repuestos`, 
      repuesto
    );
    return response.data;
  },

  // Update repuesto
  updateRepuesto: async (reporteId: string, repuestoId: string, data: Partial<RepuestoReporte>) => {
    const response = await api.put<ApiResponse<Reporte>>(
      `/reportes/${reporteId}/repuestos/${repuestoId}`, 
      data
    );
    return response.data;
  },

  // Delete repuesto
  deleteRepuesto: async (reporteId: string, repuestoId: string) => {
    const response = await api.delete<ApiResponse<null>>(
      `/reportes/${reporteId}/repuestos/${repuestoId}`
    );
    return response.data;
  },

  // Mark as processed
  markAsProcessed: async (reporteId: string, reporteData: Partial<Reporte>) => {
    const response = await api.put<ApiResponse<Reporte>>(
      `/reports/${reporteId}/procesar`,
      reporteData
    );
    return response.data;
  },

  // Unmark as processed
  unmarkAsProcessed: async (reporteId: string) => {
    const response = await api.put<ApiResponse<Reporte>>(
      `/reportes/${reporteId}/procesar`,
      { procesado: false, fechaProcesado: null }
    );
    return response.data;
  },

  // Get worksheets by OT ID
  getWorkSheetsByOT: async (otId: string) => {
    const response = await api.get<ApiResponse<any[]>>(`/worksheets/ot/${otId}`);
    return response.data;
  },

  // Create worksheet
  createWorkSheet: async (
    otId: string, 
    equiposIds: string[],
    datosRecepcion?: { recibe: string; cargo: string; firma: string; responsable: string; cargoResponsable?: string; fullName?: string; firmaResponsableFile?: string; clienteId?: string }
  ) => {

    const response = await api.post<ApiResponse<any>>(
      `/worksheets`,
      { 
        otId,
        reports: equiposIds,
        estado: 'Borrador',
        fechaCreacion: new Date().toISOString(),
        ...(datosRecepcion && {
          personaRecibe: datosRecepcion.recibe,
          cargoRecibe: datosRecepcion.cargo,
          firmaFile: datosRecepcion.firma,
          responsable: datosRecepcion.responsable,
          cargoResponsable: datosRecepcion.cargoResponsable,
          fullNameResponsable: datosRecepcion.fullName,
          firmaResponsableFile: datosRecepcion.firmaResponsableFile,
          clienteId: datosRecepcion.clienteId
        })
      }
    );
    return response.data;
  },

  // Sign worksheet
  signWorkSheet: async (sheetId: string, firma: string) => {
    const response = await api.put<ApiResponse<any>>(
      `/worksheets/${sheetId}/firmar`,
      { 
        firmaCliente: firma,
        fechaFirma: new Date().toISOString(),
        estado: 'Firmada'
      }
    );
    return response.data;
  },

  // Get worksheet PDF
  getWorkSheetPDF: async (sheetId: string) => {
    const response = await api.get(
      `/worksheets/${sheetId}/pdf`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Update observations
  updateObservaciones: async (reporteId: string, observaciones: string) => {
    const response = await api.put<ApiResponse<Reporte>>(
      `/reportes/${reporteId}/observaciones`,
      { observaciones }
    );
    return response.data;
  },

  // Update diagnosis
  updateDiagnostico: async (reporteId: string, diagnostico: string, causaFalla?: string) => {
    const response = await api.put<ApiResponse<Reporte>>(
      `/reportes/${reporteId}/diagnostico`,
      { diagnostico, causaFalla }
    );
    return response.data;
  },

  // Get available protocols for equipment
  getProtocolosEquipo: async (equipmentId: string, tipoMantenimiento: string) => {
    const response = await api.get<ApiResponse<any[]>>(
      `/protocolos?equipmentId=${equipmentId}&tipo=${tipoMantenimiento}`
    );
    return response.data;
  },

  // Update protocol step completion
  updateProtocolStep: async (reporteId: string, protocoloId: string, stepId: string, completed: boolean) => {
    const response = await api.put<ApiResponse<Reporte>>(
      `/reportes/${reporteId}/protocolos/${protocoloId}/steps/${stepId}`,
      { completed, fechaCompleto: completed ? new Date().toISOString() : null }
    );
    return response.data;
  }
};

export default reporteService;