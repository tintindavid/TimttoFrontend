import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { useActividades, useDeleteActividad } from '@/hooks/useActividades';
import DataTable from '@/components/common/DataTable';
import { useNavigate } from 'react-router-dom';

const ActividadesPage: React.FC = () => {
  const [page] = useState(1);
  const { data, isLoading, error } = useActividades({ page, limit: 20 });
  const deleteMutation = useDeleteActividad();
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirmar eliminar actividad?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { key: 'Nombre', label: 'Nombre' },
    { key: 'Descripcion', label: 'Descripción' },
    { key: 'EsObligatoria', label: 'Obligatoria' },
  ];

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col><h1>Actividades</h1><p className="text-muted">Lista de actividades de mantenimiento</p></Col>
        <Col className="text-end"><Button variant="primary" onClick={() => navigate('/actividades/new')}>Crear Actividad</Button></Col>
      </Row>

      {isLoading && <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>}
      {Boolean(error) && <Alert variant="danger">Error cargando actividades.</Alert>}

      {data && (
        <Card className="tt-card">
          <Card.Body>
            <DataTable data={data.data} columns={columns} actions={(row: any) => (
              <>
                <Button size="sm" variant="link" onClick={() => navigate(`/actividades/${row._id}`)}>Ver</Button>
                <Button size="sm" variant="link" onClick={() => navigate(`/actividades/${row._id}/edit`)}>Editar</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>Eliminar</Button>
              </>
            )} />
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ActividadesPage;
