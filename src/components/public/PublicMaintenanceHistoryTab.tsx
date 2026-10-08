import React, { useState } from 'react';
import { Badge, Card } from 'react-bootstrap';
import { FaEye, FaTools, FaExclamationTriangle, FaWrench } from 'react-icons/fa';
import { PublicMaintenanceHistoryItem } from '@/types/equipmentQr.types';
import { getEstadoOperativoBadgeStyle } from '@/utils/estadoOperativoBadge.util';
import ObservationModal from './ObservationModal';

interface PublicMaintenanceHistoryTabProps {
  historial: PublicMaintenanceHistoryItem[];
}

const formatFechaLarga = (iso?: string | null): string => {
  if (!iso) return 'Fecha no registrada';
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/** Icon + color by `tipoMtto` — case-insensitive, falls back to a neutral wrench. */
const tipoMttoIcon = (tipoMtto?: string): React.ReactNode => {
  const normalized = (tipoMtto || '').toLowerCase();
  if (normalized.includes('preventivo')) return <FaTools className="text-primary" aria-hidden="true" />;
  if (normalized.includes('correctivo')) return <FaExclamationTriangle className="text-danger" aria-hidden="true" />;
  return <FaWrench className="text-secondary" aria-hidden="true" />;
};

/**
 * Cards, not a table (D14) — one-column on mobile, driven by Bootstrap's
 * default stacking (no explicit breakpoint classes needed since each card
 * is already full-width).
 */
const PublicMaintenanceHistoryTab: React.FC<PublicMaintenanceHistoryTabProps> = ({ historial }) => {

  console.log(historial);
  const [observationTarget, setObservationTarget] = useState<PublicMaintenanceHistoryItem | null>(null);

  if (historial.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        Aún no hay servicios registrados para este equipo
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-2 py-3">
      {historial.map((h) => {
        const badgeStyle = getEstadoOperativoBadgeStyle(h.estadoOperativoFinal);
        return (
          <Card key={h._id} className="shadow-sm">
            <Card.Body className="d-flex align-items-start gap-2">
              <div className="fs-4 flex-shrink-0">{tipoMttoIcon(h.tipoMtto)}</div>
              <div className="flex-grow-1 text-break">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-1">
                  <span className="fw-semibold">{ h.tipoMtto + ' ' + (h.consecutivo || 'Sin consecutivo') }</span>
                  {/**este badge siempre sale azul */}
                  <span style={badgeStyle}>{h.estadoOperativoFinal || 'Sin estado'}</span>
                </div>
                <div className="small text-muted">{formatFechaLarga(h.fecha)}</div>
                <div className="small">{h.responsable || 'Responsable no registrado'}</div>
              </div>
              {h.tieneObservacion && (
                <button
                  type="button"
                  className="btn btn-link p-0 flex-shrink-0"
                  aria-label="Ver observación"
                  onClick={() => setObservationTarget(h)}
                >
                  <FaEye className="fs-5" />
                </button>
              )}
            </Card.Body>
          </Card>
        );
      })}

      <ObservationModal
        show={!!observationTarget}
        onHide={() => setObservationTarget(null)}
        observacion={observationTarget?.observacionEstadoFinal}
      />
    </div>
  );
};

export default PublicMaintenanceHistoryTab;
