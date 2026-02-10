import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { useItems, useDeleteItem } from '@/hooks/useItems';
import DataTable from '@/components/common/DataTable';
import { useNavigate } from 'react-router-dom';

const ItemsPage: React.FC = () => {
  const [page] = useState(1);
  const { data, isLoading, error } = useItems({ page, limit: 10 });
  const deleteMutation = useDeleteItem();
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirmar eliminar item?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { key: 'Nombre', label: 'Nombre' },
    { key: 'Observacion', label: 'Observación' },
    { key: 'ProtocoloId', label: 'Protocolo' },
    { key: 'Iva', label: 'IVA' },
    { key: 'IvaIncluido', label: 'IVA Incluido', render: (row: any) => row.IvaIncluido ? 'Sí' : 'No' },
    { key: 'Precio', label: 'Precio' },
  ];

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col><h1>Items</h1><p className="text-muted">Gestión de items vinculados a protocolos</p></Col>
        <Col className="text-end"><Button variant="primary" onClick={() => navigate('/items/new')}>Crear Item</Button></Col>
      </Row>

      {isLoading && <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>}
      {Boolean(error) && <Alert variant="danger">Error cargando items.</Alert>}

      {data && (
        <Card className="tt-card">
          <Card.Body>
            <DataTable data={data.data} columns={columns} actions={(row: any) => (
              <>
                <Button size="sm" variant="link" onClick={() => navigate(`/items/${row._id}`)}>Ver</Button>
                <Button size="sm" variant="link" onClick={() => navigate(`/items/${row._id}/edit`)}>Editar</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>Eliminar</Button>
              </>
            )} />
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ItemsPage;
