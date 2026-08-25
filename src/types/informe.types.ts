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
  clienteNit: string;
  clienteCiudad: string;
  clienteDepartamento: string;
  clienteDireccion: string;
  clienteEmail: string;
  clienteTelefono: string;
  clienteContacto: string;
  clienteLogo: string | null;
  periodoDesde: MonthCode;
  periodoHasta: MonthCode;
  periodoLabel: string;
  fechaGeneracion: string;
  mesesSeleccionados: MonthCode[];
  tenantNombre: string;
  tenantLogo?: string | null;
  responsableNombre: string;
  /** `User.fileFirma` of the requesting user; null when not yet stored (informes-firma-autor). */
  responsableFirmaUrl?: string | null;
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

// ─── Informe por OT (informe-por-ot / informes-firma-autor) ────────────────

export interface InformePorOtRequest {
  clienteId: string;
  otIds: string[];
  observacionGeneral?: string;
}

/** Row for the header table of OTs selected for the by-OT informe. */
export interface OtSummary {
  otId: string;
  consecutivo: string;
  tipoServicio: string;
  fechaCreacion: string | null;
  estadoOt: string;
}

export interface InformePorOtMeta {
  clienteId: string;
  clienteNombre: string;
  clienteNit: string;
  clienteCiudad: string;
  clienteDepartamento: string;
  clienteDireccion: string;
  clienteEmail: string;
  clienteTelefono: string;
  clienteContacto: string;
  clienteLogo: string | null;
  tenantNombre: string;
  tenantLogo?: string | null;
  fechaGeneracion: string;
  responsableNombre: string;
  /** `User.fileFirma` of the requesting user; null when not yet stored (informes-firma-autor). */
  responsableFirmaUrl: string | null;
  otsSeleccionadas: OtSummary[];
}

export interface InformePorOtKpis {
  /** `null` when denominator (total - cancelados) is 0 — render `—` (design.md D3). */
  cumplimientoPct: number | null;
  /** Excludes cancelados. */
  totalReportes: number;
  cumplidos: number;
  pendientes: number;
  cancelados: number;
  correctivos: number;
  repuestosInstalados: number;
  costoTotal: number;
  horasServicio: number;
}

export type ReportEstadoOt = 'Cumplido' | 'Pendiente' | 'Cancelado';

/** One report+equipo row rendered inside a Sede→Servicio section's equipos table. */
export interface ReporteOtRow {
  reporteId: string;
  consecutivo: string;
  otId: string;
  otConsecutivo: string;
  equipoId: string;
  equipoNombre: string;
  marca: string;
  modelo: string;
  serie: string;
  inventario: string;
  ubicacion: string;
  sede: string;
  servicio: string;
  estadoReporte: ReportEstadoOt;
  /** `report.EstadoOperativo` ?? `equipo.EstadoOperativo` ?? 'Operativo' (design.md risk note). */
  estadoOperativo: string;
  fechaProgramada: string | null;
  fechaRealizado: string | null;
  tecnico: string;
}

export interface RepuestoConsolidadoRow {
  reporteConsecutivo: string;
  equipo: string;
  repuesto: string;
  cantidad: number;
  estado: string;
  precio: number;
  fecha: string | null;
  observacion: string;
}

/** A single Sede → Servicio block of the by-OT render. */
export interface InformeSeccion {
  sede: string;
  servicio: string;
  /** `null` renders as `—` (design.md D3 edge case). */
  cumplimientoPct: number | null;
  reportes: ReporteOtRow[];
  repuestos: RepuestoConsolidadoRow[];
}

export interface ObservacionReporte {
  consecutivo: string;
  estadoOperativo: string;
  observacion: string;
}

export interface InformePorOtPayload {
  meta: InformePorOtMeta;
  kpis: InformePorOtKpis;
  secciones: InformeSeccion[];
  observacionesReportes: ObservacionReporte[];
  observacionGeneral: string;
}
