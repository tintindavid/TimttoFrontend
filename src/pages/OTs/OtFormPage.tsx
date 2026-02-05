import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { useOT, useCreateOt, useUpdateOt } from '@/hooks/useOTs';

const OtFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data } = useOT(id || '');
  const createMutation = useCreateOt();
  const updateMutation = useUpdateOt();

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const payload: any = Object.fromEntries(formData as any);

    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate('/ots');
  };

  return (
    <Container>
      <h1>{isEdit ? 'Editar OT' : 'Crear OT'}</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>ClienteId</label>
          <input name="ClienteId" defaultValue={data?.data?.ClienteId?._id || ''} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Tipo Servicio</label>
          <input name="TipoServicio" defaultValue={data?.data?.TipoServicio || ''} className="form-control" />
        </div>
        <div className="mb-3">
          <label>ResponsableId</label>
          <input name="ResponsableId" defaultValue={data?.data?.ResponsableId || ''} className="form-control" />
        </div>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary">{isEdit ? 'Actualizar' : 'Crear'}</Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </Container>
  );
};

export default OtFormPage;
