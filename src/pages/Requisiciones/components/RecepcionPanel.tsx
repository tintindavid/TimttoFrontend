import React, { useState } from 'react';
import { Badge, Button, Card, ListGroup, Table } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/constants/permissions';
import { useCurrentUserPermissions } from '@/hooks/usePermission';
import {
  CONFIRMACION_RESULTADO_LABELS,
  type Recepcion,
  type Requisicion,
  type RequisicionLinea,
} from '@/types/requisicion.types';
import {
  RECEIVABLE_ESTADOS,
  canCerrarLinea,
  cantidadPendienteRecepcion,
  formatDate,
  formatDateTime,
  isHttpsUrl,
  itemsConfirmables,
  lineaEstadoOf,
  registeredBy,
  userRefName,
} from '@/utils/requisicion.utils';
import ReqHelp from '../help/ReqHelp';
import CerrarLineaModal from './CerrarLineaModal';
import ConfirmarEntregaModal from './ConfirmarEntregaModal';
import LineaEstadoBadge from './LineaEstadoBadge';
import RegistrarRecepcionModal from './RegistrarRecepcionModal';

interface Props {
  requisicion: Requisicion;
}

const lineaDescripcion = (req: Requisicion, lineaId: string): string =>
  req.lineas.find((l) => l._id === lineaId)?.descripcion ?? 'Línea';

/** "Recepción" panel of the detail: state per line, reception history with evidence and the actions the user can take. */
const RecepcionPanel: React.FC<Props> = ({ requisicion }) => {
  const { user } = useAuth();
  const { has } = useCurrentUserPermissions();
  const manageAll = has(PERMISSIONS.REQUISICIONES_MANAGE_ALL);
  const canReceive = has(PERMISSIONS.REQUISICIONES_RECEIVE) || manageAll;

  const [showRegistrar, setShowRegistrar] = useState(false);
  const [lineaACerrar, setLineaACerrar] = useState<RequisicionLinea | null>(null);
  const [recepcionAConfirmar, setRecepcionAConfirmar] = useState<Recepcion | null>(null);

  const receivable = RECEIVABLE_ESTADOS.includes(requisicion.estado);
  const hasPending = requisicion.lineas.some((l) => cantidadPendienteRecepcion(l) > 0);
  const canRegistrar = receivable && canReceive && hasPending;
  const recepciones = [...(requisicion.recepciones ?? [])].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  const confirmando = recepcionAConfirmar
    ? itemsConfirmables(requisicion, recepcionAConfirmar, user, manageAll)
    : [];

  return (
    <Card className="tt-card mb-3" data-testid="recepcion-panel">
      <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 className="h6 mb-0">
          Recepción
          <ReqHelp id="recepcion.panel" />
        </h2>
        {canRegistrar && (
          <span className="d-inline-flex align-items-center gap-1">
            <Button size="sm" variant="primary" onClick={() => setShowRegistrar(true)}>
              Registrar recepción
            </Button>
            <ReqHelp id="accion.registrarRecepcion" placement="bottom" className="ms-0" />
          </span>
        )}
      </Card.Header>
      <Card.Body>
        <div className="text-muted small text-uppercase mb-2">
          Estado por línea
          <ReqHelp id="recepcion.lineas" />
        </div>
        <div className="table-responsive mb-4">
          <Table size="sm" className="align-middle">
            <thead>
              <tr>
                <th>Línea</th>
                <th className="text-end">Pedido</th>
                <th className="text-end">Recibido</th>
                <th className="text-end">Confirmado</th>
                <th>Estado</th>
                {canReceive && receivable && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {requisicion.lineas.map((linea, index) => (
                <tr key={linea._id ?? index}>
                  <td>{linea.descripcion}</td>
                  <td className="text-end">{linea.cantidadSolicitada}</td>
                  <td className="text-end">{linea.cantidadRecibida ?? 0}</td>
                  <td className="text-end">{linea.cantidadConfirmada ?? 0}</td>
                  <td>
                    <LineaEstadoBadge estado={lineaEstadoOf(linea)} />
                  </td>
                  {canReceive && receivable && (
                    <td>
                      {canCerrarLinea(linea) && (
                        <Button
                          size="sm"
                          variant="outline-warning"
                          aria-label={`Cerrar con faltante ${linea.descripcion}`}
                          onClick={() => setLineaACerrar(linea)}
                        >
                          Cerrar con faltante
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div className="text-muted small text-uppercase mb-2">
          Historial de recepciones
          <ReqHelp id="recepcion.historial" />
        </div>
        {recepciones.length === 0 ? (
          <p className="text-muted mb-0">Aún no se han registrado recepciones.</p>
        ) : (
          <ListGroup variant="flush">
            {recepciones.map((recepcion) => {
              const confirmables = itemsConfirmables(requisicion, recepcion, user, manageAll);
              const pending = recepcion.items.some((i) => !i.confirmacion);
              return (
                <ListGroup.Item key={recepcion._id} data-testid="recepcion-item">
                  <div className="d-flex flex-wrap justify-content-between gap-2">
                    <div>
                      <div className="fw-semibold">
                        {formatDate(recepcion.fecha)} · recibida por {userRefName(recepcion.recibidaPor)}
                      </div>
                      {recepcion.documento && <div className="small">Documento: {recepcion.documento}</div>}
                      {recepcion.observacion && <div className="small fst-italic">“{recepcion.observacion}”</div>}
                      {(recepcion.evidencias ?? []).length > 0 && (
                        <ul className="list-inline small mb-1" aria-label="Evidencias">
                          {(recepcion.evidencias ?? []).map((ev) => (
                            <li key={ev.url} className="list-inline-item">
                              {isHttpsUrl(ev.url) ? (
                                <a href={ev.url} target="_blank" rel="noopener noreferrer">
                                  {ev.nombre}
                                </a>
                              ) : (
                                <span>{ev.nombre}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="text-end">
                      {confirmables.length > 0 && (
                        <span className="d-inline-flex align-items-center gap-1">
                          <Button size="sm" variant="success" onClick={() => setRecepcionAConfirmar(recepcion)}>
                            Confirmar entrega
                          </Button>
                          <ReqHelp id="accion.confirmarEntrega" placement="bottom" className="ms-0" />
                        </span>
                      )}
                      {confirmables.length === 0 && pending && registeredBy(recepcion, user) && !manageAll && (
                        <small className="text-muted">Registraste esta recepción: otra persona debe confirmarla.</small>
                      )}
                    </div>
                  </div>
                  <Table size="sm" className="mt-2 mb-0">
                    <thead>
                      <tr>
                        <th>Línea</th>
                        <th className="text-end">Recibido</th>
                        <th>Confirmación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recepcion.items.map((item) => (
                        <tr key={item.lineaId}>
                          <td>{lineaDescripcion(requisicion, item.lineaId)}</td>
                          <td className="text-end">{item.cantidadRecibida}</td>
                          <td>
                            {item.confirmacion ? (
                              <>
                                <Badge bg={item.confirmacion.resultado === 'Recibido' ? 'success' : 'danger'}>
                                  {CONFIRMACION_RESULTADO_LABELS[item.confirmacion.resultado] ?? item.confirmacion.resultado}
                                </Badge>
                                <span className="small text-muted ms-2">
                                  {userRefName(item.confirmacion.por)} · {formatDateTime(item.confirmacion.fecha)}
                                </span>
                                {item.confirmacion.observacion && (
                                  <div className="small fst-italic">“{item.confirmacion.observacion}”</div>
                                )}
                              </>
                            ) : (
                              <Badge bg="warning" text="dark">
                                Pendiente de confirmar
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </Card.Body>

      {showRegistrar && (
        <RegistrarRecepcionModal show={showRegistrar} onHide={() => setShowRegistrar(false)} requisicion={requisicion} />
      )}
      <CerrarLineaModal
        show={!!lineaACerrar}
        onHide={() => setLineaACerrar(null)}
        requisicionId={requisicion._id}
        linea={lineaACerrar}
      />
      {recepcionAConfirmar && (
        <ConfirmarEntregaModal
          show
          onHide={() => setRecepcionAConfirmar(null)}
          requisicion={requisicion}
          recepcion={recepcionAConfirmar}
          items={confirmando}
        />
      )}
    </Card>
  );
};

export default RecepcionPanel;
