import React, { useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { PERMISSIONS } from '@/constants/permissions';
import { useAuth } from '@/context/AuthContext';
import { useCurrentUserPermissions } from '@/hooks/usePermission';
import {
  useAprobarOrdenCompra,
  useDescargarOrdenCompraPdf,
  useEnviarOrdenCompra,
  useRechazarOrdenCompra,
  useReenviarOrdenCompra,
} from '@/hooks/useOrdenCompra';
import { ORDEN_COMPRA_ESTADO_LABELS, ORDEN_COMPRA_ESTADO_VARIANT } from '@/types/ordenCompra.types';
import type { Requisicion } from '@/types/requisicion.types';
import { actorName, canDecideOcLevel, formatDateTime, formatDateUtc, formatMoney, getEventMeta, refId } from '@/utils/requisicion.utils';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { saveBlob } from '@/utils/saveBlob';
import ConfirmModal from '@/components/common/ConfirmModal';
import ReqHelp from '../help/ReqHelp';
import OrdenCompraModal from './OrdenCompraModal';
import ReenviarOcModal from './ReenviarOcModal';
import ReasonModal from './ReasonModal';

interface Props {
  requisicion: Requisicion;
}

/** Timeline events that make up the history of the purchase order. */
const OC_HISTORY_EVENTS = ['OC_EMITIDA', 'OC_EDITADA', 'OC_REAPROBACION_REQUERIDA', 'OC_RECHAZADA', 'OC_APROBADA', 'OC_ENVIADA', 'OC_REENVIADA'];

const mailFailed = (estadoCorreo?: string | null): boolean => !!estadoCorreo && estadoCorreo !== 'Enviado';

/** "Orden de compra" block of the detail: estimate vs total, excess, version history and the actions the user can take. */
const OrdenCompraPanel: React.FC<Props> = ({ requisicion }) => {
  const { user } = useAuth();
  const { has } = useCurrentUserPermissions();
  const aprobar = useAprobarOrdenCompra();
  const rechazar = useRechazarOrdenCompra();
  const enviar = useEnviarOrdenCompra();
  const reenviar = useReenviarOrdenCompra();
  const pdf = useDescargarOrdenCompraPdf();

  const [modalMode, setModalMode] = useState<'emitir' | 'editar' | null>(null);
  const [showRechazar, setShowRechazar] = useState(false);
  const [showEnviar, setShowEnviar] = useState(false);
  const [showCorreo, setShowCorreo] = useState(false);

  const { estado } = requisicion;
  const oc = requisicion.ordenCompra;
  const moneda = oc?.moneda ?? requisicion.moneda;
  const canIssue = has(PERMISSIONS.REQUISICIONES_ISSUE_PO);
  const canApprovePo = has(PERMISSIONS.REQUISICIONES_APPROVE_PO);
  const canApprove = has(PERMISSIONS.REQUISICIONES_APPROVE);
  const manageAll = has(PERMISSIONS.REQUISICIONES_MANAGE_ALL);
  const isEmisor = !!user?._id && refId(oc?.emitidaPor?.usuarioId) === user._id;
  const isEditor = !!user?._id && refId(oc?.editadaPor?.usuarioId) === user._id;

  // Segregation of duties (the backend enforces it too): the issuer neither approves nor rejects their own order.
  const canEmitir = estado === 'Adjudicada' && canIssue;
  const canEditar = estado === 'OC_Emitida' && canIssue && (isEmisor || manageAll);
  // Simple path (OC_Emitida): approve-po and not the issuer. Reapproval: the E1 eligibility of the current level.
  const canDecidir =
    (estado === 'OC_Emitida' && canApprovePo && !isEmisor && !isEditor) ||
    (estado === 'OC_En_Reaprobacion' && (canApprovePo || canApprove) && canDecideOcLevel(requisicion, user));
  const canEnviar = estado === 'OC_Aprobada' && canIssue;
  const canReenviar = (estado === 'OC_Enviada' || estado === 'En_Recepcion') && !!oc?.envio?.enviadaEn && (canIssue || manageAll);
  const sinCorreo = oc?.envio?.estadoCorreo === 'Sin_correo';
  const busy = aprobar.isLoading || rechazar.isLoading || enviar.isLoading || reenviar.isLoading;

  const run = async (action: () => Promise<unknown>, ok: string, fallback: string) => {
    try {
      await action();
      toast.success(ok);
      return true;
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, fallback));
      return false;
    }
  };

  const handleAprobar = () =>
    run(() => aprobar.mutateAsync({ id: requisicion._id, data: { version: oc?.version ?? 0 } }), 'Orden de compra aprobada.', 'No fue posible aprobar la orden de compra.');

  const handleRechazar = async (observacion: string) => {
    const ok = await run(
      () => rechazar.mutateAsync({ id: requisicion._id, data: { observacion, version: oc?.version ?? 0 } }),
      'Orden de compra rechazada.',
      'No fue posible rechazar la orden de compra.'
    );
    if (ok) setShowRechazar(false);
  };

  const handleEnviar = async () => {
    setShowEnviar(false);
    await run(() => enviar.mutateAsync(requisicion._id), 'Orden de compra enviada al proveedor.', 'No fue posible enviar la orden de compra.');
  };

  // Without an e-mail on file the user must supply one; otherwise the server resends to the registered address.
  const handleReenviar = () => {
    if (sinCorreo) {
      setShowCorreo(true);
      return;
    }
    return run(() => reenviar.mutateAsync({ id: requisicion._id }), 'Correo reenviado al proveedor.', 'No fue posible reenviar la orden de compra.');
  };

  const handlePdf = async () => {
    try {
      const blob = await pdf.mutateAsync(requisicion._id);
      saveBlob(blob, `${oc?.numero ?? 'orden-compra'}.pdf`);
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible descargar el PDF de la orden de compra.'));
    }
  };

  const history = (requisicion.timeline ?? []).filter((e) => OC_HISTORY_EVENTS.includes(e.tipo));
  const niveles = oc?.aprobacion?.niveles ?? [];
  const exceso = oc?.exceso;

  return (
    <Card className="tt-card mb-3" data-testid="orden-compra-panel">
      <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 className="h6 mb-0">
          Orden de compra
          <ReqHelp id="oc.panel" />
        </h2>
        <div className="d-flex flex-wrap gap-2">
          {canEmitir && (
            <span className="d-inline-flex align-items-center gap-1">
              <Button size="sm" variant="primary" onClick={() => setModalMode('emitir')}>
                Emitir orden de compra
              </Button>
              <ReqHelp id="accion.emitirOc" placement="bottom" className="ms-0" />
            </span>
          )}
          {canEditar && (
            <Button size="sm" variant="outline-primary" onClick={() => setModalMode('editar')} disabled={busy}>
              Editar
            </Button>
          )}
          {canDecidir && (
            <>
              <span className="d-inline-flex align-items-center gap-1">
                <Button size="sm" variant="success" onClick={handleAprobar} disabled={busy}>
                  {aprobar.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
                  Aprobar orden
                </Button>
                <ReqHelp id="accion.aprobarOc" placement="bottom" className="ms-0" />
              </span>
              <Button size="sm" variant="outline-danger" onClick={() => setShowRechazar(true)} disabled={busy}>
                Rechazar orden
              </Button>
            </>
          )}
          {canEnviar && (
            <span className="d-inline-flex align-items-center gap-1">
              <Button size="sm" variant="primary" onClick={() => setShowEnviar(true)} disabled={busy}>
                Enviar al proveedor
              </Button>
              <ReqHelp id="accion.enviarOc" placement="bottom" className="ms-0" />
            </span>
          )}
          {canReenviar && (
            <Button size="sm" variant="outline-primary" onClick={handleReenviar} disabled={busy}>
              {reenviar.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
              Reenviar correo
            </Button>
          )}
          {oc && (
            <Button size="sm" variant="outline-secondary" onClick={handlePdf} disabled={pdf.isLoading}>
              {pdf.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
              Descargar PDF
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        {!oc ? (
          <p className="text-muted mb-0">
            {canEmitir
              ? 'El proveedor ganador ya fue elegido. Emite la orden de compra con los precios reales para poder registrar la recepción.'
              : 'Aún no se ha emitido la orden de compra.'}
          </p>
        ) : (
          <>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span className="fw-semibold">{oc.numero}</span>
              <Badge bg="secondary" data-testid="oc-version">
                Versión {oc.version}
              </Badge>
              <Badge bg={ORDEN_COMPRA_ESTADO_VARIANT[oc.estado] ?? 'secondary'}>
                {ORDEN_COMPRA_ESTADO_LABELS[oc.estado] ?? oc.estado}
              </Badge>
            </div>

            {exceso?.requerido && (
              <Alert variant="warning" className="py-2" data-testid="oc-exceso">
                {exceso.estimado > 0
                  ? `El total (${formatMoney(exceso.total, moneda)}) supera el estimado (${formatMoney(exceso.estimado, moneda)}) más el margen de ${exceso.margenPct} %.`
                  : `La requisición no tenía monto estimado (total: ${formatMoney(exceso.total, moneda)}).`}{' '}
                La orden necesita reaprobación.
                <ReqHelp id="oc.exceso" />
              </Alert>
            )}

            {niveles.length > 0 && (
              <ul className="list-unstyled small mb-3" aria-label="Niveles de reaprobación">
                {niveles.map((n) => (
                  <li key={n.orden}>
                    Nivel {n.orden}
                    {n.nombre ? ` · ${n.nombre}` : ''}: <strong>{n.estado}</strong>
                    {n.observacion ? ` — ${n.observacion}` : ''}
                  </li>
                ))}
              </ul>
            )}

            <div className="table-responsive">
              <Table size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th className="text-end">Cantidad</th>
                    <th className="text-end">Precio unitario</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {oc.lineas.map((l) => (
                    <tr key={l.lineaId}>
                      <td>{l.descripcion}</td>
                      <td className="text-end">{l.cantidad}</td>
                      <td className="text-end">{formatMoney(l.precioUnitario, moneda)}</td>
                      <td className="text-end">{formatMoney(l.subtotal, moneda)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3} className="text-end">
                      Total de la orden
                    </th>
                    <th className="text-end" data-testid="oc-total">
                      {formatMoney(oc.total, moneda)}
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-end text-muted small">
                      Monto estimado de la requisición
                    </td>
                    <td className="text-end text-muted small" data-testid="oc-estimado">
                      {formatMoney(requisicion.montoEstimado, requisicion.moneda)}
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </div>

            <dl className="row small mb-2">
              <dt className="col-sm-3 text-muted">Fecha de entrega</dt>
              <dd className="col-sm-9">{formatDateUtc(oc.fechaEntrega)}</dd>
              <dt className="col-sm-3 text-muted">Condiciones</dt>
              <dd className="col-sm-9">{oc.condiciones || '—'}</dd>
              <dt className="col-sm-3 text-muted">Entregables</dt>
              <dd className="col-sm-9">{oc.requiereEntregables ? 'Se exigen soportes al proveedor' : 'No se exigen'}</dd>
              <dt className="col-sm-3 text-muted">Emitida por</dt>
              <dd className="col-sm-9">
                {oc.emitidaPor?.nombre || '—'} · {formatDateTime(oc.emitidaEn)}
              </dd>
              {oc.aprobadaEn && (
                <>
                  <dt className="col-sm-3 text-muted">Aprobada</dt>
                  <dd className="col-sm-9">
                    {typeof oc.aprobadaPor === 'object' && oc.aprobadaPor ? oc.aprobadaPor.nombre : ''}{' '}
                    {formatDateTime(oc.aprobadaEn)}
                  </dd>
                </>
              )}
              {oc.envio?.enviadaEn && (
                <>
                  <dt className="col-sm-3 text-muted">Enviada al proveedor</dt>
                  <dd className="col-sm-9">
                    {formatDateTime(oc.envio.enviadaEn)}
                    {oc.envio.estadoCorreo && (
                      <Badge bg={mailFailed(oc.envio.estadoCorreo) ? 'danger' : 'success'} className="ms-2">
                        Correo: {oc.envio.estadoCorreo}
                      </Badge>
                    )}
                  </dd>
                </>
              )}
            </dl>

            {oc.envio?.enviadaEn && mailFailed(oc.envio.estadoCorreo) && canReenviar && (
              <Alert variant="danger" className="py-2 small">
                El correo al proveedor falló, pero la orden quedó enviada. Usa «Reenviar correo» para intentarlo de nuevo.
              </Alert>
            )}

            {history.length > 0 && (
              <details className="small">
                <summary>Historial de la orden ({history.length})</summary>
                <ul className="mb-0 ps-3">
                  {history.map((e, index) => {
                    const version = e.datos && typeof e.datos.version === 'number' ? ` · versión ${e.datos.version}` : '';
                    return (
                      <li key={e.eventId ?? index}>
                        {getEventMeta(e.tipo).label}
                        {version} · {formatDateTime(e.fecha)} · {actorName(e.actor)}
                        {e.observacion ? ` — ${e.observacion}` : ''}
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}
          </>
        )}
      </Card.Body>

      {modalMode && <OrdenCompraModal show onHide={() => setModalMode(null)} requisicion={requisicion} mode={modalMode} />}
      <ReasonModal
        helpId="accion.rechazarOc"
        show={showRechazar}
        title="Rechazar orden de compra"
        label="Observación"
        confirmLabel="Rechazar orden"
        confirmVariant="danger"
        isSubmitting={rechazar.isLoading}
        onConfirm={handleRechazar}
        onHide={() => setShowRechazar(false)}
      />
      <ReenviarOcModal show={showCorreo} onHide={() => setShowCorreo(false)} requisicionId={requisicion._id} />
      <ConfirmModal
        show={showEnviar}
        title="Enviar orden de compra"
        body="Se enviará la orden al proveedor ganador con el enlace de su portal. Una orden enviada ya no se puede modificar."
        confirmLabel="Enviar"
        onConfirm={handleEnviar}
        onCancel={() => setShowEnviar(false)}
      />
    </Card>
  );
};

export default OrdenCompraPanel;
