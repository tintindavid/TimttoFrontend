export type MonthCode = 'ene' | 'feb' | 'mar' | 'abr' | 'may' | 'jun' | 'jul' | 'ago' | 'sep' | 'oct' | 'nov' | 'dic';

export const MONTHS: MonthCode[] = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const MONTH_LABELS: Record<MonthCode, string> = {
  ene: 'Enero', feb: 'Febrero', mar: 'Marzo',  abr: 'Abril',
  may: 'Mayo',  jun: 'Junio',   jul: 'Julio',   ago: 'Agosto',
  sep: 'Septiembre', oct: 'Octubre', nov: 'Noviembre', dic: 'Diciembre',
};

export interface GenerateInformeDto {
  clienteId: string;
  mesDesde: MonthCode;
  mesHasta: MonthCode;
  observacionGeneral?: string;
}

export interface InformeMeta {
  clienteId: string;
  clienteNombre: string;
  clienteCiudad: string;
  clienteLogo: string | null;
  periodoDesde: MonthCode;
  periodoHasta: MonthCode;
  periodoLabel: string;
  fechaGeneracion: string;
  mesesSeleccionados: MonthCode[];
  tenantNombre: string;
  responsableNombre: string;
}

export interface InformeKpis {
  cumplimientoPreventivo: number;
  totalProgramados: number;
  totalRealizados: number;
  totalCorrectivos: number;
  totalRepuestosSolicitados: number;
  totalRepuestosInstalados: number;
  costoTotalRepuestos: number;
  horasServicio: number;
}

export type ReportEstado = 'Realizado' | 'Programado' | 'Cancelado';
export type TipoMtto    = 'Preventivo' | 'Correctivo' | 'Predictivo';

export interface ReportRow {
  consecutivo: string;
  equipoNombre: string;
  marca: string;
  serie: string;
  sede: string;
  servicio: string;
  tipoMtto: TipoMtto;
  estado: ReportEstado;
  fechaProgramada: string | null;
  fechaRealizado: string | null;
  fechaCerrado: string | null;
  tecnico: string;
  diagnostico: string;
  accionTomada: string;
  observacion: string;
  modelo: string;
  inventario: string;
  duracion: number;
}

export interface EquipoResumen {
  equipoId: string;
  nombre: string;
  marca: string;
  serie: string;
  inventario: string;
  sede: string;
  servicio: string;
  mesesMtto: MonthCode[];
  totalProgramados: number;
  totalRealizados: number;
  cumplimiento: number;
  estadoOperativo: string;
  costoRepuestos: number;
}

export interface RepuestoRow {
  nombre: string;
  cantidad: number;
  equipo: string;
  estado: string;
  precioUnitario: number;
  precioTotal: number;
  fechaSolicitud: string | null;
  fechaInstalacion: string | null;
  observacion: string;
}

export interface InformePayload {
  meta: InformeMeta;
  kpis: InformeKpis;
  preventivos: ReportRow[];
  correctivos: ReportRow[];
  equipos: EquipoResumen[];
  repuestos: RepuestoRow[];
  costos: { repuestos: number };
  observaciones: string[];
  observacionGeneral: string;
}
