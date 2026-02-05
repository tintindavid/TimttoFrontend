import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEquipoItem } from '@/hooks/useEquipoItems';
import { Container, Button, Card, Spinner, Alert } from 'react-bootstrap';

export const EquipoItemDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEquipoItem(id || '');

  if (isLoading) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">Error al cargar</Alert>;
  if (!data?.data) return <Alert variant="info">No encontrado</Alert>;

  const item = data.data;

  return (
    <Container>
      <Card className="tt-card">
        <Card.Body>
          <Card.Title>Detalle Equipo</Card.Title>
          <Card.Text>
            <div><strong>Equipo:</strong> {item.Equipment}</div>
            <div><strong>Marca:</strong> {item.Marca}</div>
            <div><strong>Serie:</strong> {item.Serie}</div>
            <div><strong>Status:</strong> {item.Status}</div>
          </Card.Text>

          <div className="mt-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
            <Button variant="primary" className="ms-2" onClick={() => navigate(`/equipo-items/${item._id}/edit`)}>Editar</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EquipoItemDetailPage;
