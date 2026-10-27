import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Breadcrumb, Button, Card, Col, Container, Row, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useCurrentUserPermissions } from '@/hooks/usePermission';
import {
  useAprobarRequisicion,
  useCambiarEstadoRequisicion,
  useCancelarRequisicion,
  useDeleteRequisicion,
  useEnviarRequisicion,
  useGetRequisicion,
  useRechazarRequisicion,
} from '@/hooks/useRequisiciones';
import { PERMISSIONS } from '@/constants/permissions';
import { getApiErrorCode, getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import {
  canActAsOwner,
  canDecideCurrentLevel,
  catalogName,
  formatDate,
  formatDateTime,
  formatMoney,
  userRefName,
} from '@/utils/requisicion.utils';
import ApprovalPanel from './components/ApprovalPanel';
import ReasonModal from './components/ReasonModal';
import RequisicionEstadoBadge from './components/RequisicionEstadoBadge';
import RequisicionTimeline from './components/RequisicionTimeline';
import ReqHelp from './help/ReqHelp';
import type { HelpId } from './help/requisicionHelp';

type ReasonAction = 'rechazar' | 'retirar' | 'reabrir' | 'cancelar';

const REASON_CONFIG: Record<
  ReasonAction,
  { title: string; label: string; confirm: string; variant: 'primary' | 'danger' | 'success' | 'warning' }
> = {
  rechazar: { title: 'Rechazar requisición', label: 'Observación', confirm: 'Rechazar', variant: 'danger' },
  retirar: { title: 'Retirar requisición', label: 'Observación', confirm: 'Retirar', variant: 'warning' },
  reabrir: { title: 'Reabrir requisición', label: 'Observación', confirm: 'Reabrir', variant: 'primary' },
  cancelar: { title: 'Cancelar requisición', label: 'Motivo de la cancelación', confirm: 'Cancelar requisición', variant: 'danger' },
};

/** Action button followed by its "(!)" hint, kept together when the action row wraps. */
const ActionWithHelp: React.FC<{ helpId: HelpId; children: React.ReactNode }> = ({ helpId, children }) => (
  <span className="d-inline-flex align-items-center gap-1">
    {children}
    <ReqHelp id={helpId} className="ms-0" placement="bottom" />
  </span>
);

const RequisicionDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { has } = useCurrentUserPermissions();

  const { data, isLoading, isError, refetch } = useGetRequisicion(id);
  const enviarMutation = useEnviarRequisicion();
  const aprobarMutation = useAprobarRequisicion();
  const rechazarMutation = useRechazarRequisicion();
  const cambiarEstadoMutation = useCambiarEstadoRequisicion();
  const cancelarMutation = useCancelarRequisicion();
  const deleteMutation = useDeleteRequisicion();

  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const requisicion = data?.data;

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" aria-label="Cargando requisición" />
      </Container>
    );
  }

  if (isError || !requisicion) {
    return (
      <Container>
        <Alert variant="danger">No fue posible cargar la requisición.</Alert>
        <Link to="/requisiciones">Volver al listado</Link>
      </Container>
    );
  }

  const { estado } = requisicion;
  // Only the creator / requester act on a requisicion, unless the user holds `requisiciones:manage-all`.
  const owner = canActAsOwner(requisicion, user, has(PERMISSIONS.REQUISICIONES_MANAGE_ALL));
  const canEdit = estado === 'Borrador' && owner && has(PERMISSIONS.REQUISICIONES_UPDATE);
  const canSend = estado === 'Borrador' && owner && has(PERMISSIONS.REQUISICIONES_SEND);
  const canDelete = estado === 'Borrador' && owner && has(PERMISSIONS.REQUISICIONES_DELETE);
  const canWithdraw = (estado === 'Enviada' || estado === 'En_Aprobacion') && owner;
  const canReopen = estado === 'Rechazada' && owner;
  const canCancel = estado !== 'Cancelada' && has(PERMISSIONS.REQUISICIONES_CANCEL);
  const canDecide = has(PERMISSIONS.REQUISICIONES_APPROVE) && canDecideCurrentLevel(requisicion, user);
  const hasActions = canEdit || canSend || canDelete || canWithdraw || canReopen || canCancel || canDecide;

  const run = async (action: () => Promise<unknown>, okMessage: string, errorFallback: string) => {
    try {
      await action();
      toast.success(okMessage);
      return true;
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, errorFallback));
      // Stale decision (409): reload so the user sees, and decides on, the current version.
      if (getApiErrorCode(err) === 'VERSION_DESACTUALIZADA') {
        setReasonAction(null);
        await refetch();
      }
      return false;
    }
  };

  const handleEnviar = () =>
    run(() => enviarMutation.mutateAsync(requisicion._id), 'Requisición enviada a aprobación.', 'No fue posible enviar la requisición.');

  // Approve / reject always carry the version of the requisicion that is on screen.
  const handleAprobar = () =>
    run(
      () => aprobarMutation.mutateAsync({ id: requisicion._id, data: { version: requisicion.version } }),
      'Nivel aprobado.',
      'No fue posible aprobar la requisición.'
    );

  const handleDelete = async () => {
    setShowDelete(false);
    const ok = await run(() => deleteMutation.mutateAsync(requisicion._id), 'Requisición eliminada.', 'No fue posible eliminar la requisición.');
    if (ok) navigate('/requisiciones');
  };

  const handleReason = async (text: string) => {
    if (!reasonAction) return;
    const idValue = requisicion._id;
    let ok = false;
    if (reasonAction === 'rechazar') {
      ok = await run(
        () => rechazarMutation.mutateAsync({ id: idValue, data: { version: requisicion.version, observacion: text } }),
        'Requisición rechazada.',
        'No fue posible rechazar la requisición.'
      );
    } else if (reasonAction === 'cancelar') {
      ok = await run(() => cancelarMutation.mutateAsync({ id: idValue, data: { motivo: text } }), 'Requisición cancelada.', 'No fue posible cancelar la requisición.');
    } else {
      const done = reasonAction === 'retirar' ? 'Requisición retirada.' : 'Requisición reabierta.';
      ok = await run(
        () => cambiarEstadoMutation.mutateAsync({ id: idValue, data: { estado: 'Borrador', observacion: text } }),
        done,
        'No fue posible cambiar el estado de la requisición.'
      );
    }
    if (ok) setReasonAction(null);
  };

  const reasonSubmitting =
    rechazarMutation.isLoading || cancelarMutation.isLoading || cambiarEstadoMutation.isLoading;
  const busy = reasonSubmitting || enviarMutation.isLoading || aprobarMutation.isLoading || deleteMutation.isLoading;
  const reasonCfg = reasonAction ? REASON_CONFIG[reasonAction] : null;

  return (
    <Container fluid>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/requisiciones' }}>
          Requisiciones
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{requisicion.consecutivo}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="align-items-start mb-3 g-2">
        <Col>
          <h1 className="h3 mb-1">
            {requisicion.consecutivo} · {requisicion.titulo}
            <ReqHelp id="pagina.detalle" placement="bottom" />
          </h1>
          <RequisicionEstadoBadge estado={estado} />
          <ReqHelp id="estados.leyenda" />
        </Col>
        {hasActions && (
          <Col xs="auto" className="d-flex flex-wrap gap-2 justify-content-end">
            {canEdit && (
              <ActionWithHelp helpId="accion.editar">
                <Button variant="outline-primary" onClick={() => navigate(`/requisiciones/${requisicion._id}/edit`)} disabled={busy}>
                  Editar
                </Button>
              </ActionWithHelp>
            )}
            {canSend && (
              <ActionWithHelp helpId="accion.enviar">
                <Button variant="primary" onClick={handleEnviar} disabled={busy}>
                  {enviarMutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
                  Enviar
                </Button>
              </ActionWithHelp>
            )}
            {canDecide && (
              <>
                <ActionWithHelp helpId="accion.aprobar">
                  <Button variant="success" onClick={handleAprobar} disabled={busy}>
                    {aprobarMutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
                    Aprobar
                  </Button>
                </ActionWithHelp>
                <ActionWithHelp helpId="accion.rechazar">
                  <Button variant="outline-danger" onClick={() => setReasonAction('rechazar')} disabled={busy}>
                    Rechazar
                  </Button>
                </ActionWithHelp>
              </>
            )}
            {canWithdraw && (
              <ActionWithHelp helpId="accion.retirar">
                <Button variant="outline-warning" onClick={() => setReasonAction('retirar')} disabled={busy}>
                  Retirar
                </Button>
              </ActionWithHelp>
            )}
            {canReopen && (
              <ActionWithHelp helpId="accion.reabrir">
                <Button variant="outline-primary" onClick={() => setReasonAction('reabrir')} disabled={busy}>
                  Reabrir
                </Button>
              </ActionWithHelp>
            )}
            {canCancel && (
              <ActionWithHelp helpId="accion.cancelar">
                <Button variant="outline-danger" onClick={() => setReasonAction('cancelar')} disabled={busy}>
                  Cancelar requisición
                </Button>
              </ActionWithHelp>
            )}
            {canDelete && (
              <ActionWithHelp helpId="accion.eliminar">
                <Button variant="outline-secondary" onClick={() => setShowDelete(true)} disabled={busy}>
                  Eliminar
                </Button>
              </ActionWithHelp>
            )}
          </Col>
        )}
      </Row>

      <Row className="g-3">
        <Col lg={8}>
          <Card className="tt-card mb-3">
            <Card.Body>
              <div className="text-muted small text-uppercase mb-2">
                Datos generales
                <ReqHelp id="detalle.encabezado" />
              </div>
              <Row className="g-3">
                <Col md={4}>
                  <div className="text-muted small">Tipo</div>
                  <div>{catalogName(requisicion.tipoRequisicionId)}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Área</div>
                  <div>{catalogName(requisicion.areaId)}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Prioridad</div>
                  <div>{requisicion.prioridad}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">
                    Solicitante
                    <ReqHelp id="detalle.solicitante" />
                  </div>
                  <div>{userRefName(requisicion.solicitanteId ?? requisicion.creadaPor)}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Fecha requerida</div>
                  <div>{formatDate(requisicion.fechaRequerida)}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Creada</div>
                  <div>{formatDateTime(requisicion.createdAt)}</div>
                </Col>
                {requisicion.justificacion && (
                  <Col xs={12}>
                    <div className="text-muted small">Justificación</div>
                    <div>{requisicion.justificacion}</div>
                  </Col>
                )}
                {estado === 'Cancelada' && requisicion.canceladaMotivo && (
                  <Col xs={12}>
                    <div className="text-muted small">Motivo de cancelación</div>
                    <div>{requisicion.canceladaMotivo}</div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          <Card className="tt-card mb-3">
            <Card.Header as="h6" className="mb-0">
              Líneas
              <ReqHelp id="detalle.lineas" />
            </Card.Header>
            <Card.Body>
              {requisicion.lineas.length === 0 ? (
                <p className="text-muted mb-0">La requisición no tiene líneas.</p>
              ) : (
                <div className="table-responsive">
                  <Table size="sm" className="align-middle">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th className="text-end">Cantidad</th>
                        <th>Unidad</th>
                        <th className="text-end">Precio estimado</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requisicion.lineas.map((linea, index) => (
                        <tr key={linea._id ?? index}>
                          <td>
                            {linea.descripcion}
                            {linea.especificaciones && <div className="small text-muted">{linea.especificaciones}</div>}
                            {linea.inventarioItemId && <div className="small text-muted">Ítem de stock</div>}
                          </td>
                          <td className="text-end">{linea.cantidadSolicitada}</td>
                          <td>{linea.unidad}</td>
                          <td className="text-end">{formatMoney(linea.precioEstimado, linea.moneda ?? requisicion.moneda)}</td>
                          <td className="text-end">
                            {formatMoney(linea.cantidadSolicitada * linea.precioEstimado, linea.moneda ?? requisicion.moneda)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={4} className="text-end">
                          Monto estimado
                          <ReqHelp id="detalle.monto" placement="top" />
                        </th>
                        <th className="text-end" data-testid="monto-estimado">
                          {formatMoney(requisicion.montoEstimado, requisicion.moneda)}
                        </th>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="tt-card mb-3">
            <Card.Header as="h6" className="mb-0">
              Historial
              <ReqHelp id="detalle.timeline" />
            </Card.Header>
            <Card.Body>
              <RequisicionTimeline events={requisicion.timeline ?? []} />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <ApprovalPanel requisicion={requisicion} />
        </Col>
      </Row>

      {reasonCfg && (
        <ReasonModal
          helpId={`accion.${reasonAction}` as HelpId}
          show={!!reasonAction}
          title={reasonCfg.title}
          label={reasonCfg.label}
          confirmLabel={reasonCfg.confirm}
          confirmVariant={reasonCfg.variant}
          isSubmitting={reasonSubmitting}
          onConfirm={handleReason}
          onHide={() => setReasonAction(null)}
        />
      )}

      <ConfirmModal
        show={showDelete}
        title="Eliminar requisición"
        body="¿Seguro que deseas eliminar este borrador? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </Container>
  );
};

export default RequisicionDetailPage;
