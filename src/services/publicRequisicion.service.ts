import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@/types/api.types';
import type { CotizacionProveedor, EstadoEnvioProveedor, RegistrarCotizacionDto } from '@/types/licitacion.types';

/**
 * Supplier portal service (`/public/requisiciones/:token`). Deliberately NOT built on the shared `api`
 * instance: no session token, no tenant headers, no interceptors. The opaque token lives only in the URL
 * path; it is never logged nor stored.
 */
const BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000/api/v1').replace(/\/$/, '');

const publicApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { Accept: 'application/json' },
  timeout: 20000,
  withCredentials: false,
});

export interface PublicRequisicionItem {
  descripcion: string;
  cantidad: number;
  unidad: string;
  especificacion?: string | null;
}

export interface PublicRequisicion {
  tenantNombre: string;
  consecutivo: string;
  titulo: string;
  /** Optional instructions written by the buyer for the suppliers. */
  instrucciones?: string | null;
  fechaLimiteCotizacion: string;
  items: PublicRequisicionItem[];
  estadoEnvio: EstadoEnvioProveedor;
  cotizacion: CotizacionProveedor | null;
  cerrada: boolean;
}

/**
 * Error stripped of the axios request/config: those carry the URL, i.e. the token, and loggers (React Query,
 * the console, error trackers) print them. Only the status and the backend error code survive.
 */
export class PublicRequisicionError extends Error {
  response: { status?: number; data: { error: { code?: string } } };

  constructor(status?: number, code?: string) {
    super('Public requisicion request failed');
    this.name = 'PublicRequisicionError';
    this.response = { status, data: { error: { code } } };
  }
}

const sanitize = (err: unknown): never => {
  const response = (err as { response?: { status?: number; data?: { error?: { code?: string } } } })?.response;
  throw new PublicRequisicionError(response?.status, response?.data?.error?.code);
};

const path = (token: string): string => `/public/requisiciones/${encodeURIComponent(token)}`;

/** Multipart body of the quotation: optional `archivo` plus the scalar fields that are present. */
const buildForm = (data: RegistrarCotizacionDto): FormData => {
  const form = new FormData();
  if (data.archivo) form.append('archivo', data.archivo);
  if (data.linkPropuesta) form.append('linkPropuesta', data.linkPropuesta);
  if (data.observacion) form.append('observacion', data.observacion);
  if (data.valorTotal !== undefined) form.append('valorTotal', String(data.valorTotal));
  if (data.moneda) form.append('moneda', data.moneda);
  if (data.tiempoEntregaDias !== undefined) form.append('tiempoEntregaDias', String(data.tiempoEntregaDias));
  return form;
};

export const publicRequisicionService = {
  get: async (token: string) => {
    const response = await publicApi.get<ApiResponse<PublicRequisicion>>(path(token)).catch(sanitize);
    return response.data;
  },

  responderInvitacion: async (token: string, aceptar: boolean) => {
    const response = await publicApi.patch<ApiResponse<PublicRequisicion>>(`${path(token)}/respuesta-invitacion`, { aceptar }).catch(sanitize);
    return response.data;
  },

  enviarCotizacion: async (token: string, data: RegistrarCotizacionDto) => {
    const response = await publicApi.patch<ApiResponse<PublicRequisicion>>(`${path(token)}/respuesta`, buildForm(data), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).catch(sanitize);
    return response.data;
  },
};
