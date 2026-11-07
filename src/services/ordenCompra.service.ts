import { api } from './api';
import { rethrowDecodingBlobError } from '@/utils/saveBlob';
import { ApiResponse } from '@/types/api.types';
import type {
  AprobarOrdenCompraDto,
  DevolverEntregablesDto,
  OrdenCompraDto,
  RechazarOrdenCompraDto,
  ReenviarOrdenCompraDto,
} from '@/types/ordenCompra.types';
import type { Requisicion } from '@/types/requisicion.types';

/** Purchase order and deliverables endpoints (epic E4). Every write answers with the updated requisicion. */
export const ordenCompraService = {
  emitir: async (id: string, data: OrdenCompraDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/orden-compra`, data);
    return response.data;
  },

  editar: async (id: string, data: OrdenCompraDto) => {
    const response = await api.patch<ApiResponse<Requisicion>>(`/requisiciones/${id}/orden-compra`, data);
    return response.data;
  },

  aprobar: async (id: string, data: AprobarOrdenCompraDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/orden-compra/aprobar`, data);
    return response.data;
  },

  rechazar: async (id: string, data: RechazarOrdenCompraDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/orden-compra/rechazar`, data);
    return response.data;
  },

  enviar: async (id: string) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/orden-compra/enviar`);
    return response.data;
  },

  /** Without body, except `correoEnvio` when the previous send had no e-mail on file. */
  reenviar: async (id: string, data?: ReenviarOrdenCompraDto) => {
    const url = `/requisiciones/${id}/orden-compra/reenviar`;
    const response = data?.correoEnvio
      ? await api.post<ApiResponse<Requisicion>>(url, data)
      : await api.post<ApiResponse<Requisicion>>(url);
    return response.data;
  },

  /** The PDF is generated on demand; the caller turns the blob into a download. */
  descargarPdf: async (id: string): Promise<Blob> => {
    const response = await api
      .get<Blob>(`/requisiciones/${id}/orden-compra/pdf`, { responseType: 'blob' })
      .catch(rethrowDecodingBlobError);
    return response.data;
  },

  /** Multipart: the files under `archivos` (attached on behalf of the supplier). */
  subirEntregables: async (id: string, archivos: File[]) => {
    const form = new FormData();
    archivos.forEach((file) => form.append('archivos', file));
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/entregables`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  marcarRecibidos: async (id: string) => {
    const response = await api.patch<ApiResponse<Requisicion>>(`/requisiciones/${id}/entregables/marcar-recibidos`);
    return response.data;
  },

  revisarEntregables: async (id: string) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/entregables/revisar`);
    return response.data;
  },

  aceptarEntregables: async (id: string) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/entregables/aceptar`);
    return response.data;
  },

  devolverEntregables: async (id: string, data: DevolverEntregablesDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/entregables/devolver`, data);
    return response.data;
  },
};
