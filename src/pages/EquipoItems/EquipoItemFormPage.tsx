import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import EquipoItemForm from '@/components/forms/EquipoItemForm/EquipoItemForm';
import EquipoDuplicateModal from '@/components/equipos/EquipoDuplicateModal';
import { useEquipoItem, useCreateEquipoItem, useUpdateEquipoItem } from '@/hooks/useEquipoItems';
import { EquipoItem } from '@/types/equipoItem.types';
import { handleEquipoDuplicateError } from '@/utils/handleEquipoDuplicateError';

export const EquipoItemFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data } = useEquipoItem(id || '');
  const createMutation = useCreateEquipoItem();
  const updateMutation = useUpdateEquipoItem();

  const [duplicateExisting, setDuplicateExisting] = useState<EquipoItem | null>(null);

  const handleSubmit = async (dataForm: any) => {
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data: dataForm });
      } else {
        await createMutation.mutateAsync(dataForm);
      }
      navigate('/equipo-items');
    } catch (error) {
      const duplicateResult = handleEquipoDuplicateError(error);
      if (duplicateResult.isDuplicate) {
        setDuplicateExisting(duplicateResult.existing);
        return;
      }
      throw error;
    }
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

      {duplicateExisting && (
        <EquipoDuplicateModal
          show={!!duplicateExisting}
          onHide={() => setDuplicateExisting(null)}
          existing={duplicateExisting}
          onUseExisting={(existing) => navigate(`/hv-equipo/${existing._id}`)}
        />
      )}
    </Container>
  );
};

export default EquipoItemFormPage;
