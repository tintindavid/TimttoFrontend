import React, { useMemo, useState } from 'react';
import { Card, Table, Button, Badge, Modal, OverlayTrigger, Popover, Spinner, Alert } from 'react-bootstrap';
import { Reporte } from '@/types/reporte.types';
import { FaPlay, FaCheck, FaTimes, FaClock, FaTrash, FaStickyNote } from 'react-icons/fa';
import ReportSearchBar, { matchesReportSearch } from './ReportSearchBar';

interface ReportsListProps {
  reportes: Reporte[];
  onReporteSelect: (reporte: Reporte) => void;
  /**
   * Optional. When provided, a delete affordance appears next to the row
   * action for reports in `estado: 'Pendiente'` (backend refuses any other
   * state with 409 `REPORT_NOT_DELETABLE`; this frontend gate stops the
   * click before it happens). Parent decides how to persist (e.g. calls
   * `reportService.delete(id)` + refetches the OT). Receives the reporte
   * so callers can display its consecutivo in a toast.
   */
  onDeleteReporte?: (reporte: Reporte) => Promise<void> | void;
  /** Reserved for future filter chips (marca/modelo/estado). Search input is always on. */
  showFilters?: boolean;
}

const ReportsList: React.FC<ReportsListProps> = ({ reportes, onReporteSelect, onDeleteReporte }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Reporte | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredReportes = useMemo(
    () => reportes.filter((reporte) => matchesReportSearch(reporte, searchTerm)),
    [reportes, searchTerm],
  );

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return <FaClock className="text-info" />;
      case 'Procesado': return <FaPlay className="text-warning" />;
      case 'Cerrado': return <FaCheck className="text-success" />;
      case 'Cancelado': return <FaTimes className="text-danger" />;
      default: return <FaClock className="text-secondary" />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'info';
      case 'Procesado': return 'warning';
      case 'Cerrado': return 'success';
      case 'Cancelado': return 'danger';
      default: return 'secondary';
    }
  };

  const totalCount = reportes.length;
  const shownCount = filteredReportes.length;

  const handleConfirmDelete = async () => {
    if (!pendingDelete || !onDeleteReporte) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteReporte(pendingDelete);
      setPendingDelete(null);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: { code?: string } } } })
          ?.response?.data?.message ||
        (err as Error)?.message ||
        'No fue posible eliminar el reporte.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center gap-2">
        <div>
          <h5 className="mb-0">
            📋 Reportes de Equipos ({shownCount}{shownCount !== totalCount ? ` de ${totalCount}` : ''})
          </h5>
          <small className="text-muted">
            {reportes.filter((r) => r.procesado).length} procesados •{' '}
            {reportes.filter((r) => !r.procesado).length} pendientes
          </small>
        </div>
        <div style={{ minWidth: '260px', maxWidth: '480px', width: '100%' }}>
          <ReportSearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {totalCount === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No hay reportes asociados a esta OT</p>
          </div>
        ) : filteredReportes.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">
              Ningún reporte coincide con "{searchTerm.trim()}". Limpia el filtro para volver a ver todos.
            </p>
          </div>
        ) : (
          <div
            className="table-responsive"
            style={{ maxHeight: '75vh', overflowY: 'auto' }}
          >
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Reporte</th>
                  <th>Equipo</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportes.map((reporte) => (
                  <tr key={reporte._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span>{reporte.consecutivo}</span>
                        {reporte.clientNote?.text && (
                          <OverlayTrigger
                            trigger={['hover', 'focus', 'click']}
                            placement="right"
                            overlay={
                              <Popover id={`note-popover-${reporte._id}`}>
                                <Popover.Header as="h6">
                                  Nota del cliente
                                  {reporte.clientNote.updatedAt && (
                                    <small className="text-muted d-block fw-normal">
                                      {new Date(reporte.clientNote.updatedAt).toLocaleString('es-CO', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                      })}
                                    </small>
                                  )}
                                </Popover.Header>
                                <Popover.Body style={{ whiteSpace: 'pre-wrap' }}>
                                  {reporte.clientNote.text}
                                </Popover.Body>
                              </Popover>
                            }
                          >
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-info"
                              aria-label={`Nota del cliente en ${reporte.consecutivo}`}
                              title="El cliente dejó una nota sobre este reporte"
                            >
                              <FaStickyNote />
                            </Button>
                          </OverlayTrigger>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-bold">{reporte.equipoSnapshot.ItemText}</div>
                        <small className="text-muted">
                          {reporte.equipoSnapshot.Marca} • {reporte.equipoSnapshot.Modelo} • S/N: {reporte.equipoSnapshot.Serie || 'N/A'}
                        </small>
                        {reporte.equipoSnapshot.Inventario && (
                          <div>
                            <small className="text-muted">Inv: {reporte.equipoSnapshot.Inventario}</small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="small">
                          <strong>Sede:</strong> {reporte.equipoSnapshot.Sede || 'No especificada'}
                        </div>
                        <div className="small">
                          <strong>Servicio:</strong> {reporte.equipoSnapshot.Servicio || 'No especificado'} • {reporte.equipoSnapshot.Ubicacion || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        {getEstadoIcon(reporte.estado)}
                        <Badge bg={getEstadoColor(reporte.estado)} className="ms-2">
                          {reporte.estado.replace('_', ' ')}
                        </Badge>
                        {reporte.fechaProcesado && (
                          <small className="text-muted ms-2">
                            {new Date(reporte.fechaProcesado).toLocaleDateString('es-ES')}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-inline-flex gap-1">
                        <Button
                          size="sm"
                          variant={reporte.procesado ? 'outline-primary' : 'primary'}
                          onClick={() => onReporteSelect(reporte)}
                          disabled={reporte.estado === 'Cancelado'}
                        >
                          {reporte.estado === 'Procesado' || reporte.estado === 'Cerrado' || reporte.estado === 'Cancelado' ? (
                            <>
                              <FaCheck className="me-1" />
                              Ver Detalle
                            </>
                          ) : (
                            <>
                              <FaPlay className="me-1" />
                              Trabajar
                            </>
                          )}
                        </Button>
                        {onDeleteReporte && reporte.estado === 'Pendiente' && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => setPendingDelete(reporte)}
                            aria-label={`Eliminar reporte ${reporte.consecutivo}`}
                            title="Eliminar reporte pendiente"
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      <Modal
        show={pendingDelete !== null}
        onHide={() => (isDeleting ? null : setPendingDelete(null))}
        centered
      >
        <Modal.Header closeButton={!isDeleting}>
          <Modal.Title>Eliminar reporte</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Vas a eliminar el reporte <strong>{pendingDelete?.consecutivo}</strong> —{' '}
            {pendingDelete?.equipoSnapshot.ItemText}.
          </p>
          <p className="mb-0 small text-muted">
            Solo se pueden eliminar reportes en estado <strong>Pendiente</strong>. Una vez que el técnico empieza
            a trabajarlos, quedan como parte del historial de la OT.
          </p>
          {deleteError && (
            <Alert variant="danger" className="mt-3 mb-0">
              {deleteError}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setPendingDelete(null)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting && <Spinner as="span" animation="border" size="sm" className="me-2" />}
            Eliminar reporte
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default ReportsList;
