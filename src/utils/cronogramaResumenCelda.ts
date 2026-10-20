import { MESES, type Mes } from '@/types/cronograma.types';
import type { ActividadExterna, CadenaConActividades } from '@/types/actividadExterna.types';
import type { Reporte } from '@/types/reporte.types';

const HTTP_URL = /^https?:\/\//i;

/** Only http(s) addresses are ever opened from the summary (a `javascript:` or `data:` address is dropped). */
export const urlHttp = (url?: string | null): string | null => (url && HTTP_URL.test(url) ? url : null);

/** True when the ISO date falls in that month (UTC calendar day, as the backend stores the dates) of that year. */
const esDelMes = (iso: string | undefined | null, mes: Mes, anio: number): boolean => {
  if (!iso) return false;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return false;
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === MESES.indexOf(mes);
};

const masReciente = <T,>(fecha: (x: T) => string | undefined | null) => (a: T, b: T) =>
  new Date(fecha(b) ?? 0).getTime() - new Date(fecha(a) ?? 0).getTime();

/** Activities of ONE chain registered in the month and year of a schedule cell, newest first. */
export const actividadesDeCelda = (
  grupos: CadenaConActividades[] | undefined,
  cadenaId: string,
  mes: Mes,
  anio: number,
): ActividadExterna[] => {
  const grupo = (grupos ?? []).find((g) => g.cadena._id === cadenaId);
  return (grupo?.actividades ?? [])
    .filter((a) => esDelMes(a.fecha, mes, anio))
    .sort(masReciente((a) => a.fecha));
};

/**
 * Preventive services of an equipment done in the month and year of a schedule cell (closed or processed reports of
 * type preventive, internal or external), newest first.
 */
export const preventivosDeCelda = (reportes: Reporte[] | undefined, mes: Mes, anio: number): Reporte[] =>
  (reportes ?? [])
    .filter((r) => r.tipoMtto === 'Preventivo' && (r.estado === 'Cerrado' || r.estado === 'Procesado'))
    .filter((r) => esDelMes(r.fechaProcesado ?? r.fechaFinalizdo, mes, anio))
    .sort(masReciente((r) => r.fechaProcesado ?? r.fechaFinalizdo));
