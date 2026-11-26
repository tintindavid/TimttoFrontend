import React from 'react';
import { Badge, Col, Row, Table } from 'react-bootstrap';
import { useDashboardAlertas } from '@/hooks/useDashboardSections';
import type { DashboardFilters } from '@/types/dashboard.types';
import DashboardCardShell from './DashboardCardShell';
import FiltrosNoAplicadosNote from './FiltrosNoAplicadosNote';

interface Props {
  filters: DashboardFilters;
  enabled?: boolean;
}

const AlertasCard: React.FC<Props> = ({ filters, enabled = true }) => {
  const q = useDashboardAlertas(filters, enabled);
  const d = q.data;
  if (d && !d.otsVencidas.disponible && !d.equiposSinMantenimiento.disponible) return null;

  return (
    <DashboardCardShell
      title="Alertas"
      subtitle={d?.periodo.etiqueta}
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => q.refetch()}
    >
      {d && <FiltrosNoAplicadosNote filtros={d.filtrosNoAplicados} />}
      {d && (
        <Row>
          {d.otsVencidas.disponible && (
            <Col lg={6} className="mb-3">
              <h6 className="small text-muted">
                OTs vencidas <Badge bg="danger">{d.otsVencidas.cantidad}</Badge>
              </h6>
              {d.otsVencidas.items.length === 0 ? (
                <div className="text-muted small">Sin OTs vencidas</div>
              ) : (
                <Table size="sm" responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>OT</th>
                      <th>Cliente</th>
                      <th className="text-end">Días abierta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.otsVencidas.items.map((o) => (
                      <tr key={o.otId}>
                        <td>{o.consecutivo}</td>
                        <td>{o.cliente}</td>
                        <td className="text-end">{o.diasAbierta}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Col>
          )}
          {d.equiposSinMantenimiento.disponible && (
            <Col lg={6} className="mb-3">
              <h6 className="small text-muted">
                Equipos sin mantenimiento <Badge bg="warning" text="dark">{d.equiposSinMantenimiento.cantidad}</Badge>
              </h6>
              {d.equiposSinMantenimiento.items.length === 0 ? (
                <div className="text-muted small">Sin equipos pendientes</div>
              ) : (
                <Table size="sm" responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Equipo</th>
                      <th>Serie</th>
                      <th>Último mtto.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.equiposSinMantenimiento.items.map((e) => (
                      <tr key={e.equipoId}>
                        <td>{e.nombre}</td>
                        <td>{e.serie}</td>
                        <td>{e.ultimoMtto ? e.ultimoMtto.slice(0, 10) : 'Nunca'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Col>
          )}
        </Row>
      )}
    </DashboardCardShell>
  );
};

export default AlertasCard;
