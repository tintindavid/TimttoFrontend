/**
 * Tipos para el módulo de Cronogramas de Mantenimiento
 */

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

export interface CronogramaFiltros {
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
  equiposPorMes: Record<Mes, number>;
}

export interface CreateOTFromCronogramaPayload {
  ClienteId: string;
  TipoServicio: string;
  OtPrioridad: string;
  equipos: string[];
  SedeId?: string;
  ServicioId?: string;
}
