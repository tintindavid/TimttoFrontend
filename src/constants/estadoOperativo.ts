/**
 * Shared EstadoOperativo enum — mirrors `TimttoApp/src/constants/estadoOperativo.js`.
 * Single source of truth for the select options rendered on every equipo
 * create/edit surface and for validating the bulk-upload Excel column.
 */

export const EstadoOperativoValues = [
  'Operativo',
  'Fuera de Servicio',
  'En Mantenimiento',
  'Espera de Repuestos',
  'En Reparacion',
] as const;

export type EstadoOperativo = typeof EstadoOperativoValues[number];

export const EstadoOperativoDefault: EstadoOperativo = 'Operativo';

/** Canonical identity map — kept for future i18n even though values are already Spanish. */
export const EstadoOperativoLabels: Record<EstadoOperativo, string> = {
  'Operativo': 'Operativo',
  'Fuera de Servicio': 'Fuera de Servicio',
  'En Mantenimiento': 'En Mantenimiento',
  'Espera de Repuestos': 'Espera de Repuestos',
  'En Reparacion': 'En Reparacion',
};

/** Where an `EstadoOperativo` change came from — drives the HV timeline badge. */
export const EstadoOperativoSources = [
  'manual',
  'report-close',
  'bulk-upload',
  'migration',
] as const;

export type EstadoOperativoSource = typeof EstadoOperativoSources[number];

export const EstadoOperativoSourceLabels: Record<EstadoOperativoSource, string> = {
  'manual': 'Manual',
  'report-close': 'Reporte cerrado',
  'bulk-upload': 'Carga masiva',
  'migration': 'Migración',
};
