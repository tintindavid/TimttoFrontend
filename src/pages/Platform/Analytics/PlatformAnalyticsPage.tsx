import React, { useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useGetAnalyticsSummary, useGetAnalyticsTenants } from '@/hooks/usePlatformAnalytics';
import { PlatformAnalyticsService } from '@/services/platformAnalytics.service';
import { downloadCsv } from '@/utils/downloadFile.util';
import type { AnalyticsFilters } from '@/types';
import AnalyticsFilterBar from './components/AnalyticsFilterBar';
import KpiCards from './components/KpiCards';
import OtsPerTenantChart from './components/OtsPerTenantChart';
import OtsByTypeChart from './components/OtsByTypeChart';
import EquiposTimelineChart from './components/EquiposTimelineChart';
import TenantsBreakdownTable from './components/TenantsBreakdownTable';

// Default range: last 12 months
const defaultFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);
const defaultTo = new Date().toISOString().slice(0, 10);

const PlatformAnalyticsPage: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<AnalyticsFilters>({
    from: defaultFrom,
    to: defaultTo,
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useGetAnalyticsSummary(appliedFilters);

  const {
    data: tenants,
    isLoading: tenantsLoading,
    isError: tenantsError,
  } = useGetAnalyticsTenants(appliedFilters);

  const isLoading = summaryLoading || tenantsLoading;
  const isError = summaryError || tenantsError;

  const handleExportCsv = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const url = PlatformAnalyticsService.getTenantsCsvUrl(appliedFilters);
      await downloadCsv(url, `tenants-analytics-${today}.csv`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al exportar el CSV';
      toast.error(message);
    }
  };

  return (
    <Container fluid>
      {/* Header */}
      <Row className="align-items-center mb-4">
        <Col>
          <h4 className="mb-0">Analytics de Plataforma</h4>
          <small className="text-muted">Métricas globales cross-tenant — SuperAdmin</small>
        </Col>
      </Row>

      {/* Filter bar — always visible so user can adjust even on error */}
      <AnalyticsFilterBar
        initialFilters={appliedFilters}
        onApply={setAppliedFilters}
        onExportCsv={handleExportCsv}
      />

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" aria-label="Cargando métricas de plataforma" />
          <div className="mt-2 text-muted">Calculando métricas…</div>
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <Alert variant="danger">
          Error al cargar las métricas de la plataforma. Intenta de nuevo.
        </Alert>
      )}

      {/* Content — only when both queries resolved successfully */}
      {!isLoading && !isError && summary && tenants && (
        <>
          <KpiCards summary={summary} />

          {/* Charts row */}
          <Row className="g-3 mb-4">
            <Col xs={12} md={7}>
              <OtsPerTenantChart data={summary.otsPerTenant} />
            </Col>
            <Col xs={12} md={5}>
              <OtsByTypeChart byType={summary.otStats.byType} />
            </Col>
          </Row>

          {/* Timeline full-width */}
          <Row className="mb-4">
            <Col>
              <EquiposTimelineChart data={summary.equiposTimeline} />
            </Col>
          </Row>

          {/* Drill-down table */}
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Header className="fw-semibold">Detalle por tenant</Card.Header>
                <Card.Body className="p-0 overflow-auto">
                  <TenantsBreakdownTable rows={tenants} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default PlatformAnalyticsPage;
