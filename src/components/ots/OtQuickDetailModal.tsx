import React from 'react';
import { Alert, Badge, Button, Modal, OverlayTrigger, Popover, ProgressBar, Spinner, Table } from 'react-bootstrap';
import { FaExternalLinkAlt, FaStickyNote } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useOT } from '@/hooks/useOTs';
import { useReportes } from '@/hooks/useReportes';
import { Reporte } from '@/types/reporte.types';

interface OtQuickDetailModalProps {
  show: boolean;
  onHide: () => void;
  /** `null` means "no OT selected" — modal stays hidden. */
  otId: string | null;
}

const estadoBadge = (estado?: string) => {
  const s = (estado || '').toLowerCase();
  if (s.includes('pendiente') || s.includes('creada')) return <Badge bg="warning" text="dark">{estado}</Badge>;
  if (s.includes('proceso') || s.includes('curso')) return <Badge bg="primary">{estado}</Badge>;
  if (s.includes('pausada')) return <Badge bg="secondary">{estado}</Badge>;
  if (s.includes('cerrada') || s.includes('completada') || s.includes('finalizada')) return <Badge bg="success">{estado}</Badge>;
  if (s.includes('cancelada')) return <Badge bg="danger">{estado}</Badge>;
  return <Badge bg="info">{estado || 'Sin estado'}</Badge>;
};

const reportEstadoColor = (estado: string) => {
  switch (estado) {
    case 'Pendiente': return 'warning';
    case 'Procesado': return 'success';
    case 'Cerrado': return 'secondary';
    case 'Cancelado': return 'danger';
    default: return 'info';
  }
};

/**
 * Lightweight "peek" view of an OT triggered from the OT list's eye icon.
 * Renders the OT header (consecutivo, cliente, estado, avance) plus a table
 * of its equipos so admins don't have to open the full OT page to know what
 * equipment is in it and whether any of it has a client note (icon +
 * popover with the note text).
 */
const OtQuickDetailModal: React.FC<OtQuickDetailModalProps> = ({ show, onHide, otId }) => {
  const navigate = useNavigate();
  const { data: otData, isLoading: loadingOt, isError: otError } = useOT(otId || '');
  const { data: reportsData, isLoading: loadingReports } = useReportes({ otId: otId || undefined });

  const ot = otData?.data;
  const reportes: Reporte[] = reportsData?.data || [];
  const cliente = typeof ot?.ClienteId === 'object' ? ot.ClienteId : null;
  const isLoading = loadingOt || loadingReports;

  return (
    <Modal show={show && Boolean(otId)} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Detalle de la OT</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading && (
          <div className="text-center py-4">
            <Spinner animation="border" aria-label="Cargando detalle" />
          </div>
        )}

        {!isLoading && otError && (
          <Alert variant="danger">No fue posible cargar el detalle de la OT.</Alert>
        )}

        {!isLoading && ot && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-uppercase small text-muted fw-semibold">Consecutivo</div>
                  <div className="display-6 text-primary fw-bold">{ot.Consecutivo || 'N/A'}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-uppercase small text-muted fw-semibold">Estado</div>
                  <div className="mt-2">{estadoBadge(ot.EstadoOt)}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-uppercase small text-muted fw-semibold">Tipo de servicio</div>
                  <div className="mt-2"><Badge bg="info">{ot.TipoServicio || 'N/A'}</Badge></div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-uppercase small text-muted fw-semibold">Avance</div>
                  {(() => {
                    const avance = Number(ot.Avance ?? 0) || 0;
                    const variant = avance < 30 ? 'danger' : avance < 70 ? 'warning' : 'success';
                    return (
                      <ProgressBar
                        now={avance}
                        label={`${avance}%`}
                        variant={variant}
                        className="mt-2"
                        style={{ height: 20 }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>

            {cliente && (
              <div className="mb-4">
                <div className="text-uppercase small text-muted fw-semibold">Cliente</div>
                <div className="fw-semibold">{cliente.Razonsocial || 'N/A'}</div>
                <div className="small text-muted">
                  {cliente.Nit ? `NIT ${cliente.Nit} · ` : ''}
                  {cliente.Ciudad || ''}
                  {cliente.Direccion ? ` · ${cliente.Direccion}` : ''}
                </div>
              </div>
            )}

            <h6 className="text-uppercase text-muted small fw-semibold">
              Equipos en la OT ({reportes.length})
            </h6>
            {reportes.length === 0 ? (
              <Alert variant="light" className="text-muted small">
                Esta OT aún no tiene reportes de equipos asociados.
              </Alert>
            ) : (
              <Table responsive hover size="sm" className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 100 }}>Consecutivo</th>
                    <th>Equipo</th>
                    <th>Ubicación</th>
                    <th style={{ width: 130 }}>Estado</th>
                    <th style={{ width: 60 }} className="text-center">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.map((r) => (
                    <tr key={r._id}>
                      <td className="small">{r.consecutivo || '—'}</td>
                      <td>
                        <div className="fw-semibold">{r.equipoSnapshot?.ItemText || 'Sin nombre'}</div>
                        <small className="text-muted">
                          {r.equipoSnapshot?.Marca} · {r.equipoSnapshot?.Modelo}
                          {r.equipoSnapshot?.Serie ? ` · S/N ${r.equipoSnapshot.Serie}` : ''}
                        </small>
                      </td>
                      <td className="small">
                        {r.equipoSnapshot?.Sede || '—'}
                        {r.equipoSnapshot?.Servicio ? ` · ${r.equipoSnapshot.Servicio}` : ''}
                        {r.equipoSnapshot?.Ubicacion ? ` · ${r.equipoSnapshot.Ubicacion}` : ''}
                      </td>
                      <td>
                        <Badge bg={reportEstadoColor(r.estado)}>{r.estado}</Badge>
                      </td>
                      <td className="text-center">
                        {r.clientNote?.text ? (
                          <OverlayTrigger
                            trigger={['hover', 'focus', 'click']}
                            placement="left"
                            overlay={
                              <Popover id={`quick-note-${r._id}`} style={{ maxWidth: 320 }}>
                                <Popover.Header as="h6">
                                  Nota del cliente
                                  {r.clientNote.updatedAt && (
                                    <small className="d-block text-muted fw-normal">
                                      {new Date(r.clientNote.updatedAt).toLocaleString('es-CO', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                      })}
                                    </small>
                                  )}
                                </Popover.Header>
                                <Popover.Body style={{ whiteSpace: 'pre-wrap' }}>
                                  {r.clientNote.text}
                                </Popover.Body>
                              </Popover>
                            }
                          >
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-info"
                              aria-label={`Nota del cliente en ${r.consecutivo}`}
                            >
                              <FaStickyNote />
                            </Button>
                          </OverlayTrigger>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        {ot && (
          <Button
            variant="primary"
            onClick={() => {
              onHide();
              navigate(`/ots/${ot._id}`);
            }}
          >
            <FaExternalLinkAlt className="me-1" />
            Abrir OT completa
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default OtQuickDetailModal;
