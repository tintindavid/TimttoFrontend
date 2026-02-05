import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import EquipoItemForm from '@/components/forms/EquipoItemForm/EquipoItemForm';
import { useEquipoItem, useCreateEquipoItem, useUpdateEquipoItem } from '@/hooks/useEquipoItems';

export const EquipoItemFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data } = useEquipoItem(id || '');
  const createMutation = useCreateEquipoItem();
  const updateMutation = useUpdateEquipoItem();

  const handleSubmit = async (dataForm: any) => {
    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, data: dataForm });
    } else {
      await createMutation.mutateAsync(dataForm);
    }
    navigate('/equipo-items');
  };

  if (isEdit && !data && !createMutation.isLoading && !updateMutation.isLoading) {
    return <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>;
  }

  return (
    <Container>
      <Card className="tt-card">
        <Card.Body>
          <Card.Title>{isEdit ? 'Editar Equipo' : 'Crear Equipo'}</Card.Title>

          <EquipoItemForm
            initialData={data?.data}
            mode={isEdit ? 'edit' : 'create'}
            onSubmit={handleSubmit}
            onCancel={() => navigate(-1)}
            isLoading={createMutation.isLoading || updateMutation.isLoading}
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EquipoItemFormPage;
