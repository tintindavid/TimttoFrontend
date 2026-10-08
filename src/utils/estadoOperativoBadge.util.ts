/**
 * Semantic color mapping for `EstadoOperativo` badges, shared between the
 * admin "QR Equipos" table and the public equipment page header
 * (`equipment-qr-public-history`, design §UI rule 8). Hex values chosen to
 * pass AA contrast with white text.
 */

export interface EstadoOperativoBadgeStyle {
  backgroundColor: string;
  color: string;
}

const BADGE_COLORS: Record<string, string> = {
  
  'Operativo': '#2bd96b',
  'En Mantenimiento': '#CA8A04',
  'En Reparacion': '#EA580C',
  'Espera de Repuestos': '#EA580C',
  'Fuera de Servicio': '#DC2626',
};

const DEFAULT_COLOR = '#6B7280'; // gray-500 fallback for unknown values

/** Returns the inline style `{ backgroundColor, color }` for a given estado. */
export function getEstadoOperativoBadgeStyle(
  estado: string | undefined
): EstadoOperativoBadgeStyle {
  return {
    backgroundColor: (estado && BADGE_COLORS[estado]) || DEFAULT_COLOR,
    color: '#FFFFFF',
  };
}
