import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUsers';
import { Container, Button, Card, Spinner, Alert } from 'react-bootstrap';

const UserDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useUser(id || '');

  if (isLoading) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">Error al cargar</Alert>;
  if (!data?.data) return <Alert variant="info">No encontrado</Alert>;

  const user = data.data;

  return (
    <Container>
      <Card className="tt-card">
        <Card.Body>
          <Card.Title>Detalle Usuario</Card.Title>
          <Card.Text>
            <div><strong>Nombre:</strong> {user.fullName || `${user.firstName} ${user.lastName}`}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Rol:</strong> {user.role}</div>
          </Card.Text>

          <div className="mt-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
            <Button variant="primary" className="ms-2" onClick={() => navigate(`/users/${user._id}/edit`)}>Editar</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UserDetailPage;
