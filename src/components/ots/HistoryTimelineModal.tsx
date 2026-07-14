import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Modal, Spinner } from 'react-bootstrap';
import { FaCheck, FaClipboardList, FaExchangeAlt, FaHistory, FaPencilAlt, FaPlus, FaStickyNote, FaTimes, FaTrash, FaUndo } from 'react-icons/fa';
import { HistoryEntry, historyService } from '@/services/history.service';

interface Props {
  show: boolean;
  onHide: () => void;
  resourceType: string;
  resourceId: string;
  title?: string;
}

/**
 * Map an `action` slug to a colored icon so the timeline reads at a glance.
 * Add new mappings as new actions ship; unknown actions fall through to a
 * neutral dot.
 */
function iconFor(action: string): { icon: React.ReactNode; color: string } {
  switch (action) {
    case 'create': return { icon: <FaPlus />, color: 'success' };
    case 'update': return { icon: <FaPencilAlt />, color: 'primary' };
    case 'change-status': return { icon: <FaExchangeAlt />, color: 'info' };
    case 'mark-processed': return { icon: <FaCheck />, color: 'success' };
    case 'unprocess': return { icon: <FaUndo />, color: 'warning' };
    case 'add-nota': return { icon: <FaStickyNote />, color: 'secondary' };
    case 'delete-nota': return { icon: <FaTrash />, color: 'danger' };
    case 'add-equipos': return { icon: <FaPlus />, color: 'success' };
    case 'sign-worksheet': return { icon: <FaClipboardList />, color: 'primary' };
    case 'cancel': return { icon: <FaTimes />, color: 'danger' };
    default: return { icon: <FaHistory />, color: 'secondary' };
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const HistoryTimelineModal: React.FC<Props> = ({ show, onHide, resourceType, resourceId, title }) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!resourceType || !resourceId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await historyService.listByResource(resourceType, resourceId, { limit: 200 });
      setEntries(result.data);
    } catch (err) {
      console.error('Error cargando historial:', err);
      setError('No fue posible cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, [resourceType, resourceId]);

  useEffect(() => {
    if (show) refresh();
  }, [show, refresh]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaHistory className="me-2" />
          {title || 'Historial'}
          <span className="text-muted fs-6 ms-2">({entries.length})</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: '70vh' }}>
        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <div className="text-muted mt-2">Cargando historial...</div>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted text-center my-4">
            Aún no hay actividad registrada para este recurso.
          </p>
        ) : (
          <ul className="list-unstyled position-relative ps-4" style={{ borderLeft: '2px solid #dee2e6' }}>
            {entries.map((entry) => {
              const { icon, color } = iconFor(entry.action);
              return (
                <li key={entry._id} className="position-relative mb-3">
                  <span
                    className={`position-absolute d-inline-flex align-items-center justify-content-center rounded-circle text-white bg-${color}`}
                    style={{ left: '-30px', top: '2px', width: '24px', height: '24px', fontSize: '10px' }}
                  >
                    {icon}
                  </span>
                  <div className="d-flex flex-column">
                    <div>
                      <strong>{entry.description}</strong>
                    </div>
                    <small className="text-muted">
                      {entry.userName || 'Sistema'} · {formatDateTime(entry.createdAt)}
                    </small>
                    {entry.action && entry.action !== 'update' && (
                      <div className="mt-1">
                        <Badge bg={color} className="fw-normal">{entry.action}</Badge>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default HistoryTimelineModal;
