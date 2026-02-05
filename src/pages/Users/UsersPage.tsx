import React, { useState } from 'react';
import { Container, Row, Col, Button, Spinner, Card, Alert } from 'react-bootstrap';
import { useUsers, useDeleteUser } from '@/hooks/useUsers';
import DataTable from '@/components/common/DataTable';
import { useNavigate } from 'react-router-dom';

const UsersPage: React.FC = () => {
  const [page] = useState(1);
  const { data, isLoading, error } = useUsers({ page, limit: 10 });
  const deleteMutation = useDeleteUser();
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirma eliminar este usuario?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { key: 'fullName', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rol' },
  ];

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Usuarios</h1>
          <p className="text-muted">Gestión de usuarios del tenant</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/users/new')}>Crear Usuario</Button>
        </Col>
      </Row>

      {isLoading && <div className="d-flex justify-content-center my-4"><Spinner animation="border" variant="primary" /></div>}
      {Boolean(error) && <Alert variant="danger">Error al cargar usuarios.</Alert>}

      {data && (
        <Card className="tt-card">
          <Card.Body>
            <DataTable
              data={data.data}
              columns={columns}
              actions={(row: any) => (
                <>
                  <Button size="sm" variant="link" onClick={() => navigate(`/users/${row._id}`)}>Ver</Button>
                  <Button size="sm" variant="link" onClick={() => navigate(`/users/${row._id}/edit`)}>Editar</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>Eliminar</Button>
                </>
              )}
            />
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default UsersPage;
