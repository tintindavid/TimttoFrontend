import { MESES, type EstadoMesActividad, type FilaActividad, type Mes } from '@/types/cronograma.types';
import { mesApiToMes } from '@/utils/cronogramaExterno';

const pad = (n: number): string => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD (not UTC: after 19:00 in Colombia the UTC day is already tomorrow). */
export const diaLocal = (fecha: Date): string => `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;

/**
 * Whether a schedule cell can be used to load the activity it announces (quick load, cronograma-carga-rapida).
 * Only cells that are due (`programado` or `vencido`) in a year/month that is not after today: the registration
 * forms reject a future date, and a cell that is already done has nothing left to load. Two more rules by kind of row:
 *  - preventive (MP): only the CURRENT year. A preventive service of another year is saved but the backend does not
 *    mark a month of the current schedule for it, so the cell would stay gray and invite duplicates;
 *  - external: not a month before the latest activity already registered in the chain (in the year shown), because a
 *    successor older than the current activity is refused by the backend and would send the chain back in time.
 */
export const puedeCargarCelda = (
  estado: EstadoMesActividad,
  mes: Mes,
  anio: number,
  hoy: Date = new Date(),
  fila?: Pick<FilaActividad, 'tipo' | 'cadena'>,
): boolean => {
  if (estado !== 'programado' && estado !== 'vencido') return false;
  const anioActual = hoy.getFullYear();
  if (fila?.tipo === 'mp' && anio !== anioActual) return false;
  if (fila?.tipo === 'externa' && hayActividadPosterior(fila.cadena, mes)) return false;
  if (anio < anioActual) return true;
  if (anio > anioActual) return false;
  return MESES.indexOf(mes) <= hoy.getMonth();
};

/** True when the chain already has an activity registered (in the year shown) in a month after `mes`. */
export const hayActividadPosterior = (cadena: Pick<NonNullable<FilaActividad['cadena']>, 'realizadas'> | undefined, mes: Mes): boolean =>
  (cadena?.realizadas ?? []).some((r) => {
    const mesRealizado = mesApiToMes(r.mes);
    return mesRealizado !== null && MESES.indexOf(mesRealizado) > MESES.indexOf(mes);
  });

/** Default date of the form opened from a cell: the last day of that month, never later than today. */
export const fechaInicialDeCelda = (mes: Mes, anio: number, hoy: Date = new Date()): string => {
  const ultimoDia = diaLocal(new Date(anio, MESES.indexOf(mes) + 1, 0));
  const dia = diaLocal(hoy);
  return ultimoDia <= dia ? ultimoDia : dia;
};
