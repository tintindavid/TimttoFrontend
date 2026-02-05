import React, { useState } from 'react';
import { Container, Row, Col, Button, Spinner, Card, Alert } from 'react-bootstrap';
import { useEquipoItems, useDeleteEquipoItem } from '@/hooks/useEquipoItems';
import DataTable from '@/components/common/DataTable';
import { useNavigate } from 'react-router-dom';

export const EquipoItemsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useEquipoItems({ page, limit: 10 });
  const deleteMutation = useDeleteEquipoItem();
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirma eliminar este registro?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { key: 'Equipment', label: 'Equipo' },
    { key: 'Marca', label: 'Marca' },
    { key: 'Serie', label: 'Serie' },
    { key: 'Status', label: 'Estado' },
  ];

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Equipo Items</h1>
          <p className="text-muted">Listado de equipos por tenant</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/equipo-items/new')}>Crear Equipo</Button>
        </Col>
      </Row>

      {isLoading && (
        <div className="d-flex justify-content-center my-4"><Spinner animation="border" variant="primary" /></div>
      )}

      {Boolean(error) && <Alert variant="danger">Error al cargar los equipos.</Alert>}

      {data && (
        <Card className="tt-card">
          <Card.Body>
            <DataTable
              data={data.data}
              columns={columns}
              actions={(row: any) => (
                <>
                  <Button size="sm" variant="link" onClick={() => navigate(`/equipo-items/${row._id}`)}>Ver</Button>
                  <Button size="sm" variant="link" onClick={() => navigate(`/equipo-items/${row._id}/edit`)}>Editar</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>Eliminar</Button>
                </>
              )}
            />

            {data.pagination && (
              <div className="mt-3 text-muted">Página {data.pagination.page} de {data.pagination.pages}</div>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default EquipoItemsPage;
