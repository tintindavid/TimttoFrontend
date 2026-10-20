import React from 'react';
import { Badge } from 'react-bootstrap';
import { MESES } from '@/types/cronograma.types';

interface Props {
  /** Scheduled months of the equipment ('ene'..'dic', any letter case). */
  meses?: string[];
  /** Maintenance reports already done ('ene'..'dic' plus the date). */
  realizados?: { mes: string; fecha?: string }[];
  /** Selected service date (YYYY-MM-DD): its month is outlined and the done months are those of its year. */
  fecha?: string;
}

const clave = (mes: string) => mes.trim().toLowerCase();

/**
 * Small row with the twelve months that shows which ones are scheduled for the equipment, which of those are
 * already done in the year of the selected date, and where the selected date falls. It only guides the person
 * registering a preventive service; nothing here blocks the form.
 */
const MesesProgramadosBar: React.FC<Props> = ({ meses = [], realizados = [], fecha }) => {
  const programados = new Set(meses.map(clave));
  const anio = fecha && /^\d{4}-\d{2}/.test(fecha) ? Number(fecha.slice(0, 4)) : null;
  const mesSeleccionado = fecha && /^\d{4}-\d{2}/.test(fecha) ? Number(fecha.slice(5, 7)) - 1 : null;
  const hechos = new Set(
    realizados
      .filter((r) => anio !== null && r.fecha && new Date(r.fecha).getUTCFullYear() === anio)
      .map((r) => clave(r.mes)),
  );

  return (
    <div data-testid="barra-meses" className="mb-3">
      <div className="small fw-bold mb-1">Meses de mantenimiento preventivo del equipo</div>
      {programados.size === 0 ? (
        <div className="small text-muted">Este equipo no tiene meses de mantenimiento programados.</div>
      ) : (
        <div className="d-flex flex-wrap gap-1">
          {MESES.map((mes, i) => {
            const k = mes.toLowerCase();
            const programado = programados.has(k);
            const hecho = hechos.has(k);
            const estado = hecho ? 'hecho' : programado ? 'programado' : 'libre';
            const esSeleccionado = mesSeleccionado === i;
            return (
              <Badge
                key={mes}
                bg={hecho ? 'success' : programado ? 'primary' : 'light'}
                text={hecho || programado ? undefined : 'muted'}
                className={`px-2 py-1 ${esSeleccionado ? 'border border-2 border-dark' : 'border'}`}
                data-testid="mes-programado"
                data-mes={k}
                data-estado={estado}
                data-seleccionado={esSeleccionado ? 'true' : 'false'}
                title={
                  hecho ? `${mes}: programado y ya realizado en ${anio}`
                    : programado ? `${mes}: mes programado`
                      : `${mes}: sin mantenimiento programado`
                }
              >
                {mes}{hecho ? ' ✓' : ''}
              </Badge>
            );
          })}
        </div>
      )}
      {programados.size > 0 && (
        <div className="small text-muted mt-1">
          Azul: programado · Verde: ya realizado{anio ? ` en ${anio}` : ''} · Borde oscuro: mes de la fecha elegida
        </div>
      )}
    </div>
  );
};

export default MesesProgramadosBar;
