import { MESES } from '@/types/cronograma.types';
import type {
  CronogramaActividadExterna,
  CronogramaEquipo,
  EstadoMesActividad,
  FilaActividad,
  Mes,
  OrigenCronograma,
} from '@/types/cronograma.types';
import type { TipoActividad } from '@/types/actividadExterna.types';
import { TIPOS_ACTIVIDAD } from '@/constants/actividadExterna';

/** 'ene' → 'Ene'. Returns null for anything that is not one of the twelve months. */
export const mesApiToMes = (mes: string): Mes | null => {
  const capitalizado = `${mes.charAt(0).toUpperCase()}${mes.slice(1).toLowerCase()}`;
  return (MESES as string[]).includes(capitalizado) ? (capitalizado as Mes) : null;
};

/** Human label of the activity type ("Calibración", or the custom text for "otro"). */
export const etiquetaTipo = (cadena: Pick<CronogramaActividadExterna, 'tipo' | 'tipoCustom'>): string => {
  if (cadena.tipo === 'otro' && cadena.tipoCustom) return cadena.tipoCustom;
  return TIPOS_ACTIVIDAD.find((t) => t.value === cadena.tipo)?.label ?? cadena.tipo;
};

/** Dates are stored as UTC midnight, so they are formatted in UTC to avoid showing the previous day. */
export const formatearFechaUtc = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });

/** Short status text for tooltips and badges. */
export const textoVencimiento = (cadena: Pick<CronogramaActividadExterna, 'vencida' | 'diasParaVencer'>): string => {
  if (cadena.diasParaVencer === null) return '';
  if (cadena.vencida) {
    const dias = Math.abs(cadena.diasParaVencer);
    return `Vencida hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  }
  if (cadena.diasParaVencer === 0) return 'Vence hoy';
  return `Vence en ${cadena.diasParaVencer} ${cadena.diasParaVencer === 1 ? 'día' : 'días'}`;
};

/** Tooltip lines of one scheduled external activity. */
export const describirCadena = (cadena: CronogramaActividadExterna): string[] => {
  const lineas = [`${etiquetaTipo(cadena)} — próxima: ${formatearFechaUtc(cadena.fechaProxima)}`];
  const vencimiento = textoVencimiento(cadena);
  if (vencimiento) lineas.push(vencimiento);
  if (cadena.proveedor) lineas.push(`Proveedor: ${cadena.proveedor}`);
  return lineas;
};

/** Short labels for the Act column; the full name goes in the tooltip. */
export const ABREVIATURA_TIPO: Record<TipoActividad, string> = {
  calibracion: 'Cal',
  verificacion: 'Ver',
  ajuste: 'Aju',
  calificacion: 'Cfc',
  modernizacion: 'Mod',
  reacondicionamiento: 'Rea',
  actualizacion_sw_fw: 'SW',
  inspeccion_tecnica: 'Ins',
  auditoria_seguridad: 'Aud',
  otro: 'Otr',
};

export const abreviaturaTipo = (cadena: Pick<CronogramaActividadExterna, 'tipo' | 'tipoCustom'>): string => {
  if (cadena.tipo === 'otro' && cadena.tipoCustom) return cadena.tipoCustom.trim().slice(0, 3);
  return ABREVIATURA_TIPO[cadena.tipo] ?? cadena.tipo.slice(0, 3);
};

/**
 * Rows of one equipment in the grid: `MP` first (when it has preventive months, or when it has no external
 * activity so the equipment is still listed) and one row per scheduled external chain. The origin filter
 * hides the rows of the other origin.
 */
export const filasEquipo = (equipo: CronogramaEquipo, origen: OrigenCronograma = 'todos'): FilaActividad[] => {
  const cadenas = origen === 'preventivo' ? [] : (equipo.cadenas ?? []);
  const filas: FilaActividad[] = [];
  const tienePreventivo = (equipo.mesesMtto?.length ?? 0) > 0;
  const mostrarMp = origen !== 'externo' && (tienePreventivo || cadenas.length === 0);
  if (mostrarMp) {
    filas.push({ key: `${equipo._id}-mp`, tipo: 'mp', etiqueta: 'MP', titulo: 'Mantenimiento preventivo' });
  }
  cadenas.forEach((c) => {
    filas.push({ key: `${equipo._id}-${c.cadenaId}`, tipo: 'externa', etiqueta: abreviaturaTipo(c), titulo: etiquetaTipo(c), cadena: c });
  });
  if (filas.length === 0) {
    // origen "externo" without chains never reaches the grid (the hook drops the equipment); keep one row anyway
    filas.push({ key: `${equipo._id}-mp`, tipo: 'mp', etiqueta: 'MP', titulo: 'Mantenimiento preventivo' });
  }
  return filas;
};

const anioDeFecha = (iso?: string): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getUTCFullYear();
};

/**
 * Preventive month: green ("realizado") when a report of that month exists in the year, gray ("programado")
 * when scheduled and not done, nothing otherwise. Not-done months are never red (by request).
 */
export const estadoMesPreventivo = (
  equipo: Pick<CronogramaEquipo, 'mesesMtto' | 'mesesRealizados'>,
  mes: Mes,
  anio: number,
): EstadoMesActividad => {
  const clave = mes.toLowerCase();
  const realizado = (equipo.mesesRealizados ?? []).some(
    (r) => (r.mes ?? '').toLowerCase() === clave && anioDeFecha(r.fecha) === anio,
  );
  if (realizado) return 'realizado';
  const programado = (equipo.mesesMtto ?? []).some((m) => m.toLowerCase() === clave);
  return programado ? 'programado' : null;
};

/**
 * External month: green when an activity of the chain was registered that month of the year; red when it was
 * scheduled, not done and the month is already over (or it is the current month and the chain is overdue);
 * gray when scheduled and still pending.
 */
export const estadoMesExterno = (
  cadena: Pick<CronogramaActividadExterna, 'meses' | 'realizadas' | 'vencida'>,
  mes: Mes,
  anio: number,
  ahora: Date = new Date(),
): EstadoMesActividad => {
  const clave = mes.toLowerCase();
  if ((cadena.realizadas ?? []).some((r) => r.mes === clave)) return 'realizado';
  if (!cadena.meses.includes(clave)) return null;

  const anioActual = ahora.getUTCFullYear();
  if (anio > anioActual) return 'programado';
  if (anio < anioActual) return 'vencido';
  const indice = MESES.indexOf(mes);
  const mesActual = ahora.getUTCMonth();
  if (indice < mesActual) return 'vencido';
  if (indice === mesActual && cadena.vencida) return 'vencido';
  return 'programado';
};
