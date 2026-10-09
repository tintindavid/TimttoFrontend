import { api } from './api';
import type {
  ActividadExterna,
  CadenaActividad,
  CadenaConActividades,
  CreateActividadDto,
  UpdateActividadDto,
} from '@/types/actividadExterna.types';

export interface ActividadExternaApiResponse<T> {
  data: T;
  meta?: { total: number; page: number; limit: number };
}

const base = (equipoId: string) => `/equipos/${equipoId}`;

/**
 * Builds multipart body. Nested `frecuencia` is sent as a JSON string (R-PF1);
 * the backend JSON.parses it before validation. No bracket notation.
 */
function toFormData(dto: CreateActividadDto | UpdateActividadDto, file?: File): FormData {
  const fd = new FormData();
  Object.entries(dto).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (k === 'frecuencia' || typeof v === 'object') fd.append(k, JSON.stringify(v));
    else fd.append(k, String(v));
  });
  if (file) fd.append('evidencia', file);
  return fd;
}

export const actividadExternaService = {
  listPorEquipo: (equipoId: string, params?: Record<string, unknown>) =>
    api
      .get<ActividadExternaApiResponse<CadenaConActividades[]>>(`${base(equipoId)}/actividades-externas`, { params })
      .then((r) => r.data),

  getCadenasVigentesPorTipo: (equipoId: string, tipo: string, tipoCustom?: string) =>
    api
      .get<ActividadExternaApiResponse<CadenaActividad[]>>(`${base(equipoId)}/cadenas-actividad`, {
        params: { tipo, tipoCustom, estado: 'vigente' },
      })
      .then((r) => r.data),

  getById: (equipoId: string, id: string) =>
    api
      .get<ActividadExternaApiResponse<ActividadExterna>>(`${base(equipoId)}/actividades-externas/${id}`)
      .then((r) => r.data),

  create: (equipoId: string, dto: CreateActividadDto, file?: File) =>
    api
      .post<ActividadExternaApiResponse<{ cadena: CadenaActividad; actividad: ActividadExterna }>>(
        `${base(equipoId)}/actividades-externas`,
        toFormData(dto, file),
      )
      .then((r) => r.data),

  update: (equipoId: string, id: string, dto: UpdateActividadDto, file?: File) =>
    api
      .patch<ActividadExternaApiResponse<ActividadExterna>>(
        `${base(equipoId)}/actividades-externas/${id}`,
        toFormData(dto, file),
      )
      .then((r) => r.data),

  remove: (equipoId: string, id: string) =>
    api
      .delete<ActividadExternaApiResponse<{ ok: true }>>(`${base(equipoId)}/actividades-externas/${id}`)
      .then((r) => r.data),

  removeEvidencia: (equipoId: string, id: string) =>
    api
      .delete<ActividadExternaApiResponse<ActividadExterna>>(`${base(equipoId)}/actividades-externas/${id}/evidencia`)
      .then((r) => r.data),

  cerrarCadena: (equipoId: string, cadenaId: string, motivoCierre: string) =>
    api
      .patch<ActividadExternaApiResponse<CadenaActividad>>(
        `${base(equipoId)}/cadenas-actividad/${cadenaId}/cerrar`,
        { motivoCierre },
      )
      .then((r) => r.data),
};
