import React from 'react';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import useTenants from '@/hooks/useTenants';

const TenantsPage: React.FC = () => {
  const { data, isLoading, error } = useTenants({ page: 1, limit: 20 });

  if (isLoading) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">Error cargando tenants.</Alert>;

  return (
    <Container>
      <h1>Tenants</h1>
      <p className="text-muted">Administración de tenants</p>
      <Card className="tt-card">
        <Card.Body>
          <div className="text-muted">Listado de tenants (placeholder)</div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TenantsPage;
