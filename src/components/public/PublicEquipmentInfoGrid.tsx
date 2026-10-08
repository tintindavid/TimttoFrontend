import React from 'react';
import { PublicEquipoSummary, PublicMaintenanceHistoryItem } from '@/types/equipmentQr.types';

interface PublicEquipmentInfoGridProps {
  equipo: PublicEquipoSummary;
  historial?: PublicMaintenanceHistoryItem[];
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MONTH_ABBR_UPPER = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
/** Backend stores `mesesMtto` as lowercase 3-letter abbreviations (see
 *  `TimttoApp/src/utils/meses.util.js` — `'ene' | 'feb' | … | 'dic'`). We
 *  key the chip set by those abbreviations and tolerate full-word inputs
 *  (`"Enero"` → `"ene"`) so legacy data still matches. */
const MONTH_KEYS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formatDateLong = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const monthKey = (raw?: string | null): string => {
  if (!raw) return '';
  return String(raw).trim().toLowerCase().slice(0, 3);
};

/** Pick the most recent `fecha` of a closed/processed report as the actual
 *  last maintenance date — stays consistent with the history tab (fix #3). */
const resolveUltimoMtto = (
  equipo: PublicEquipoSummary,
  historial?: PublicMaintenanceHistoryItem[],
): string | null => {
  const fromHistory = historial
    ?.map((h) => h.fecha)
    .filter((f): f is string => Boolean(f))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  return fromHistory || equipo.ultimoMtto || null;
};

/** Cronograma strip — only the months in the equipo's `mesesMtto`
 *  (plus any realized month that for some reason isn't in `mesesMtto`),
 *  rendered in calendar order. Green = done, gray = scheduled-but-not-done. */
const CronogramaStrip: React.FC<{ equipo: PublicEquipoSummary }> = ({ equipo }) => {
  const scheduled = new Set((equipo.mesesMtto || []).map(monthKey).filter(Boolean));
  const done = new Set(
    (equipo.mesesMttoRealizados || []).map((m) => monthKey(m?.mes)).filter(Boolean),
  );

  // Union preserving calendar order — only months in the equipo's cronograma
  // (or already realized) are rendered; months the equipo is not programmed
  // for are omitted entirely.
  const months = MONTH_KEYS
    .map((key, idx) => ({ key, idx, nombre: MONTHS_ES[idx], abbr: MONTH_ABBR_UPPER[idx] }))
    .filter(({ key }) => scheduled.has(key) || done.has(key));

  if (months.length === 0) return null;

  const currentMonthIdx = new Date().getMonth();

  return (
    <div className="px-3 pb-3">
      <div className="d-flex align-items-baseline justify-content-between mb-2">
        <div className="small text-muted">Cronograma de mantenimiento</div>
        {equipo.proximoMtto && (
          <div className="small">
            <span className="text-muted">Próximo: </span>
            <span className="fw-semibold">{equipo.proximoMtto}</span>
          </div>
        )}
      </div>
      <div className="d-flex flex-wrap gap-2">
        {months.map(({ key, idx, nombre, abbr }) => {
          const isDone = done.has(key);
          const isCurrent = idx === currentMonthIdx;

          const base: React.CSSProperties = {
            borderRadius: 6,
            fontSize: '0.78rem',
            lineHeight: 1,
            padding: '7px 10px',
            textAlign: 'center',
            border: '1px solid transparent',
            minWidth: 60,
          };
          let style: React.CSSProperties = isDone
            ? { ...base, background: '#16A34A', color: '#FFFFFF', borderColor: '#15803D' }
            : { ...base, background: '#F3F4F6', color: '#4B5563', borderColor: '#E5E7EB' };
          if (isCurrent) {
            style = { ...style, borderColor: '#111827', borderWidth: 2 };
          }

          return (
            <div
              key={key}
              style={style}
              title={`${nombre}${isDone ? ' — realizado' : ' — pendiente'}`}
              aria-label={`${nombre}${isDone ? ', realizado' : ', pendiente'}`}
            >
              <span className="fw-semibold">{abbr}</span>
            </div>
          );
        })}
      </div>
      <div className="d-flex flex-wrap gap-3 mt-2">
        <span className="small text-muted d-inline-flex align-items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#16A34A', display: 'inline-block' }} />
          Realizado
        </span>
        <span className="small text-muted d-inline-flex align-items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#F3F4F6', border: '1px solid #E5E7EB', display: 'inline-block' }} />
          Pendiente
        </span>
      </div>
    </div>
  );
};

/**
 * Info summary + cronograma. "Último Mtto" is derived from the history so it
 * always matches the first card in the Mtto tab (fix #3). The cronograma
 * timeline below the grid replaces the opaque "Próximo Mtto" tile with a
 * visual timeline (fix #4).
 */
const PublicEquipmentInfoGrid: React.FC<PublicEquipmentInfoGridProps> = ({ equipo, historial }) => {
  const ultimoMtto = resolveUltimoMtto(equipo, historial);
  const fields: Array<{ label: string; value: string }> = [
    { label: 'Serie', value: equipo.serie || '—' },
    { label: 'Inventario', value: equipo.inventario || '—' },
    { label: 'Ubicación', value: equipo.ubicacion || '—' },
    { label: 'Último Mtto', value: formatDateLong(ultimoMtto) },
  ];

  return (
    <>
      <div className="row row-cols-2 g-3 px-3 py-3">
        {fields.map((f) => (
          <div className="col" key={f.label}>
            <div className="small text-muted">{f.label}</div>
            <div className="fw-semibold text-break">{f.value}</div>
          </div>
        ))}
      </div>
      <CronogramaStrip equipo={equipo} />
    </>
  );
};

export default PublicEquipmentInfoGrid;
