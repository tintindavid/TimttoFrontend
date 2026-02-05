import React from 'react';
import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';
import useReports from '@/hooks/useReports';

const ReportsPage: React.FC = () => {
  const { data, isLoading, error } = useReports({ page: 1, limit: 10 });

  if (isLoading) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">Error cargando reportes.</Alert>;

  return (
    <Container>
      <h1>Reportes</h1>
      <p className="text-muted">Generar y descargar reportes</p>
      <Card className="tt-card">
        <Card.Body>
          <div className="text-muted">Lista de reportes disponible (placeholder)</div>
          <div className="mt-3">
            <Button variant="primary">Generar Reporte</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ReportsPage;
