import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Container, Spinner, Alert, Button } from 'react-bootstrap';
import { useTenant, useDeleteTenant } from '@/hooks/useTenants';

const TenantDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useTenant(id);
  const deleteMutation = useDeleteTenant();

  if (isLoading) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">Error cargando tenant.</Alert>;

  const tenant = data?.data;

  if (!tenant) return <Alert variant="warning">Tenant no encontrado.</Alert>;

  const handleDelete = async () => {
    if (!tenant._id) return;
    await deleteMutation.mutateAsync(tenant._id);
    navigate('/tenants');
  };

  return (
    <Container>
      <h1>Tenant</h1>
      <Card className="tt-card">
        <Card.Body>
          <h4>{tenant.name}</h4>
          <p className="text-muted">{tenant.slug}</p>
          <p>Email: {tenant.email || '—'}</p>
          <p>Tel: {tenant.telefono || '—'}</p>
          <div className="mt-3">
            <Button variant="secondary" className="me-2" onClick={() => navigate(`/tenants/${tenant._id}/edit`)}>
              Editar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isLoading}>
              {deleteMutation.isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TenantDetailPage;
