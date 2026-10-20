import { api } from './api';
import type { Reporte, VerificationParam } from '@/types/reporte.types';
import { EstadoOperativoValues, type EstadoOperativo } from '@/constants/estadoOperativo';

/** Maintenance kinds a third-party service can be loaded as. */
export type TipoMttoExterno = 'Preventivo' | 'Correctivo';

export type EstadoOperativoExterno = EstadoOperativo;

export const ESTADOS_OPERATIVOS: EstadoOperativoExterno[] = [...EstadoOperativoValues];

export interface CreateReporteExternoDto {
  tipoMtto: TipoMttoExterno;
  /** YYYY-MM-DD, not later than today. */
  fecha: string;
  estadoOperativo: EstadoOperativoExterno;
  /** A registered provider; when given the server copies its name. */
  proveedorId?: string;
  /** Free-text provider, required when there is no `proveedorId`. */
  proveedor?: string;
  /** The third party's own document number. */
  consecutivoDocumento?: string;
  observacion?: string;
  enlace?: string;
  /** Preventive only. */
  verificationParam?: VerificationParam[];
}

export interface CreateReporteExternoResponse {
  success: boolean;
  message?: string;
  data: Reporte;
  /** `MES_FUERA_DE_CRONOGRAMA` when the month is not in the equipment's scheduled months. */
  warnings?: string[];
}

export const WARNING_MES_FUERA_DE_CRONOGRAMA = 'MES_FUERA_DE_CRONOGRAMA';
/** The service is dated in another year: it is saved but it does not mark a month of the current schedule. */
export const WARNING_SERVICIO_DE_OTRO_ANIO = 'SERVICIO_DE_OTRO_ANIO';

const base = (equipoId: string) => `/equipos/${equipoId}/reportes-externos`;

function toFormData(dto: CreateReporteExternoDto, file?: File): FormData {
  const fd = new FormData();
  Object.entries(dto).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'verificationParam') {
      if (Array.isArray(value) && value.length > 0) fd.append(key, JSON.stringify(value));
      return;
    }
    fd.append(key, String(value));
  });
  if (file) fd.append('documento', file);
  return fd;
}

export const reporteExternoService = {
  create: (equipoId: string, dto: CreateReporteExternoDto, file?: File) =>
    api.post<CreateReporteExternoResponse>(base(equipoId), toFormData(dto, file)).then((r) => r.data),

  remove: (equipoId: string, id: string) =>
    api.delete<{ success: boolean }>(`${base(equipoId)}/${id}`).then((r) => r.data),
};
