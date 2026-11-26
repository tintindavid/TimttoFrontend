import React from 'react';
import { Alert, Col, Row, Table } from 'react-bootstrap';
import { useDashboardTiempos } from '@/hooks/useDashboardSections';
import type { DashboardFilters } from '@/types/dashboard.types';
import DashboardCardShell from './DashboardCardShell';
import { VerticalBarChart } from './DashboardCharts';

interface Props {
  filters: DashboardFilters;
  enabled?: boolean;
}

const days = (v: number | null | undefined): string => (v === null || v === undefined ? '—' : `${v.toFixed(1)} d`);

const TiemposCard: React.FC<Props> = ({ filters, enabled = true }) => {
  const q = useDashboardTiempos(filters, enabled);
  const d = q.data;
  if (d && !d.disponible) return null;

  return (
    <DashboardCardShell
      title="Tiempos de ejecución"
      subtitle={d ? `${d.periodo.etiqueta} · ${d.total} reportes` : undefined}
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => q.refetch()}
    >
      {d && (
        <>
          {d.truncado && (
            <Alert variant="warning" className="py-2 small">
              Se alcanzó el límite de registros: los tiempos se calcularon con una muestra parcial del período.
            </Alert>
          )}
          <Row className="text-center mb-3 g-3">
            <Col xs={4}>
              <div className="fs-4 fw-semibold">{days(d.promedioDias)}</div>
              <div className="text-muted small">Promedio</div>
            </Col>
            <Col xs={4}>
              <div className="fs-4 fw-semibold">{days(d.medianaDias)}</div>
              <div className="text-muted small">Mediana</div>
            </Col>
            <Col xs={4}>
              <div className="fs-4 fw-semibold">{days(d.p90Dias)}</div>
              <div className="text-muted small">P90</div>
            </Col>
          </Row>
          {d.total === 0 ? (
            <div className="text-muted text-center py-3">Sin datos en el período</div>
          ) : (
            <Row>
              <Col lg={6} className="mb-3">
                <h6 className="small text-muted">Distribución de tiempos</h6>
                <VerticalBarChart
                  ariaLabel="Histograma de tiempos de ejecución"
                  labels={d.histograma.map((h) => h.rango)}
                  datasets={[{ label: 'Reportes', data: d.histograma.map((h) => h.cantidad) }]}
                />
              </Col>
              <Col lg={6} className="mb-3">
                <h6 className="small text-muted">OTs más lentas</h6>
                <Table size="sm" responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>OT</th>
                      <th className="text-end">Promedio</th>
                      <th className="text-end">Reportes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.masLentas.map((o) => (
                      <tr key={o.otId}>
                        <td>{o.consecutivo}</td>
                        <td className="text-end">{days(o.promedioDias)}</td>
                        <td className="text-end">{o.reportes}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          )}
        </>
      )}
    </DashboardCardShell>
  );
};

export default TiemposCard;
