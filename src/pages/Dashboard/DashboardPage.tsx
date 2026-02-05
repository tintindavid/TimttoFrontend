import React from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import useDashboardCounts from '@/hooks/useDashboard';

const StatCard: React.FC<{ title: string; value: number | string; variant?: string }> = ({ title, value, variant }) => (
  <Card className="tt-card mb-3">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <Card.Title className="mb-1">{title}</Card.Title>
          <Card.Text className="text-muted small">Resumen</Card.Text>
        </div>
        <div className="text-end">
          <h3 className="mb-0">{value}</h3>
        </div>
      </div>
    </Card.Body>
  </Card>
);

const DashboardPage: React.FC = () => {
  const { equipos, ots, users, isLoading, isError } = useDashboardCounts();

  if (isLoading) return (
    <Container fluid>
      <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
        <Spinner animation="border" variant="primary" />
      </div>
    </Container>
  );

  if (isError) return (
    <Container fluid>
      <Alert variant="danger">Error cargando datos del dashboard.</Alert>
    </Container>
  );

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h4 className="mb-0">Dashboard</h4>
          <p className="text-muted">Resumen rápido de la plataforma</p>
        </Col>
        <Col xs="auto" className="align-self-center">
          <Button variant="outline-primary" size="sm">Actualizar</Button>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <StatCard title="Equipos" value={equipos.data ?? 0} />
        </Col>
        <Col md={4}>
          <StatCard title="Órdenes de Trabajo" value={ots.data ?? 0} />
        </Col>
        <Col md={4}>
          <StatCard title="Usuarios" value={users.data ?? 0} />
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card className="tt-card">
            <Card.Body>
              <Card.Title>Actividad reciente</Card.Title>
              <Card.Text className="text-muted">Aquí se mostrarán las actividades y alertas recientes (placeholder).</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;
