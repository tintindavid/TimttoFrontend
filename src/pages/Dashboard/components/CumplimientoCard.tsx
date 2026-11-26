import React from 'react';
import { Col, ProgressBar, Row, Table } from 'react-bootstrap';
import FiltrosNoAplicadosNote from './FiltrosNoAplicadosNote';
import { useDashboardCumplimiento } from '@/hooks/useDashboardSections';
import type { DashboardFilters } from '@/types/dashboard.types';
import DashboardCardShell from './DashboardCardShell';
import { TrendChart } from './DashboardCharts';

interface Props {
  filters: DashboardFilters;
  enabled?: boolean;
}

export const formatPct = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : `${value.toFixed(1)}%`;

const progressVariant = (pct: number | null): string =>
  pct === null ? 'secondary' : pct >= 90 ? 'success' : pct >= 70 ? 'warning' : 'danger';

const CumplimientoCard: React.FC<Props> = ({ filters, enabled = true }) => {
  const q = useDashboardCumplimiento(filters, enabled);
  const d = q.data;
  if (d && d.disponible === false) return null;

  return (
    <DashboardCardShell
      title="Cumplimiento del cronograma"
      subtitle={d?.periodo.etiqueta}
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => q.refetch()}
    >
      {d && (
        <>
          <FiltrosNoAplicadosNote filtros={d.filtrosNoAplicados} />
          <Row className="align-items-center mb-3">
            <Col md={4}>
              <div className="display-6 fw-semibold">{formatPct(d.porcentaje)}</div>
              <div className="text-muted small">
                {`${d.realizadas} realizadas de ${d.programadas} programadas`}
              </div>
              <div className="text-muted small">{`No programadas realizadas: ${d.noProgramadasRealizadas}`}</div>
              <ProgressBar
                className="mt-2"
                now={d.porcentaje ?? 0}
                max={100}
                variant={progressVariant(d.porcentaje)}
                aria-label="Porcentaje de cumplimiento"
              />
            </Col>
            <Col md={8}>
              {d.tendencia.length === 0 ? (
                <div className="text-muted text-center py-3">Sin datos de tendencia</div>
              ) : (
                <TrendChart
                  ariaLabel="Tendencia de cumplimiento de los últimos 6 meses"
                  labels={d.tendencia.map((t) => t.etiqueta)}
                  datasets={[
                    { label: 'Programadas', data: d.tendencia.map((t) => t.programadas), color: '#6c757d' },
                    { label: 'Realizadas', data: d.tendencia.map((t) => t.realizadas), color: '#198754' },
                  ]}
                />
              )}
            </Col>
          </Row>
          <Row>
            <Col lg={6} className="mb-3">
              <h6 className="small text-muted">Por cliente</h6>
              {d.porCliente.length === 0 ? (
                <div className="text-muted small">Sin datos</div>
              ) : (
                <Table size="sm" responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th className="text-end">Prog.</th>
                      <th className="text-end">Real.</th>
                      <th className="text-end">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.porCliente.map((c) => (
                      <tr key={c.clienteId}>
                        <td>{c.cliente}</td>
                        <td className="text-end">{c.programadas}</td>
                        <td className="text-end">{c.realizadas}</td>
                        <td className="text-end">{formatPct(c.porcentaje)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Col>
            {d.porTipo.length > 0 && (
            <Col lg={6} className="mb-3">
              <h6 className="small text-muted">Por tipo de mantenimiento</h6>
              {(
                <Table size="sm" responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th className="text-end">Prog.</th>
                      <th className="text-end">Cumpl.</th>
                      <th className="text-end">Canc.</th>
                      <th className="text-end">Pend.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.porTipo.map((t) => (
                      <tr key={t.tipo}>
                        <td>{t.tipo}</td>
                        <td className="text-end">{t.programados}</td>
                        <td className="text-end">{t.cumplidos}</td>
                        <td className="text-end">{t.cancelados}</td>
                        <td className="text-end">{t.pendientes}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Col>
            )}
          </Row>
        </>
      )}
    </DashboardCardShell>
  );
};

export default CumplimientoCard;
