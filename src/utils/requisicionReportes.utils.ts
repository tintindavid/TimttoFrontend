import { REQUISICION_ESTADOS, REQUISICION_FILTROS } from '@/types/requisicion.types';
import type { MetricaCiclo, TableroEnlace } from '@/types/requisicionReportes.types';

const VISTA_PATHS: Record<string, string> = {
  mias: '/requisiciones',
  'por-aprobar': '/requisiciones/por-aprobar',
  'oc-por-aprobar': '/requisiciones/oc-por-aprobar',
  'por-recibir': '/requisiciones/por-recibir',
  'por-confirmar': '/requisiciones/por-confirmar',
  'mi-historial': '/requisiciones/mi-historial',
};


/**
 * Turns the `enlace` (query params of the list that shows a counter's items) into a router path. A known `vista`
 * picks the route; `alcance=tenant` (+ `filtro` / `estado`) opens the organization-wide list.
 */
export const enlaceToPath = (enlace: TableroEnlace): string => {
  const vista = typeof enlace.vista === 'string' ? enlace.vista : undefined;
  const basePath = vista ? VISTA_PATHS[vista] : undefined;
  const query = new URLSearchParams();
  // Allowlist: anything else in an `enlace` is ignored.
  if (typeof enlace.estado === 'string' && (REQUISICION_ESTADOS as readonly string[]).includes(enlace.estado)) {
    query.set('estado', enlace.estado);
  }
  if (enlace.alcance === 'tenant') {
    query.set('alcance', 'tenant');
    if (typeof enlace.filtro === 'string' && (REQUISICION_FILTROS as readonly string[]).includes(enlace.filtro)) {
      query.set('filtro', enlace.filtro);
    }
  }
  const qs = query.toString();
  return `${basePath ?? '/requisiciones'}${qs ? `?${qs}` : ''}`;
};

/** "3,5 h", "2,1 d" (hours up to 48, then days); em dash when there is no data. */
export const formatHoras = (horas: number | null | undefined): string => {
  if (horas == null || Number.isNaN(horas)) return '—';
  if (horas < 48) return `${horas.toLocaleString('es-CO', { maximumFractionDigits: 1 })} h`;
  return `${(horas / 24).toLocaleString('es-CO', { maximumFractionDigits: 1 })} d`;
};

export const hasCicloData = (ciclo: MetricaCiclo | undefined): boolean => !!ciclo && ciclo.n > 0;

/** "12,5 %" for a 0..1 ratio; em dash when undefined. */
export const formatPorcentaje = (tasa: number | null | undefined): string =>
  tasa == null || Number.isNaN(tasa) ? '—' : `${(tasa * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;
