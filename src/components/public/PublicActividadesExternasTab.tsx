import React from 'react';
import { Badge, Card } from 'react-bootstrap';
import { FaPaperclip, FaClipboardCheck } from 'react-icons/fa';
import { PublicActividadExterna } from '@/types/equipmentQr.types';
import { TIPOS_ACTIVIDAD } from '@/constants/actividadExterna';
import { getEstadoOperativoBadgeStyle } from '@/utils/estadoOperativoBadge.util';

interface PublicActividadesExternasTabProps {
  actividades: PublicActividadExterna[];
}

const formatFechaLarga = (iso?: string | null): string => {
  if (!iso) return 'Fecha no registrada';
  try {
    // The activity date is a calendar day stored at UTC midnight: format it in UTC so it does not slip a day.
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const tipoLabel = (a: PublicActividadExterna): string => {
  if (a.tipo === 'otro' && a.tipoCustom) return a.tipoCustom;
  return TIPOS_ACTIVIDAD.find((t) => t.value === a.tipo)?.label || a.tipoCustom || 'Actividad externa';
};

const resultadoLabel = (resultado?: string | null): string | null => {
  if (!resultado) return null;
  const known: Record<string, string> = {
    aprobada: 'Aprobada',
    aprobada_con_observaciones: 'Aprobada con observaciones',
    rechazada: 'Rechazada',
    pendiente: 'Pendiente',
    otro: 'Otro',
  };
  return known[resultado] || resultado;
};

/**
 * Third-party activities (calibration, verification...) of the equipment, for audits. Read-only: the evidence file or
 * link itself is not exposed on this public page, only whether there is one.
 */
const PublicActividadesExternasTab: React.FC<PublicActividadesExternasTabProps> = ({ actividades }) => {
  if (actividades.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        Aún no hay actividades externas registradas para este equipo
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-2 py-3">
      {actividades.map((a, i) => {
        const resultado = resultadoLabel(a.resultado);
        const badgeStyle = getEstadoOperativoBadgeStyle(a.estadoOperativo ?? undefined);
        return (
          <Card key={`${a.tipo}-${a.fecha}-${i}`} className="shadow-sm" data-testid="actividad-externa-card">
            <Card.Body className="d-flex align-items-start gap-2">
              <div className="fs-4 flex-shrink-0">
                <FaClipboardCheck className="text-info" aria-hidden="true" />
              </div>
              <div className="flex-grow-1 text-break">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-1">
                  <span className="fw-semibold">
                    {tipoLabel(a)}
                    {a.consecutivoDocumento ? ` ${a.consecutivoDocumento}` : ''}
                  </span>
                  {a.estadoOperativo && <span style={badgeStyle}>{a.estadoOperativo}</span>}
                </div>
                <div className="small text-muted">{formatFechaLarga(a.fecha)}</div>
                <div className="small">{a.proveedor || 'Proveedor no registrado'}</div>
                <div className="d-flex flex-wrap align-items-center gap-2 mt-1">
                  {resultado && <Badge bg="secondary">{resultado}</Badge>}
                  {a.tieneEvidencia && (
                    <span className="small text-muted">
                      <FaPaperclip aria-hidden="true" className="me-1" />
                      Con evidencia
                    </span>
                  )}
                  {a.proximaFecha && (
                    <span className="small text-muted">Próxima: {formatFechaLarga(a.proximaFecha)}</span>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};

export default PublicActividadesExternasTab;
