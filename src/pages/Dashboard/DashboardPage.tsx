import React from 'react';
import { Alert, Col, Container, Row } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import AlertasCard from './components/AlertasCard';
import CumplimientoCard from './components/CumplimientoCard';
import DashboardFiltersBar from './components/DashboardFiltersBar';
import EquiposPeriodoCard from './components/EquiposPeriodoCard';
import ItemsBarChart from './components/ItemsBarChart';
import MisCifrasCard from './components/MisCifrasCard';
import OperativosCard from './components/OperativosCard';
import RankingCard from './components/RankingCard';
import TiemposCard from './components/TiemposCard';

const DashboardPage: React.FC = () => {
  const { user, tenantId, viewAsTenantId } = useAuth();
  const { can } = useTenantCapabilities();
  const { filters, setFilter, reset } = useDashboardFilters();

  // Platform view (superadmin outside view-as) has no tenant: never hit /dashboard/* from there.
  const isPlatformView = user?.role === 'superadmin' && !viewAsTenantId;
  const hasTenant = !isPlatformView && !!(viewAsTenantId || tenantId);
  const rangeIncomplete = filters.periodo === 'rango' && !(filters.desde && filters.hasta);
  const rangeInverted =
    filters.periodo === 'rango' && !!filters.desde && !!filters.hasta && filters.desde > filters.hasta;
  const active = hasTenant && !rangeIncomplete && !rangeInverted;

  const executes = can('executesServices');

  return (
    <Container fluid>
      <Row className="mb-3">
        <Col>
          <h4 className="mb-0">Dashboard</h4>
          <p className="text-muted mb-0">Indicadores de mantenimiento de la organización</p>
        </Col>
      </Row>

      {isPlatformView ? (
        <Alert variant="info">Elige un tenant (ver como) para ver el dashboard</Alert>
      ) : (
        <>
          <DashboardFiltersBar filters={filters} onChange={setFilter} onReset={reset} enabled={hasTenant} />
          {rangeIncomplete && <Alert variant="secondary">Selecciona las fechas desde y hasta para ver el rango.</Alert>}
          {rangeInverted && <Alert variant="warning">La fecha "desde" no puede ser posterior a la fecha "hasta".</Alert>}

          <Row className="g-3">
            <Col xs={12}>
              <CumplimientoCard filters={filters} enabled={active} />
            </Col>
                          <Col xs={12}>
                <EquiposPeriodoCard filters={filters} enabled={active} />
              </Col>

            {executes && (
              <Col lg={6}>
                <MisCifrasCard filters={filters} enabled={active} />
              </Col>
            )}
            {executes && (
              <Col lg={6}>
                <RankingCard filters={filters} enabled={active} />
              </Col>
            )}
            {executes && (
              <Col lg={6}>
                <ItemsBarChart filters={filters} enabled={active} />
              </Col>
            )}
            {executes && (
              <Col xs={12}>
                <TiemposCard filters={filters} enabled={active} />
              </Col>
            )}
            <Col xs={12}>
              <OperativosCard filters={filters} enabled={active} />
            </Col>
            <Col xs={12}>
              <AlertasCard filters={filters} enabled={active} />
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default DashboardPage;
