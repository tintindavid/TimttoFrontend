/**
 * Tipos para el módulo de Cronogramas de Mantenimiento
 */

import type { TipoActividad } from './actividadExterna.types';

export type Mes = 'Ene' | 'Feb' | 'Mar' | 'Abr' | 'May' | 'Jun' | 'Jul' | 'Ago' | 'Sep' | 'Oct' | 'Nov' | 'Dic';

export const MESES: Mes[] = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const MESES_MAP: Record<Mes, string> = {
  'Ene': 'Enero',
  'Feb': 'Febrero',
  'Mar': 'Marzo',
  'Abr': 'Abril',
  'May': 'Mayo',
  'Jun': 'Junio',
  'Jul': 'Julio',
  'Ago': 'Agosto',
  'Sep': 'Septiembre',
  'Oct': 'Octubre',
  'Nov': 'Noviembre',
  'Dic': 'Diciembre'
};

/** Origin of a scheduled item: preventive maintenance or an external activity. */
export type OrigenCronograma = 'todos' | 'preventivo' | 'externo';

/** Scheduled external activity (chain) as returned by GET /cronogramas/actividades-externas. */
export interface CronogramaActividadExterna {
  cadenaId: string;
  equipoId: string;
  clienteId: string;
  tipo: TipoActividad;
  tipoCustom: string | null;
  frecuenciaMeses: number | null;
  fechaProxima: string;
  /** Three-letter lower-case months (ene..dic), same format as mesesMtto. */
  meses: string[];
  /** Months of the requested year in which an activity of this chain was registered. */
  realizadas: { mes: string; fecha: string }[];
  vencida: boolean;
  diasParaVencer: number | null;
  proveedor: string | null;
  proveedorId: string | null;
  equipo: {
    nombre: string | null;
    marca: string | null;
    modelo: string | null;
    serie: string | null;
    inventario: string | null;
    ubicacion: string | null;
  };
  cliente: { razonsocial: string } | null;
}

export interface ActividadesExternasParams {
  clienteId?: string;
  mes?: string;
  tipo?: TipoActividad;
  /** Year used to compute the executed months (default: the current year). */
  anio?: number;
  limit?: number;
}

export interface ActividadesExternasResponse {
  success: boolean;
  data: CronogramaActividadExterna[];
  truncated: boolean;
}

export interface CronogramaFiltros {
  origen?: OrigenCronograma;
  clienteId?: string;
  sedeIds?: string[];
  servicioIds?: string[];
  ubicaciones?: string[];
  meses?: Mes[];
  estado?: string;
  search?: string;
}

export interface CronogramaEquipo {
  _id: string;
  ItemId?: string | {
    _id: string;
    Nombre?: string;
  };
  Marca?: string;
  Modelo?: string;
  Serie?: string;
  Inventario?: string;
  Ubicacion?: string;
  Estado?: string;
  EstadoOperativo?: string;
  Riesgo?: string;
  Invima?: string;
  SedeId?: string | {
    _id: string;
    nombreSede?: string;
  };
  Servicio?: string | {
    _id: string;
    nombre?: string;
  };
  mesesMtto?: Mes[];
  /** Maintenance reports already done ('ene'..'dic' plus date). */
  mesesRealizados?: { fecha?: string; mes: string; consecutivo?: string }[];
  /** Scheduled external activities of this equipment (cronograma-actividades-externas). */
  cadenas?: CronogramaActividadExterna[];
  ClienteId?: string | {
    _id: string;
    Razonsocial?: string;
  };
}

/**
 * Grupo de equipos por servicio y sede
 */
export interface GrupoServicioSede {
  servicio: string;
  sede: string;
  equipos: CronogramaEquipo[];
}

export interface CronogramaStats {
  totalEquipos: number;
  equiposVisibles: number;
  equiposSeleccionados: number;
  equiposVisiblesSeleccionados: number;
  /** Equipment with preventive maintenance per month. */
  equiposPorMes: Record<Mes, number>;
  /** Equipment with a scheduled external activity per month. */
  equiposPorMesExterno?: Record<Mes, number>;
  externasVencidas?: number;
  /** Not overdue and due within 30 days. */
  externasPorVencer?: number;
}

export interface CreateOTFromCronogramaPayload {
  ClienteId: string;
  TipoServicio: string;
  OtPrioridad: string;
  equipos: string[];
  SedeId?: string;
  ServicioId?: string;
}

/** State of one month cell of an activity row. */
export type EstadoMesActividad = 'realizado' | 'programado' | 'vencido' | null;

/** One row of the schedule grid: preventive maintenance or one external activity. */
export interface FilaActividad {
  key: string;
  tipo: 'mp' | 'externa';
  /** Short label for the Act column ("MP", "Cal", "Ver"...). */
  etiqueta: string;
  /** Full name for the tooltip. */
  titulo: string;
  cadena?: CronogramaActividadExterna;
}
