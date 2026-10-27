import React from 'react';
import type { RequisicionTimelineEvent } from '@/types/requisicion.types';
import { REQUISICION_ESTADO_LABELS } from '@/types/requisicion.types';
import { actorName, formatDateTime, getEventMeta } from '@/utils/requisicion.utils';
import ReqHelp from '../help/ReqHelp';
import { eventHelpId } from '../help/requisicionHelp';

interface Props {
  events: RequisicionTimelineEvent[];
}

/** Vertical timeline: icon + color per event, actor, date and observation. Oldest first (chronological). */
const RequisicionTimeline: React.FC<Props> = ({ events }) => {
  if (!events || events.length === 0) {
    return <p className="text-muted mb-0">Aún no hay eventos registrados.</p>;
  }

  const ordered = [...events].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  return (
    <ol className="list-unstyled mb-0" aria-label="Línea de tiempo de la requisición">
      {ordered.map((event, index) => {
        const meta = getEventMeta(event.tipo);
        const Icon = meta.icon;
        const isLast = index === ordered.length - 1;
        const helpId = eventHelpId(event.tipo);
        return (
          <li key={event.eventId ?? `${event.tipo}-${index}`} className="d-flex" data-testid="timeline-event">
            <div className="d-flex flex-column align-items-center me-3">
              <span
                className={`d-inline-flex align-items-center justify-content-center rounded-circle p-2 text-bg-${meta.variant}`}
                aria-hidden="true"
              >
                <Icon size={14} />
              </span>
              {!isLast && <span className="flex-grow-1 border-start py-2" aria-hidden="true" />}
            </div>
            <div className={isLast ? '' : 'pb-3'}>
              <div className="fw-semibold">
                {meta.label}
                {helpId && <ReqHelp id={helpId} />}
              </div>
              <small className="text-muted d-block">
                {actorName(event.actor)} · {formatDateTime(event.fecha)}
              </small>
              {event.estadoAnterior && event.estadoNuevo && (
                <small className="text-muted d-block">
                  {REQUISICION_ESTADO_LABELS[event.estadoAnterior] ?? event.estadoAnterior}
                  {' → '}
                  {REQUISICION_ESTADO_LABELS[event.estadoNuevo] ?? event.estadoNuevo}
                </small>
              )}
              {event.observacion && <div className="mt-1 fst-italic">“{event.observacion}”</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default RequisicionTimeline;
