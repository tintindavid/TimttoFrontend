import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { useDashboardEquiposPeriodo } from '@/hooks/useDashboardSections';
import type { DashboardFilters, EquiposPeriodoCifras, Variacion } from '@/types/dashboard.types';
import DashboardCardShell from './DashboardCardShell';
import FiltrosNoAplicadosNote from './FiltrosNoAplicadosNote';

interface Props {
  filters: DashboardFilters;
  enabled?: boolean;
}

const METRICAS: Array<{ key: keyof EquiposPeriodoCifras; label: string; goodWhenUp: boolean }> = [
  { key: 'programados', label: 'Programados', goodWhenUp: true },
  { key: 'realizados', label: 'Realizados', goodWhenUp: true },
  { key: 'pendientes', label: 'Pendientes', goodWhenUp: false },
  { key: 'vencidos', label: 'Vencidos', goodWhenUp: false },
  { key: 'cancelados', label: 'Cancelados', goodWhenUp: false },
];

export const VariacionBadge: React.FC<{ variacion?: Variacion; goodWhenUp: boolean; label: string }> = ({
  variacion,
  goodWhenUp,
  label,
}) => {
  if (!variacion || variacion.absoluta === 0) {
    return <span className="text-muted small" aria-label={`${label}: sin variación`}>= sin cambio</span>;
  }
  const up = variacion.absoluta > 0;
  const good = up === goodWhenUp;
  const pct = variacion.porcentaje === null ? '' : ` (${Math.abs(variacion.porcentaje).toFixed(1)}%)`;
  const text = `${up ? 'Subió' : 'Bajó'} ${Math.abs(variacion.absoluta)}${pct}`;
  return (
    <span className={`small ${good ? 'text-success' : 'text-danger'}`} aria-label={`${label}: ${text}`}>
      {up ? '▲' : '▼'} {Math.abs(variacion.absoluta)}
      {pct}
    </span>
  );
};

const EquiposPeriodoCard: React.FC<Props> = ({ filters, enabled = true }) => {
  const q = useDashboardEquiposPeriodo(filters, enabled);
  const d = q.data;
  if (d && d.disponible === false) return null;

  return (
    <DashboardCardShell
      title="Equipos del período"
      subtitle={d ? `${d.periodo.etiqueta} · comparado con el período anterior` : undefined}
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => q.refetch()}
    >
      {d && <FiltrosNoAplicadosNote filtros={d.filtrosNoAplicados} />}
      {d && (
        <Row className="g-3 text-center">
          {METRICAS.map((m) => (
            <Col key={m.key} xs={6} md>
              <div className="fs-3 fw-semibold">{d.actual[m.key]}</div>
              <div className="text-muted small">{m.label}</div>
              <VariacionBadge variacion={d.variacion?.[m.key]} goodWhenUp={m.goodWhenUp} label={m.label} />
            </Col>
          ))}
        </Row>
      )}
    </DashboardCardShell>
  );
};

export default EquiposPeriodoCard;
