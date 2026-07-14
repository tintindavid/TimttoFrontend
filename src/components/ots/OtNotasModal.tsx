import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, ListGroup, Modal, Spinner } from 'react-bootstrap';
import { FaComments, FaPaperPlane, FaTrash } from 'react-icons/fa';
import { OtNota, otNotasService } from '@/services/otNotas.service';
import { useAuth } from '@/context/AuthContext';

interface OtNotasModalProps {
  show: boolean;
  onHide: () => void;
  otId: string;
}

/**
 * Displays every note attached to an OT and lets the user add or remove them.
 * Notes are refetched on open so the modal never shows stale data even if the
 * OT was updated in another tab / by another user since the last view.
 */
const OtNotasModal: React.FC<OtNotasModalProps> = ({ show, onHide, otId }) => {
  const { user } = useAuth();
  const [notas, setNotas] = useState<OtNota[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const usuarioNombre = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Usuario';

  const refresh = useCallback(async () => {
    if (!otId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await otNotasService.list(otId);
      setNotas(list);
    } catch (err) {
      console.error('Error listando notas:', err);
      setError('No fue posible cargar las notas.');
    } finally {
      setLoading(false);
    }
  }, [otId]);

  useEffect(() => {
    if (show) {
      refresh();
    } else {
      setDescripcion('');
      setError(null);
    }
  }, [show, refresh]);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = descripcion.trim();
    if (!value) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await otNotasService.add(otId, value, usuarioNombre);
      setNotas(updated);
      setDescripcion('');
    } catch (err) {
      console.error('Error agregando nota:', err);
      setError('No fue posible agregar la nota.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (notaId: string) => {
    if (!window.confirm('¿Eliminar esta nota?')) return;
    setDeletingId(notaId);
    setError(null);
    try {
      const updated = await otNotasService.remove(otId, notaId);
      setNotas(updated);
    } catch (err) {
      console.error('Error eliminando nota:', err);
      setError('No fue posible eliminar la nota.');
    } finally {
      setDeletingId(null);
    }
  };

  const sortedDesc = [...notas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaComments className="me-2" />
          Notas de la OT
          <span className="text-muted fs-6 ms-2">({notas.length})</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleAdd} className="mb-3">
          <Form.Label className="fw-semibold">Agregar nota</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Escribe una observación sobre esta OT..."
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            maxLength={2000}
            disabled={saving}
          />
          <div className="d-flex justify-content-between align-items-center mt-1">
            <small className="text-muted">{descripcion.length}/2000</small>
            <Button type="submit" variant="primary" size="sm" disabled={saving || !descripcion.trim()}>
              {saving ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  Guardando...
                </>
              ) : (
                <>
                  <FaPaperPlane className="me-1" />
                  Agregar
                </>
              )}
            </Button>
          </div>
        </Form>

        <hr />

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <div className="text-muted mt-2">Cargando notas...</div>
          </div>
        ) : sortedDesc.length === 0 ? (
          <p className="text-muted text-center my-4 mb-0">Aún no hay notas para esta OT.</p>
        ) : (
          <ListGroup variant="flush">
            {sortedDesc.map((nota) => (
              <ListGroup.Item key={nota._id || `${nota.fecha}-${nota.usuarioId}`} className="d-flex justify-content-between align-items-start gap-2">
                <div className="flex-grow-1">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{nota.descripcion}</div>
                  <small className="text-muted d-block mt-1">
                    <strong>{nota.usuarioNombre}</strong> · {new Date(nota.fecha).toLocaleString('es-CO')}
                  </small>
                </div>
                {nota._id && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={() => handleDelete(nota._id!)}
                    disabled={deletingId === nota._id}
                    aria-label="Eliminar nota"
                  >
                    {deletingId === nota._id ? <Spinner size="sm" animation="border" /> : <FaTrash />}
                  </Button>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
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

export default OtNotasModal;
