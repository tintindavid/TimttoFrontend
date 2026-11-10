import type { RequisicionEstado } from './requisicion.types';

/** Query params of the list a dashboard card links to (e.g. `{ vista: 'por-aprobar' }` or `{ estado: 'En_Licitacion' }`). */
export type TableroEnlace = Record<string, string | number | boolean>;

export interface TableroContador {
  count: number;
  /** `null`: the card is informative only (not clickable). */
  enlace: TableroEnlace | null;
}

export interface TableroPersonal {
  mias: TableroContador;
  porAprobar: TableroContador;
  ocPorAprobar: TableroContador;
  porRecibir: TableroContador;
  porConfirmar: TableroContador;
}

export interface TableroTenant {
  porAprobar: TableroContador;
  ocPorAprobar: TableroContador;
  licitacionesAbiertas: TableroContador;
  licitacionesPorVencer: TableroContador;
  licitacionesVencidas: TableroContador;
  porRecibir: TableroContador;
  porConfirmar: TableroContador;
  entregablesPendientes: TableroContador;
  sinMovimiento: TableroContador;
}

export interface Tablero {
  personal: TableroPersonal;
  /** Only present for users with `requisiciones:reports`. */
  tenant?: TableroTenant;
}

export interface MetricasFiltros {
  desde?: string;
  hasta?: string;
  areaId?: string;
  tipoId?: string;
  proveedorId?: string;
  moneda?: string;
}

export interface MetricaCiclo {
  n: number;
  medianaHoras: number | null;
  p90Horas: number | null;
}

export type MetricaCicloKey = 'envioAprobacion' | 'aprobacionAdjudicacion' | 'adjudicacionOcEnviada' | 'ocEnviadaCierre';

export interface Metricas {
  rango: { desde: string; hasta: string };
  total: number;
  porEstado: Array<{ estado: RequisicionEstado; count: number }>;
  tasaRechazo: { rechazadas: number; enviadas: number; tasa: number | null };
  ciclos: Record<MetricaCicloKey, MetricaCiclo>;
  valorComprado: Array<{ moneda: string; total: number; ordenes: number }>;
  estimadoVsReal: Array<{ moneda: string; estimado: number; real: number; exceso: number; requisiciones: number }>;
  sinEstimar: { requisiciones: number };
  devolucionesEntregables: { total: number; requisiciones: number };
  topProveedores: Array<{ proveedorId: string; nombre: string; moneda: string; valor: number; ordenes: number }>;
  topAreas: Array<{ areaId: string; nombre: string; moneda: string; valor: number; requisiciones: number }>;
}

export const METRICA_CICLO_LABELS: Record<MetricaCicloKey, string> = {
  envioAprobacion: 'Envío → aprobación',
  aprobacionAdjudicacion: 'Aprobación → adjudicación',
  adjudicacionOcEnviada: 'Adjudicación → OC enviada',
  ocEnviadaCierre: 'OC enviada → cierre',
};

export const METRICA_CICLO_KEYS: MetricaCicloKey[] = [
  'envioAprobacion',
  'aprobacionAdjudicacion',
  'adjudicacionOcEnviada',
  'ocEnviadaCierre',
];

/** Spanish labels of the dashboard cards, in display order. */
export const TABLERO_PERSONAL_LABELS: Array<{ key: keyof TableroPersonal; label: string }> = [
  { key: 'mias', label: 'Mis requisiciones' },
  { key: 'porAprobar', label: 'Por aprobar' },
  { key: 'ocPorAprobar', label: 'Órdenes de compra por aprobar' },
  { key: 'porRecibir', label: 'Por recibir' },
  { key: 'porConfirmar', label: 'Por confirmar' },
];

export const TABLERO_TENANT_LABELS: Array<{ key: keyof TableroTenant; label: string }> = [
  { key: 'porAprobar', label: 'Por aprobar' },
  { key: 'ocPorAprobar', label: 'Órdenes de compra por aprobar' },
  { key: 'licitacionesAbiertas', label: 'Licitaciones abiertas' },
  { key: 'licitacionesPorVencer', label: 'Licitaciones por vencer' },
  { key: 'licitacionesVencidas', label: 'Licitaciones vencidas' },
  { key: 'porRecibir', label: 'Por recibir' },
  { key: 'porConfirmar', label: 'Por confirmar' },
  { key: 'entregablesPendientes', label: 'Entregables pendientes' },
  { key: 'sinMovimiento', label: 'Sin movimiento' },
];

/** Spanish copy of the error codes of the reporting / export endpoints. */
export const REPORTE_ERROR_MESSAGES: Record<string, string> = {
  REPORTE_LENTO: 'El reporte tardó demasiado. Reduce el rango de fechas o aplica más filtros e inténtalo de nuevo.',
  RANGO_INVALIDO: 'El rango de fechas no es válido: revisa que "Desde" no sea posterior a "Hasta" y que no exceda el máximo permitido.',
};

export const EXPORT_DEMASIADAS_FILAS = 'EXPORT_DEMASIADAS_FILAS';

/** Message of a 413 EXPORT_DEMASIADAS_FILAS, with the total when the server sent it. */
export const exportDemasiadasFilasMessage = (total?: number): string =>
  total != null
    ? `Hay demasiadas filas para exportar (${total}). Aplica más filtros para reducir el resultado e inténtalo de nuevo.`
    : 'Hay demasiadas filas para exportar. Aplica más filtros para reducir el resultado e inténtalo de nuevo.';
