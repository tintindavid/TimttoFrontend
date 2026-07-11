import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { BsBuilding, BsPeopleFill, BsGear, BsClipboardCheck } from 'react-icons/bs';
import type { AnalyticsSummary } from '@/types';

interface Props {
  summary: AnalyticsSummary;
}

const KpiCards: React.FC<Props> = ({ summary }) => {
  const { tenantStats, userStats, equipoTotal, otStats } = summary;

  return (
    <Row className="g-3 mb-4">
      {/* Card 1: Tenants */}
      <Col xs={12} md={3}>
        <Card className="h-100 shadow-sm">
          <Card.Body>
            <div className="d-flex align-items-center mb-2">
              <BsBuilding size={24} className="text-primary me-2" aria-hidden="true" />
              <Card.Title className="mb-0 fs-6 text-muted">Tenants</Card.Title>
            </div>
            <div className="fs-3 fw-bold mb-2">{tenantStats.total}</div>
            <div className="d-flex flex-wrap gap-1">
              <Badge bg="success" aria-label={`Activos: ${tenantStats.active}`}>
                activos {tenantStats.active}
              </Badge>
              <Badge bg="warning" text="dark" aria-label={`Suspendidos: ${tenantStats.suspended}`}>
                suspendidos {tenantStats.suspended}
              </Badge>
              <Badge bg="secondary" aria-label={`Cerrados: ${tenantStats.closed}`}>
                cerrados {tenantStats.closed}
              </Badge>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Card 2: Users */}
      <Col xs={12} md={3}>
        <Card className="h-100 shadow-sm">
          <Card.Body>
            <div className="d-flex align-items-center mb-2">
              <BsPeopleFill size={24} className="text-info me-2" aria-hidden="true" />
              <Card.Title className="mb-0 fs-6 text-muted">Usuarios</Card.Title>
            </div>
            <div className="fs-3 fw-bold mb-2">{userStats.total}</div>
            <div className="d-flex flex-wrap gap-1">
              <Badge bg="primary" aria-label={`Administradores: ${userStats.admin}`}>
                admin {userStats.admin}
              </Badge>
              <Badge bg="info" text="dark" aria-label={`Técnicos: ${userStats.technician}`}>
                técnico {userStats.technician}
              </Badge>
              <Badge bg="light" text="dark" aria-label={`Usuarios: ${userStats.user}`}>
                usuario {userStats.user}
              </Badge>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Card 3: Equipos */}
      <Col xs={12} md={3}>
        <Card className="h-100 shadow-sm">
          <Card.Body>
            <div className="d-flex align-items-center mb-2">
              <BsGear size={24} className="text-success me-2" aria-hidden="true" />
              <Card.Title className="mb-0 fs-6 text-muted">Equipos</Card.Title>
            </div>
            <div className="fs-3 fw-bold">{equipoTotal}</div>
            <small className="text-muted">total registrados</small>
          </Card.Body>
        </Card>
      </Col>

      {/* Card 4: OTs abiertas */}
      <Col xs={12} md={3}>
        <Card className="h-100 shadow-sm border-danger border-2">
          <Card.Body>
            <div className="d-flex align-items-center mb-2">
              <BsClipboardCheck size={24} className="text-danger me-2" aria-hidden="true" />
              <Card.Title className="mb-0 fs-6 text-muted">OTs Abiertas</Card.Title>
            </div>
            <div className="fs-2 fw-bold text-danger">{otStats.open}</div>
            <small className="text-muted">cross-tenant</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default KpiCards;
