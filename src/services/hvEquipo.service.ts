import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import { HVEquipo, CreateHVEquipoDto, UpdateHVEquipoDto, HVEquipoFilters, DocumentoPayload } from '@/types/hvEquipo.types';

const BASE_URL = '/hv-equipo';

const buildDocumentoFormData = (payload: Partial<DocumentoPayload>): FormData => {
  const formData = new FormData();
  if (payload.nombre !== undefined) formData.append('nombre', payload.nombre);
  if (payload.link !== undefined) formData.append('link', payload.link);
  if (payload.categoria) formData.append('categoria', payload.categoria);
  if (payload.archivo) formData.append('archivo', payload.archivo);
  return formData;
};

export const hvEquipoService = {
  /**
   * Obtener todas las HV Equipos con filtros
   */
  getAll: async (filters?: HVEquipoFilters): Promise<ApiResponse<HVEquipo[]>> => {
    const response = await api.get<ApiResponse<HVEquipo[]>>(BASE_URL, { params: filters });
    return response.data;
  },

  /**
   * Obtener HV Equipo por ID
   */
  getById: async (id: string): Promise<ApiResponse<HVEquipo>> => {
    const response = await api.get<ApiResponse<HVEquipo>>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Obtener HV Equipos aprobadas por marca y modelo
   */
  getByMarcaModelo: async (marca: string, modelo: string, filters?: HVEquipoFilters): Promise<ApiResponse<HVEquipo[]>> => {
    const response = await api.get<ApiResponse<HVEquipo[]>>(
      `${BASE_URL}/aprobadas/${encodeURIComponent(marca)}/${encodeURIComponent(modelo)}`,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Obtener HV Equipo por EquipoId
   */
  getByEquipoId: async (equipoId: string): Promise<ApiResponse<HVEquipo>> => {
    const response = await api.get<ApiResponse<HVEquipo>>(`${BASE_URL}/equipo/${equipoId}`);
    return response.data;
  },

  /**
   * Crear nueva HV Equipo
   */
  create: async (data: CreateHVEquipoDto): Promise<ApiResponse<HVEquipo>> => {
    const response = await api.post<ApiResponse<HVEquipo>>(BASE_URL, data);
    return response.data;
  },

  /**
   * Actualizar HV Equipo
   */
  update: async (id: string, data: UpdateHVEquipoDto): Promise<ApiResponse<HVEquipo>> => {
    const response = await api.put<ApiResponse<HVEquipo>>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar HV Equipo (soft delete)
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Subir/agregar un documento a la HV (multipart)
   */
  uploadDocumento: async (hvId: string, payload: DocumentoPayload): Promise<ApiResponse<HVEquipo>> => {
    const response = await api.post<ApiResponse<HVEquipo>>(
      `${BASE_URL}/${hvId}/documentos`,
      buildDocumentoFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  /**
   * Actualizar/reemplazar un documento de la HV (multipart)
   */
  updateDocumento: async (hvId: string, docId: string, payload: Partial<DocumentoPayload>): Promise<ApiResponse<HVEquipo>> => {
    const response = await api.put<ApiResponse<HVEquipo>>(
      `${BASE_URL}/${hvId}/documentos/${docId}`,
      buildDocumentoFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  /**
   * Eliminar un documento de la HV
   */
  deleteDocumento: async (hvId: string, docId: string): Promise<ApiResponse<HVEquipo>> => {
    const response = await api.delete<ApiResponse<HVEquipo>>(`${BASE_URL}/${hvId}/documentos/${docId}`);
    return response.data;
  },

  /**
   * Descargar PDF de HV Equipo aprobada
   */
  downloadPDF: async (hvId: string): Promise<void> => {
    try {
      const response = await api.get(`${BASE_URL}/${hvId}/pdf`, {
        responseType: 'blob',
      });

      // Crear un blob con el contenido del PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HV_Equipo_${hvId}_${new Date().getTime()}.pdf`;
      
      // Simular clic en el enlace para descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar PDF de HV:', error);
      throw error;
    }
  },
};
