import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { useUser, useCreateUser, useUpdateUser } from '@/hooks/useUsers';

const UserFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data } = useUser(id || '');
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

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
    navigate('/users');
  };

  return (
    <Container>
      <h1>{isEdit ? 'Editar Usuario' : 'Crear Usuario'}</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>First Name</label>
          <input name="firstName" defaultValue={data?.data?.firstName || ''} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Last Name</label>
          <input name="lastName" defaultValue={data?.data?.lastName || ''} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Email</label>
          <input name="email" defaultValue={data?.data?.email || ''} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Contraseña</label>
          <input name="password" defaultValue={data?.data?.email || ''} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Role</label>
          <select name="role" defaultValue={data?.data?.role || 'user'} className="form-select">
            <option value="admin">admin</option>
            <option value="technician">technician</option>
            <option value="user">user</option>
          </select>
        </div>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary">{isEdit ? 'Actualizar' : 'Crear'}</Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </Container>
  );
};

export default UserFormPage;
