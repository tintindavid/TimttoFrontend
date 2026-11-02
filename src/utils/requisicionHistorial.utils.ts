import { MI_ACTIVIDAD_LABELS, type RequisicionMiActividad } from '@/types/requisicion.types';
import { formatDate } from '@/utils/requisicion.utils';

/** Spanish phrase for one own event, e.g. "Aprobaste · nivel 2". */
export const miActividadLabel = (evento: RequisicionMiActividad): string => {
  const base = MI_ACTIVIDAD_LABELS[evento.tipo] ?? evento.tipo;
  return evento.tipo === 'NIVEL_APROBADO' && evento.nivel ? `${base} nivel ${evento.nivel}` : base;
};

/** "Aprobaste nivel 2 · 12/11/2026" for the latest own event; empty string when there is none. */
export const miActividadResumen = (actividad?: RequisicionMiActividad[] | null): string => {
  if (!actividad || actividad.length === 0) return '';
  const [latest] = actividad;
  return `${miActividadLabel(latest)} · ${formatDate(latest.fecha)}`;
};
