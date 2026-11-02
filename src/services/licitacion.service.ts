import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import type {
  AbrirLicitacionDto,
  AmpliarFechaDto,
  AsignarProveedorDto,
  Comparativo,
  CompraDirectaDto,
  EnviosResultado,
  RegistrarCotizacionDto,
  ReenviarInvitacionDto,
} from '@/types/licitacion.types';
import type { Requisicion } from '@/types/requisicion.types';

/** Requisicion plus the e-mail delivery result returned when invitations go out. */
export type RequisicionConEnvios = Requisicion & { envios?: EnviosResultado };

/** Multipart body of a quotation: optional `archivo` plus the scalar fields that are present. */
const buildCotizacionForm = (data: RegistrarCotizacionDto): FormData => {
  const form = new FormData();
  if (data.archivo) form.append('archivo', data.archivo);
  if (data.linkPropuesta) form.append('linkPropuesta', data.linkPropuesta);
  if (data.observacion) form.append('observacion', data.observacion);
  if (data.valorTotal !== undefined) form.append('valorTotal', String(data.valorTotal));
  if (data.moneda) form.append('moneda', data.moneda);
  if (data.tiempoEntregaDias !== undefined) form.append('tiempoEntregaDias', String(data.tiempoEntregaDias));
  return form;
};

export const licitacionService = {
  asignarProveedor: async (id: string, data: AsignarProveedorDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/proveedores`, data);
    return response.data;
  },

  quitarProveedor: async (id: string, paId: string) => {
    const response = await api.delete<ApiResponse<Requisicion>>(`/requisiciones/${id}/proveedores/${paId}`);
    return response.data;
  },

  abrir: async (id: string, data: AbrirLicitacionDto) => {
    const response = await api.post<ApiResponse<RequisicionConEnvios>>(`/requisiciones/${id}/licitacion/abrir`, data);
    return response.data;
  },

  reenviar: async (id: string, paId: string, data: ReenviarInvitacionDto) => {
    const response = await api.post<ApiResponse<RequisicionConEnvios>>(
      `/requisiciones/${id}/proveedores/${paId}/reenviar`,
      data
    );
    return response.data;
  },

  registrarCotizacion: async (id: string, paId: string, data: RegistrarCotizacionDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(
      `/requisiciones/${id}/proveedores/${paId}/cotizacion`,
      buildCotizacionForm(data),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  ampliarFecha: async (id: string, data: AmpliarFechaDto) => {
    const response = await api.patch<ApiResponse<Requisicion>>(`/requisiciones/${id}/licitacion/fecha-limite`, data);
    return response.data;
  },

  cerrar: async (id: string) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/licitacion/cerrar`);
    return response.data;
  },

  getComparativo: async (id: string) => {
    const response = await api.get<ApiResponse<Comparativo>>(`/requisiciones/${id}/licitacion/comparativo`);
    return response.data;
  },

  seleccionarGanador: async (id: string, paId: string) => {
    const response = await api.patch<ApiResponse<Requisicion>>(
      `/requisiciones/${id}/proveedores/${paId}/seleccionar-ganador`
    );
    return response.data;
  },

  compraDirecta: async (id: string, data: CompraDirectaDto) => {
    const response = await api.post<ApiResponse<Requisicion>>(`/requisiciones/${id}/compra-directa`, data);
    return response.data;
  },
};
