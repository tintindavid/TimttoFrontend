import React, { useState } from 'react';
import { Alert, Badge, Button, Card, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ConfirmModal from '@/components/common/ConfirmModal';
import { PERMISSIONS } from '@/constants/permissions';
import { useAuth } from '@/context/AuthContext';
import { useCurrentUserPermissions } from '@/hooks/usePermission';
import { useCerrarCotizaciones, useQuitarProveedor } from '@/hooks/useLicitacion';
import {
  ESTADO_ENVIO_LABELS,
  ESTADO_ENVIO_VARIANT,
  LICITACION_MAX_PROVEEDORES,
  type ProveedorLicitacion,
} from '@/types/licitacion.types';
import type { Requisicion } from '@/types/requisicion.types';
import { OC_ESTADOS, formatDateTime, formatMoney, isCreator } from '@/utils/requisicion.utils';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import ReqHelp from '../help/ReqHelp';
import AbrirLicitacionModal from './AbrirLicitacionModal';
import AmpliarFechaModal from './AmpliarFechaModal';
import AsignarProveedorModal from './AsignarProveedorModal';
import ComparativoCard from './ComparativoCard';
import CompraDirectaModal from './CompraDirectaModal';
import CotizacionInternaModal from './CotizacionInternaModal';
import ReenviarInvitacionModal from './ReenviarInvitacionModal';

interface Props {
  requisicion: Requisicion;
}

/** Suppliers that are still in the race (neither declined nor discarded). */
const isActivo = (p: ProveedorLicitacion): boolean => p.estadoEnvio !== 'Rechazado' && p.estadoEnvio !== 'Descartado';

const hasCotizacion = (p: ProveedorLicitacion): boolean => !!p.tieneCotizacion || !!p.cotizacion?.fechaRespuesta || !!p.cotizacion?.archivo || !!p.cotizacion?.linkPropuesta || !!p.cotizacion?.observacion;

/** "Compras y licitación" panel of the detail: suppliers, invitations, quotations, comparison and winner. */
const LicitacionPanel: React.FC<Props> = ({ requisicion }) => {
  const { user } = useAuth();
  const { has } = useCurrentUserPermissions();
  const canManage = has(PERMISSIONS.REQUISICIONES_MANAGE_SUPPLIERS);
  const canWinner = has(PERMISSIONS.REQUISICIONES_SELECT_WINNER);
  const quitarMutation = useQuitarProveedor();
  const cerrarMutation = useCerrarCotizaciones();

  const [showAsignar, setShowAsignar] = useState(false);
  const [showAbrir, setShowAbrir] = useState(false);
  const [showCompraDirecta, setShowCompraDirecta] = useState(false);
  const [showCerrar, setShowCerrar] = useState(false);
  const [showAmpliar, setShowAmpliar] = useState(false);
  const [reenviar, setReenviar] = useState<ProveedorLicitacion | null>(null);
  const [cotizar, setCotizar] = useState<ProveedorLicitacion | null>(null);

  const { estado } = requisicion;
  const licitacion = requisicion.licitacion;
  const proveedores = licitacion?.proveedores ?? [];
  const activos = proveedores.filter(isActivo);
  const aprobada = estado === 'Aprobada';
  const enLicitacion = estado === 'En_Licitacion';
  // The comparativo endpoint answers 403 without purchasing permissions, so the card is not even mounted.
  const showComparativo = (canManage || canWinner) && estado === 'Cotizacion_Recibida' || estado === 'Adjudicada' || OC_ESTADOS.includes(estado) || (estado === 'En_Recepcion' && !!licitacion?.ganadorId);
  const compraDirecta = !!licitacion?.compraDirecta;

  const run = async (action: () => Promise<unknown>, ok: string, fallback: string) => {
    try {
      await action();
      toast.success(ok);
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, fallback));
    }
  };

  const handleQuitar = (p: ProveedorLicitacion) =>
    run(() => quitarMutation.mutateAsync({ id: requisicion._id, paId: p._id }), 'Proveedor retirado.', 'No fue posible retirar al proveedor.');

  const handleCerrar = async () => {
    setShowCerrar(false);
    await run(() => cerrarMutation.mutateAsync(requisicion._id), 'Cotizaciones cerradas.', 'No fue posible cerrar las cotizaciones.');
  };

  const canEditSuppliers = (aprobada || enLicitacion) && canManage;
  const canOpen = aprobada && canManage && activos.filter((p) => !!p.correoEnvio).length >= 2;
  const canCerrar = enLicitacion && canManage && proveedores.some(hasCotizacion);
  // Segregation of duties: the creator cannot award their own requisicion (the backend enforces it too).
  const canDirecta = aprobada && canWinner && !isCreator(requisicion, user);
  const hasWriteActions = canEditSuppliers && enLicitacion;

  return (
    <Card className="tt-card mb-3" data-testid="licitacion-panel">
      <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 className="h6 mb-0">
          Compras y licitación
          <ReqHelp id="licitacion.panel" />
        </h2>
        <div className="d-flex flex-wrap gap-2">
          {canEditSuppliers && (
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => setShowAsignar(true)}
              disabled={proveedores.length >= LICITACION_MAX_PROVEEDORES}
            >
              Asignar proveedor
            </Button>
          )}
          {canOpen && (
            <span className="d-inline-flex align-items-center gap-1">
              <Button size="sm" variant="primary" onClick={() => setShowAbrir(true)}>
                Abrir licitación
              </Button>
            </span>
          )}
          {enLicitacion && canManage && (
            <span className="d-inline-flex align-items-center gap-1">
              <Button size="sm" variant="outline-secondary" onClick={() => setShowAmpliar(true)}>
                Ampliar fecha límite
              </Button>
              <ReqHelp id="accion.ampliarFecha" placement="bottom" className="ms-0" />
            </span>
          )}
          {canCerrar && (
            <span className="d-inline-flex align-items-center gap-1">
              <Button size="sm" variant="warning" onClick={() => setShowCerrar(true)} disabled={cerrarMutation.isLoading}>
                Cerrar cotizaciones
              </Button>
              <ReqHelp id="accion.cerrarCotizaciones" placement="bottom" className="ms-0" />
            </span>
          )}
          {canDirecta && (
            <span className="d-inline-flex align-items-center gap-1">
              <Button size="sm" variant="outline-secondary" onClick={() => setShowCompraDirecta(true)}>
                Compra directa
              </Button>
              <ReqHelp id="accion.compraDirecta" placement="bottom" className="ms-0" />
            </span>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        {licitacion?.fechaLimiteCotizacion && (
          <p className="mb-3">
            <span className="text-muted small text-uppercase me-2">Fecha límite de cotización</span>
            {formatDateTime(licitacion.fechaLimiteCotizacion)}
          </p>
        )}
        {licitacion?.instrucciones && (
          <p className="mb-3">
            <span className="text-muted small text-uppercase me-2">Instrucciones a proveedores</span>
            {licitacion.instrucciones}
          </p>
        )}
        {compraDirecta && <Alert variant="warning" className="py-2">Esta requisición se adjudicó por compra directa.</Alert>}
        {aprobada && canManage && activos.length < 2 && (
          <Alert variant="light" className="py-2 small">
            Asigna al menos dos proveedores con correo para abrir la licitación, o registra una compra directa.
          </Alert>
        )}

        <div className="text-muted small text-uppercase mb-2">
          Proveedores
          <ReqHelp id="licitacion.proveedores" />
        </div>
        {proveedores.length === 0 ? (
          <p className="text-muted mb-0">Aún no hay proveedores asignados.</p>
        ) : (
          <div className="table-responsive">
            <Table size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th className="text-end">Vistas</th>
                  <th>Cotización</th>
                  {(canEditSuppliers || hasWriteActions) && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {proveedores.map((p) => (
                  <tr key={p._id}>
                    <td>{p.nombre}</td>
                    <td>{p.correoEnvio || '—'}</td>
                    <td>
                      <Badge bg={ESTADO_ENVIO_VARIANT[p.estadoEnvio] ?? 'secondary'}>
                        {ESTADO_ENVIO_LABELS[p.estadoEnvio] ?? p.estadoEnvio}
                      </Badge>
                    </td>
                    <td className="text-end">{p.vistasCount ?? 0}</td>
                    <td>
                      {p.cotizacion ? (
                        `Recibida ${formatDateTime(p.cotizacion.fechaRespuesta)}`
                      ) : p.tieneCotizacion ? (
                        <Badge bg="primary">Cotización recibida</Badge>
                      ) : (
                        'Sin cotización'
                      )}
                      {(p.cotizacion?.versiones?.length ?? 0) > 0 && (
                        <details className="small mt-1">
                          <summary>Versiones anteriores ({p.cotizacion?.versiones?.length})</summary>
                          <ul className="mb-0 ps-3">
                            {p.cotizacion?.versiones?.map((v, i) => (
                              <li key={i}>
                                {formatDateTime(v.fechaRespuesta)}
                                {v.valorTotal != null && ` · ${formatMoney(v.valorTotal, v.moneda ?? requisicion.moneda)}`}
                                {v.origen && ` · ${v.origen === 'portal' ? 'portal' : 'interna'}`}
                                {v.archivo?.nombre && ` · ${v.archivo.nombre}`}
                                {v.observacion && ` · ${v.observacion}`}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                    {(canEditSuppliers || hasWriteActions) && (
                      <td className="text-nowrap">
                        {(aprobada || enLicitacion) && canManage && !hasCotizacion(p) && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="me-1"
                            aria-label={`Quitar proveedor ${p.nombre}`}
                            onClick={() => handleQuitar(p)}
                            disabled={quitarMutation.isLoading}
                          >
                            Quitar
                          </Button>
                        )}
                        {enLicitacion && canManage && isActivo(p) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="me-1"
                              aria-label={`Reenviar invitación a ${p.nombre}`}
                              onClick={() => setReenviar(p)}
                            >
                              Reenviar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              aria-label={`Registrar cotización de ${p.nombre}`}
                              onClick={() => setCotizar(p)}
                            >
                              Registrar cotización
                            </Button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {showComparativo && <ComparativoCard requisicion={requisicion} canSelect={canWinner} />}
      </Card.Body>

      <AsignarProveedorModal
        show={showAsignar}
        onHide={() => setShowAsignar(false)}
        requisicionId={requisicion._id}
        assignedIds={proveedores.filter((p) => p.estadoEnvio !== 'Descartado').map((p) => p.proveedorId)}
      />
      <AbrirLicitacionModal show={showAbrir} onHide={() => setShowAbrir(false)} requisicionId={requisicion._id} />
      <ReenviarInvitacionModal show={!!reenviar} onHide={() => setReenviar(null)} requisicionId={requisicion._id} proveedor={reenviar} />
      <CotizacionInternaModal
        show={!!cotizar}
        onHide={() => setCotizar(null)}
        requisicionId={requisicion._id}
        proveedor={cotizar}
        defaultMoneda={requisicion.moneda}
      />
      <AmpliarFechaModal show={showAmpliar} onHide={() => setShowAmpliar(false)} requisicionId={requisicion._id} />
      <CompraDirectaModal show={showCompraDirecta} onHide={() => setShowCompraDirecta(false)} requisicion={requisicion} />
      <ConfirmModal
        show={showCerrar}
        title="Cerrar cotizaciones"
        body="Dejarás de recibir cotizaciones y pasarás a compararlas. Los proveedores que no hayan respondido ya no podrán hacerlo."
        confirmLabel="Cerrar cotizaciones"
        onConfirm={handleCerrar}
        onCancel={() => setShowCerrar(false)}
      />
    </Card>
  );
};

export default LicitacionPanel;
