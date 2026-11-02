import React, { useState } from 'react';
import { Alert, Badge, Button, Spinner, Table } from 'react-bootstrap';
import { useGetComparativo } from '@/hooks/useLicitacion';
import {
  ESTADO_ENVIO_LABELS,
  ESTADO_ENVIO_VARIANT,
  type ComparativoProveedor,
} from '@/types/licitacion.types';
import type { Requisicion } from '@/types/requisicion.types';
import { formatDateTime, formatMoney, isSafeHttpsUrl } from '@/utils/requisicion.utils';
import ReqHelp from '../help/ReqHelp';
import GanadorModal from './GanadorModal';

interface Props {
  requisicion: Requisicion;
  canSelect: boolean;
}

/** A supplier can only win with a registered quotation (backend: PROVEEDOR_SIN_COTIZACION). */
const tieneCotizacion = (row: ComparativoProveedor): boolean =>
  !!row.fechaRespuesta || !!row.archivo?.url || !!row.linkPropuesta || !!row.observacion || row.valorTotal != null;

/** Read-only side-by-side comparison of the quotations; lets a buyer with permission pick the winner. */
const ComparativoCard: React.FC<Props> = ({ requisicion, canSelect }) => {
  const { data, isLoading, isError } = useGetComparativo(requisicion._id);
  const [candidato, setCandidato] = useState<ComparativoProveedor | null>(null);

  const comparativo = data?.data;
  const rows = comparativo?.proveedores ?? [];
  const puedeElegir = canSelect && requisicion.estado === 'Cotizacion_Recibida' && !requisicion.licitacion?.ganadorId;

  return (
    <div className="mt-4" data-testid="comparativo">
      <div className="text-muted small text-uppercase mb-2">
        Comparativo de cotizaciones
        <ReqHelp id="licitacion.comparativo" />
      </div>
      {isLoading ? (
        <Spinner animation="border" size="sm" aria-label="Cargando comparativo" />
      ) : isError ? (
        <Alert variant="danger">No fue posible cargar el comparativo.</Alert>
      ) : rows.length === 0 ? (
        <p className="text-muted mb-0">No hay cotizaciones para comparar.</p>
      ) : (
        <>
          {!comparativo?.hayComparables && (
            <Alert variant="light" className="py-2 small">
              Las cotizaciones no traen valor en la misma moneda, por eso no se resalta la más económica. Compara los
              documentos y decide.
            </Alert>
          )}
          <div className="table-responsive">
            <Table size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Estado</th>
                  <th className="text-end">Valor total</th>
                  <th className="text-end">Entrega (días)</th>
                  <th>Propuesta</th>
                  <th>Observación</th>
                  {puedeElegir && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.paId} className={row.masEconomica ? 'table-success' : undefined}>
                    <td>
                      {row.nombre}
                      {row.masEconomica && <Badge bg="success" className="ms-2">Más económica</Badge>}
                    </td>
                    <td>
                      <Badge bg={ESTADO_ENVIO_VARIANT[row.estadoEnvio] ?? 'secondary'}>
                        {ESTADO_ENVIO_LABELS[row.estadoEnvio] ?? row.estadoEnvio}
                      </Badge>
                      {row.fechaRespuesta && <div className="small text-muted">{formatDateTime(row.fechaRespuesta)}</div>}
                    </td>
                    <td className="text-end">
                      {row.valorTotal != null ? formatMoney(row.valorTotal, row.moneda ?? requisicion.moneda) : '—'}
                    </td>
                    <td className="text-end">{row.tiempoEntregaDias ?? '—'}</td>
                    <td>
                      {row.archivo?.url && (
                        <div>
                          {isSafeHttpsUrl(row.archivo.url) ? (
                            <a href={row.archivo.url} target="_blank" rel="noopener noreferrer">
                              {row.archivo.nombre ?? 'Archivo'}
                            </a>
                          ) : (
                            <span className="text-break">{row.archivo.nombre ?? 'Archivo'} (enlace no seguro)</span>
                          )}
                        </div>
                      )}
                      {row.linkPropuesta && (
                        <div>
                          {isSafeHttpsUrl(row.linkPropuesta) ? (
                            <a href={row.linkPropuesta} target="_blank" rel="noopener noreferrer">
                              Enlace
                            </a>
                          ) : (
                            <span className="text-break">{row.linkPropuesta}</span>
                          )}
                        </div>
                      )}
                      {!row.archivo?.url && !row.linkPropuesta && '—'}
                    </td>
                    <td className="small">{row.observacion ?? '—'}</td>
                    {puedeElegir && (
                      <td>
                        {row.estadoEnvio !== 'Rechazado' && row.estadoEnvio !== 'Descartado' && tieneCotizacion(row) && (
                          <span className="d-inline-flex align-items-center gap-1">
                            <Button
                              size="sm"
                              variant="success"
                              aria-label={`Seleccionar ganador ${row.nombre}`}
                              onClick={() => setCandidato(row)}
                            >
                              Seleccionar ganador
                            </Button>
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {puedeElegir && <ReqHelp id="accion.seleccionarGanador" className="ms-0" />}
        </>
      )}
      <GanadorModal
        show={!!candidato}
        onHide={() => setCandidato(null)}
        requisicionId={requisicion._id}
        candidato={candidato}
      />
    </div>
  );
};

export default ComparativoCard;
