import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import { useDashboardOperativos } from '@/hooks/useDashboardSections';
import type { DashboardFilters } from '@/types/dashboard.types';
import DashboardCardShell from './DashboardCardShell';
import FiltrosNoAplicadosNote from './FiltrosNoAplicadosNote';
import { DoughnutChart, HorizontalBarChart } from './DashboardCharts';

interface Props {
  filters: DashboardFilters;
  enabled?: boolean;
}

const Counter: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="text-center">
    <div className="fs-3 fw-semibold">{value}</div>
    <div className="text-muted small">{label}</div>
  </div>
);

const OperativosCard: React.FC<Props> = ({ filters, enabled = true }) => {
  const { can } = useTenantCapabilities();
  const q = useDashboardOperativos(filters, enabled);
  const d = q.data;

  const showOts = can('executesServices') && d?.otsPorEstado.disponible;
  const showPvC = can('executesServices') && d?.preventivoVsCorrectivo.disponible;
  const showEquipos = d?.equiposPorEstadoOperativo.disponible;
  const showTickets = can('usesQrs') && d?.ticketsAbiertos.disponible;
  const showReq = can('usesRequisiciones') && d?.requisicionesPendientes.disponible;
  const nothing = d && !showOts && !showPvC && !showEquipos && !showTickets && !showReq;

  return (
    <DashboardCardShell
      title="Indicadores operativos"
      subtitle={d?.periodo.etiqueta}
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => q.refetch()}
    >
      {d && <FiltrosNoAplicadosNote filtros={d.filtrosNoAplicados} />}
      {d &&
        (nothing ? (
          <div className="text-muted text-center py-3">Sin indicadores disponibles</div>
        ) : (
          <Row className="g-3">
            {(showTickets || showReq) && (
              <Col xs={12}>
                <Row>
                  {showTickets && (
                    <Col xs={6}>
                      <Counter label="Tickets abiertos" value={d.ticketsAbiertos.cantidad} />
                    </Col>
                  )}
                  {showReq && (
                    <Col xs={6}>
                      <Counter label="Requisiciones pendientes" value={d.requisicionesPendientes.cantidad} />
                    </Col>
                  )}
                </Row>
              </Col>
            )}
            {showOts && (
              <Col md={6}>
                <h6 className="small text-muted">OTs por estado</h6>
                {d.otsPorEstado.items.length === 0 ? (
                  <div className="text-muted small">Sin datos</div>
                ) : (
                  <HorizontalBarChart
                    ariaLabel="OTs por estado"
                    labels={d.otsPorEstado.items.map((i) => i.estado)}
                    datasets={[{ label: 'OTs', data: d.otsPorEstado.items.map((i) => i.cantidad) }]}
                  />
                )}
              </Col>
            )}
            {showPvC && (
              <Col md={6}>
                <h6 className="small text-muted">Preventivo vs correctivo</h6>
                {d.preventivoVsCorrectivo.preventivo + d.preventivoVsCorrectivo.correctivo + d.preventivoVsCorrectivo.otros === 0 ? (
                  <div className="text-muted small">Sin datos</div>
                ) : (
                  <DoughnutChart
                    ariaLabel="Preventivo versus correctivo"
                    labels={['Preventivo', 'Correctivo', 'Otros']}
                    data={[
                      d.preventivoVsCorrectivo.preventivo,
                      d.preventivoVsCorrectivo.correctivo,
                      d.preventivoVsCorrectivo.otros,
                    ]}
                  />
                )}
              </Col>
            )}
            {showEquipos && (
              <Col md={6}>
                <h6 className="small text-muted">Equipos por estado operativo</h6>
                {d.equiposPorEstadoOperativo.items.length === 0 ? (
                  <div className="text-muted small">Sin datos</div>
                ) : (
                  <HorizontalBarChart
                    ariaLabel="Equipos por estado operativo"
                    labels={d.equiposPorEstadoOperativo.items.map((i) => i.estado)}
                    datasets={[{ label: 'Equipos', data: d.equiposPorEstadoOperativo.items.map((i) => i.cantidad) }]}
                  />
                )}
              </Col>
            )}
          </Row>
        ))}
    </DashboardCardShell>
  );
};

export default OperativosCard;
