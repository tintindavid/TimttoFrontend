import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import DataTable from '@/components/common/DataTable';
import { useNavigate } from 'react-router-dom';

const CustomersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useCustomers({ page, limit: 10 });
  const deleteMutation = useDeleteCustomer();
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirmar eliminar cliente?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { key: 'Razonsocial', label: 'Razón Social' },
    { key: 'Nit', label: 'NIT' },
    { key: 'Email', label: 'Email' },
    { key: 'Ciudad', label: 'Ciudad' },
  ];

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col><h1>Clientes</h1><p className="text-muted">Gestionar clientes y terceros</p></Col>
        <Col className="text-end"><Button variant="primary" onClick={() => navigate('/customers/new')}>Crear Cliente</Button></Col>
      </Row>

      {isLoading && <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>}
      {Boolean(error) && <Alert variant="danger">Error cargando clientes.</Alert>}

      {data && (
        <Card className="tt-card">
          <Card.Body>
            <DataTable data={data.data} columns={columns} actions={(row: any) => (
              <>
                <Button size="sm" variant="link" onClick={() => navigate(`/customers/${row._id}`)}>Ver</Button>
                <Button size="sm" variant="link" onClick={() => navigate(`/customers/${row._id}/edit`)}>Editar</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>Eliminar</Button>
              </>
            )} />
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default CustomersPage;
