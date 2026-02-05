import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Container, Spinner, Alert, Button } from 'react-bootstrap';
import { useItem, useDeleteItem } from '@/hooks/useItems';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useItem(id);
  const del = useDeleteItem();

  if (isLoading) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">Error cargando item.</Alert>;

  const item = data?.data;
  if (!item) return <Alert variant="warning">Item no encontrado.</Alert>;

  const handleDelete = async () => {
    if (!item._id) return;
    await del.mutateAsync(item._id);
    navigate('/items');
  };

  return (
    <Container>
      <h1>Item</h1>
      <Card className="tt-card">
        <Card.Body>
          <h4>{item.Nombre}</h4>
          <p className="text-muted">Protocolo: {item.ProtocoloId || '—'}</p>
          <p>{item.Observacion}</p>
          <div className="mt-3">
            <Button variant="secondary" className="me-2" onClick={() => navigate(`/items/${item._id}/edit`)}>Editar</Button>
            <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ItemDetailPage;
