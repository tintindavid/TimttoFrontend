import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, ListGroup, Row, Spinner, Tab, Tabs } from 'react-bootstrap';
import { usePortalConsolidated } from '@/hooks/portal/usePortalData';
import { PortalOt, PortalReportEstado, PortalReportSummary } from '@/types/publicPortal.types';
import PortalRevoked from './PortalRevoked';
import ReportDetailModal from './ReportDetailModal';
import SignatureModal, { SignatureModalReportGroup } from './SignatureModal';
import PortalFilterBar, {
  EMPTY_FILTERS,
  PortalFilterValues,
  reportMatchesFilters,
} from './PortalFilterBar';

const estadoBadgeVariant = (estado: PortalReportEstado): string => {
  switch (estado) {
    case 'Cancelado':
      return 'danger';
    case 'Cerrado':
      return 'secondary';
    case 'Procesado':
      return 'success';
    case 'En_Progreso':
      return 'info';
    case 'Pendiente':
    default:
      return 'warning';
  }
};

const estadoOperativoBadgeVariant = (estado?: string | null): string => {
  switch (estado) {
    case 'Operativo':
      return 'success';
    case 'Fuera de Servicio':
      return 'danger';
    case 'En Mantenimiento':
    case 'En Reparacion':
      return 'info';
    case 'Espera de Repuestos':
      return 'warning';
    default:
      return 'light';
  }
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

type TabKey = 'para-revisar' | 'cerrados' | 'pendientes';

/**
 * Tabs decision (2026-08-02): the client only NEEDS to act on `Procesado`
 * reports (admin already curated them). `Cerrado` and `Pendiente` are shown
 * on secondary tabs as read-only pipeline visibility so the client can see
 * what's coming without being distracted by "what to review". `Cancelado`
 * is intentionally hidden — cancelled reports are noise for the client.
 */
const TAB_FILTERS: Record<TabKey, (r: PortalReportSummary) => boolean> = {
  'para-revisar': (r) => r.estado === 'Procesado' && !r.isSheeted,
  // "Cerrados" bundles two cases: reports the technician has closed but that
  // the admin hasn't promoted to Procesado yet (`estado: 'Cerrado'`), AND
  // reports the client has already signed (Procesado + sheeted). This way
  // the client sees their signed reports here after signing instead of them
  // vanishing (2026-08-02 UX ask).
  cerrados: (r) => r.estado === 'Cerrado' || (r.estado === 'Procesado' && Boolean(r.isSheeted)),
  pendientes: (r) => r.estado === 'Pendiente',
};

/**
 * Home screen of `/portal/:token/*` — lists OTs with their reports grouped
 * underneath, per "Client opens the portal with an active token" scenario.
 * Reacts to HTTP 410 by rendering `PortalRevoked` instead (no OT data
 * leaks). Reacts to a plain 404 with a neutral "not found" message.
 */
const PortalHome: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('para-revisar');
  // Single filter shared across every tab — the client asked explicitly for
  // "un solo filtro para todas las ordenes" (2026-08-04).
  const [filters, setFilters] = useState<PortalFilterValues>(EMPTY_FILTERS);

  const { data, isLoading, isError, error } = usePortalConsolidated(token);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" aria-label="Cargando" />
      </div>
    );
  }

  if (isError) {
    const status = error?.response?.status;
    if (status === 410) {
      const revokedAt = (error.response?.data as { revokedAt?: string } | undefined)?.revokedAt;
      return <PortalRevoked revokedAt={revokedAt} />;
    }
    return (
      <Alert variant="danger">
        Este link no es válido. Verifique la URL o solicite un nuevo acceso.
      </Alert>
    );
  }

  const view = data?.data;
  const ots: PortalOt[] = view?.ots ?? [];
  // Cancelled reports are hidden from every tab and every UI surface —
  // keep them out of the filter selects too so the client never sees a
  // ghost option that hides everything when picked (2026-08-04).
  const filterableOts: PortalOt[] = ots
    .map((ot) => ({ ...ot, reports: ot.reports.filter((r) => r.estado !== 'Cancelado') }))
    .filter((ot) => ot.reports.length > 0);

  /** A report is "reviewed and pending signature" when clientReview is set AND
   *  the report is not yet in a signed sheet. The sign endpoint enforces the
   *  same rule server-side; this count feeds the top-bar button label. */
  const isReviewedPendingSignature = (r: PortalReportSummary): boolean =>
    Boolean(r.clientReview) && !r.isSheeted;

  const reviewedCount = (reports: PortalReportSummary[]): number =>
    reports.filter(isReviewedPendingSignature).length;

  const totalReviewed = ots.reduce((sum, ot) => sum + reviewedCount(ot.reports), 0);

  /** Reports about to be signed, grouped by OT — feeds `SignatureModal`. */
  const reviewedReports: SignatureModalReportGroup[] = ots
    .map((ot) => ({
      otId: ot._id,
      otConsecutivo: ot.Consecutivo || ot._id,
      reports: ot.reports
        .filter(isReviewedPendingSignature)
        .map((r) => ({ _id: r._id, consecutivo: r.consecutivo || r._id })),
    }))
    .filter((group) => group.reports.length > 0);

  const handleSignClick = () => setSignatureOpen(true);

  // Per-tab counts drive the badges next to each tab label so the client
  // sees where the action lives at a glance ("Para revisar (3)"). Filtered
  // counts (2026-08-04) so the badges match what's actually shown.
  const counts: Record<TabKey, number> = {
    'para-revisar': 0,
    cerrados: 0,
    pendientes: 0,
  };
  for (const ot of ots) {
    for (const r of ot.reports) {
      if (!reportMatchesFilters(r, filters)) continue;
      (Object.keys(TAB_FILTERS) as TabKey[]).forEach((key) => {
        if (TAB_FILTERS[key](r)) counts[key] += 1;
      });
    }
  }

  const renderOtsForTab = (tabKey: TabKey) => {
    const filter = TAB_FILTERS[tabKey];
    const otsForTab = ots
      .map((ot) => ({
        ...ot,
        reports: ot.reports.filter((r) => filter(r) && reportMatchesFilters(r, filters)),
      }))
      .filter((ot) => ot.reports.length > 0);

    if (otsForTab.length === 0) {
      const isFilterActive =
        filters.q !== '' ||
        filters.item !== '' ||
        filters.marca !== '' ||
        filters.ubicacion !== '' ||
        filters.estadoOperativo !== '';
      return (
        <Alert variant="light" className="text-muted small mb-0">
          {isFilterActive
            ? 'Ningún equipo coincide con los filtros aplicados.'
            : tabKey === 'para-revisar'
            ? 'No hay reportes pendientes de tu revisión en este momento.'
            : 'No hay reportes en este estado.'}
        </Alert>
      );
    }

    return otsForTab.map((ot) => {
      const otReviewedCount = reviewedCount(ot.reports);
      return (
        <Card key={ot._id} className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <strong>{ot.Consecutivo || ot._id}</strong>
              <Badge bg="light" text="dark" className="ms-2">
                {ot.EstadoOt || 'Sin estado'}
              </Badge>
              {tabKey === 'para-revisar' && (
                <Badge bg="secondary" className="ms-2">
                  {otReviewedCount} de {ot.reports.length} revisados
                </Badge>
              )}
            </div>
            <div className="small text-muted">Avance: {ot.Avance ?? 0}%</div>
          </Card.Header>
          <ListGroup variant="flush">
            {ot.reports.map((report: PortalReportSummary) => {
              // Prefer processed date (when the technician officially closed
              // the report) over finalizado; falls back to finalizado for
              // older reports that predate fechaProcesado.
              const fechaCol = report.fechaProcesado || report.fechaFinalizado;
              return (
                <ListGroup.Item
                  key={report._id}
                  action
                  onClick={() => setSelectedReportId(report._id)}
                >
                  {/* Grid interno para las 4 columnas de datos + badges.
                      xs stacked, md 4-col grid (2026-08-04). */}
                  <Row className="g-2 align-items-center">
                    <Col xs={12} md={4}>
                      <div className="fw-semibold">
                        {report.equipoSnapshot?.ItemText || 'Equipo sin nombre'}
                      </div>
                      <div className="small text-muted">
                        {report.equipoSnapshot?.Marca} {report.equipoSnapshot?.Modelo} ·{' '}
                        {report.equipoSnapshot?.Serie}
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div className="small">
                        <span className="text-muted">Ubicación: </span>
                        {report.equipoSnapshot?.Ubicacion || '—'}
                      </div>
                      <div className="small">
                        <span className="text-muted">Inventario: </span>
                        {report.equipoSnapshot?.Inventario || '—'}
                      </div>
                    </Col>
                    <Col xs={6} md={2}>
                      <div className="small text-muted mb-1">Estado operativo</div>
                      {report.estadoOperativo ? (
                        <Badge
                          bg={estadoOperativoBadgeVariant(report.estadoOperativo)}
                          text={estadoOperativoBadgeVariant(report.estadoOperativo) === 'light' ? 'dark' : undefined}
                        >
                          {report.estadoOperativo}
                        </Badge>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </Col>
                    <Col xs={6} md={2}>
                      <div className="small text-muted mb-1">Fecha</div>
                      <div className="small">{formatDate(fechaCol)}</div>
                    </Col>
                    <Col xs={6} md={1} className="text-md-end">
                      <div className="d-flex flex-wrap gap-1 justify-content-md-end">
                        {report.clientNote?.text && (
                          <Badge bg="info" pill title="Este reporte tiene una nota tuya">
                            Nota
                          </Badge>
                        )}
                        {report.clientReview && (
                          <Badge bg="success" pill>
                            Revisado
                          </Badge>
                        )}
                        <Badge bg={estadoBadgeVariant(report.estado)}>{report.estado}</Badge>
                      </div>
                    </Col>
                  </Row>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Card>
      );
    });
  };

  const clienteName = view?.cliente?.name;

  return (
    <>
      <Card
        className="mb-4 border-0 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 100%)',
          color: '#fff',
        }}
      >
        <Card.Body className="py-4 px-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h4 className="mb-1 fw-bold">
                Bienvenido{clienteName ? `, ${clienteName}` : ''}
              </h4>
              <p className="mb-0" style={{ opacity: 0.9, maxWidth: 720 }}>
                Este portal se habilitó para que puedas <strong>revisar en detalle</strong> los
                reportes de las órdenes de servicio ejecutadas y <strong>recibirlos a satisfacción</strong>{' '}
                con tu firma. Nuestro compromiso es que cada intervención sea trazable, transparente
                y respaldada por evidencia.
              </p>
            </div>
            <div className="text-end small" style={{ opacity: 0.8 }}>
              <div>Órdenes activas: <strong>{ots.length}</strong></div>
              <div>Reportes revisados y pendientes de firma: <strong>{totalReviewed}</strong></div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <Button variant="primary" disabled={totalReviewed === 0} onClick={handleSignClick}>
          Firmar {totalReviewed} reportes
        </Button>
        <Link to={`/portal/${token}/historial`}>Ver historial</Link>
      </div>

      {ots.length === 0 ? (
        <Alert variant="info">No hay órdenes de trabajo asociadas a este acceso.</Alert>
      ) : (
        <>
          <PortalFilterBar ots={filterableOts} value={filters} onChange={setFilters} />
          <Tabs
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k as TabKey)}
          className="mb-3"
          // Unmount inactive panes so the DOM only carries reports the client
          // is actually looking at — matches the mental model ("if I'm on
          // Para revisar, I shouldn't see Cerrados") and makes the tab tests
          // able to assert absence without inspecting CSS visibility.
          mountOnEnter
          unmountOnExit
        >
          <Tab
            eventKey="para-revisar"
            title={
              <span>
                Para revisar{' '}
                <Badge bg="primary" pill>
                  {counts['para-revisar']}
                </Badge>
              </span>
            }
          >
            {renderOtsForTab('para-revisar')}
          </Tab>
          <Tab
            eventKey="cerrados"
            title={
              <span>
                Cerrados{' '}
                <Badge bg="secondary" pill>
                  {counts.cerrados}
                </Badge>
              </span>
            }
          >
            {renderOtsForTab('cerrados')}
          </Tab>
          <Tab
            eventKey="pendientes"
            title={
              <span>
                Pendientes{' '}
                <Badge bg="warning" text="dark" pill>
                  {counts.pendientes}
                </Badge>
              </span>
            }
          >
            {renderOtsForTab('pendientes')}
          </Tab>
        </Tabs>
        </>
      )}

      <ReportDetailModal
        token={token}
        reportId={selectedReportId}
        onHide={() => setSelectedReportId(null)}
      />

      {/* Conditionally mounted so `useSign` (React Query mutation) never runs
          unless the client actually opens the signature flow — keeps this
          component's existing tests QueryClientProvider-free. */}
      {signatureOpen && (
        <SignatureModal
          show
          onHide={() => setSignatureOpen(false)}
          token={token}
          reviewedReports={reviewedReports}
        />
      )}
    </>
  );
};

export default PortalHome;
