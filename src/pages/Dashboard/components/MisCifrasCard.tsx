import React from 'react';
import { Alert, Col, Row } from 'react-bootstrap';
import { useDashboardMisCifras } from '@/hooks/useDashboardSections';
import type { DashboardFilters } from '@/types/dashboard.types';
import DashboardCardShell from './DashboardCardShell';

interface Props {
  filters: DashboardFilters;
  enabled?: boolean;
}

const MisCifrasCard: React.FC<Props> = ({ filters, enabled = true }) => {
  const q = useDashboardMisCifras(filters, enabled);
  const d = q.data;
  if (d && !d.disponible) return null;

  return (
    <DashboardCardShell
      title="Mis cifras"
      subtitle={d?.periodo.etiqueta}
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => q.refetch()}
    >
      {d?.truncado && (
        <Alert variant="warning" className="py-2 small">
          Se alcanzó el límite de registros: las cifras se calcularon con una muestra parcial del período.
        </Alert>
      )}
      {d && (
        <Row className="g-3 text-center">
          <Col xs={6} md={3}>
            <div className="fs-3 fw-semibold">{d.abiertos}</div>
            <div className="text-muted small">Abiertos</div>
          </Col>
          <Col xs={6} md={3}>
            <div className="fs-3 fw-semibold">{d.realizados}</div>
            <div className="text-muted small">Realizados</div>
          </Col>
          <Col xs={6} md={3}>
            <div className="fs-3 fw-semibold">{d.cancelados}</div>
            <div className="text-muted small">Cancelados</div>
          </Col>
          <Col xs={6} md={3}>
            <div className="fs-3 fw-semibold">
              {d.tiempoPromedioDias === null ? '—' : `${d.tiempoPromedioDias.toFixed(1)} d`}
            </div>
            <div className="text-muted small">Tiempo promedio</div>
          </Col>
        </Row>
      )}
    </DashboardCardShell>
  );
};

export default MisCifrasCard;
