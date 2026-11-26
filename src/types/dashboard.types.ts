export type DashboardPeriodo = 'mes_actual' | 'mes_anterior' | 'rango' | 'anio';

export const TIPOS_MTTO = [
  'Preventivo',
  'Correctivo',
  'Predictivo',
  'Instalación',
  'Proactivo',
  'Diagnostico',
] as const;

export type TipoMtto = (typeof TIPOS_MTTO)[number];

/** Filters sent as query params to every /dashboard/* endpoint. */
export interface DashboardFilters {
  periodo: DashboardPeriodo;
  desde?: string;
  hasta?: string;
  anio?: string;
  clienteId?: string;
  sedeId?: string;
  servicioId?: string;
  tipoMtto?: string;
  tecnicoId?: string;
}

export interface DashboardPeriodoInfo {
  desde: string;
  hasta: string;
  etiqueta: string;
}

export interface DashboardBase {
  periodo: DashboardPeriodoInfo;
}

export interface CumplimientoPorCliente {
  clienteId: string;
  cliente: string;
  programadas: number;
  realizadas: number;
  porcentaje: number | null;
}

export interface CumplimientoPorTipo {
  tipo: string;
  programados: number;
  cumplidos: number;
  cancelados: number;
  pendientes: number;
}

export interface CumplimientoTendencia {
  mes: string;
  etiqueta: string;
  programadas: number;
  realizadas: number;
  porcentaje: number | null;
}

export interface DashboardCumplimiento extends DashboardBase {
  /** Absent on older backends; false hides the card. */
  disponible?: boolean;
  programadas: number;
  realizadas: number;
  porcentaje: number | null;
  noProgramadasRealizadas: number;
  porCliente: CumplimientoPorCliente[];
  porTipo: CumplimientoPorTipo[];
  tendencia: CumplimientoTendencia[];
  filtrosNoAplicados: string[];
}

export interface Variacion {
  absoluta: number;
  porcentaje: number | null;
}

export interface EquiposPeriodoCifras {
  programados: number;
  realizados: number;
  pendientes: number;
  vencidos: number;
  cancelados: number;
}

export interface DashboardEquiposPeriodo extends DashboardBase {
  disponible?: boolean;
  actual: EquiposPeriodoCifras;
  anterior: EquiposPeriodoCifras;
  filtrosNoAplicados: string[];
  variacion: Record<keyof EquiposPeriodoCifras, Variacion>;
}

export interface DashboardMisCifras extends DashboardBase {
  disponible: boolean;
  abiertos: number;
  realizados: number;
  cancelados: number;
  tiempoPromedioDias: number | null;
  truncado: boolean;
}

export interface RankingItem {
  userId: string;
  nombre: string;
  realizados: number;
}

export interface DashboardRanking extends DashboardBase {
  disponible: boolean;
  items: RankingItem[];
}

export interface DashboardItems extends DashboardBase {
  disponible: boolean;
  total: number;
  items: Array<{ tipo: string; cantidad: number }>;
}

export interface DashboardTiempos extends DashboardBase {
  disponible: boolean;
  total: number;
  promedioDias: number | null;
  medianaDias: number | null;
  p90Dias: number | null;
  histograma: Array<{ rango: string; cantidad: number }>;
  masLentas: Array<{ otId: string; consecutivo: string | number; promedioDias: number; reportes: number }>;
  truncado: boolean;
}

export interface EstadoCantidad {
  estado: string;
  cantidad: number;
}

export interface DashboardOperativos extends DashboardBase {
  otsPorEstado: { disponible: boolean; items: EstadoCantidad[] };
  preventivoVsCorrectivo: { disponible: boolean; preventivo: number; correctivo: number; otros: number };
  equiposPorEstadoOperativo: { disponible: boolean; items: EstadoCantidad[] };
  ticketsAbiertos: { disponible: boolean; cantidad: number };
  requisicionesPendientes: { disponible: boolean; cantidad: number };
  filtrosNoAplicados: string[];
}

export interface DashboardAlertas extends DashboardBase {
  otsVencidas: {
    disponible: boolean;
    cantidad: number;
    items: Array<{ otId: string; consecutivo: string | number; cliente: string; diasAbierta: number }>;
  };
  equiposSinMantenimiento: {
    disponible: boolean;
    cantidad: number;
    items: Array<{ equipoId: string; nombre: string; serie: string; ultimoMtto: string | null }>;
  };
  filtrosNoAplicados: string[];
}

export type DashboardSeccion =
  | 'cumplimiento'
  | 'equipos-periodo'
  | 'mis-cifras'
  | 'ranking'
  | 'items'
  | 'tiempos'
  | 'operativos'
  | 'alertas';
