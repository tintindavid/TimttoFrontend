import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, Container, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useCreateTenant, useTenant, useUpdateTenant } from '@/hooks/useTenants';
import { CreateTenantDto } from '@/types/tenant.types';

const TenantFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tenantData, isLoading: loadingTenant } = useTenant(id);
  const create = useCreateTenant();
  const update = useUpdateTenant();

  const { register, handleSubmit, reset } = useForm<CreateTenantDto>();

  React.useEffect(() => {
    if (tenantData?.data) {
      const t = tenantData.data;
      reset({ name: t.name, slug: t.slug, contactEmail: t.contactEmail, phone: t.phone });
    }
  }, [tenantData, reset]);

  const onSubmit = async (values: CreateTenantDto) => {
    try {
      if (id) {
        await update.mutateAsync({ id, payload: values });
      } else {
        await create.mutateAsync(values);
      }
      navigate('/tenants');
    } catch (err) {
      // TODO: show toast
    }
  };

  if (loadingTenant) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>;

  return (
    <Container>
      <h1>{id ? 'Editar Tenant' : 'Nuevo Tenant'}</h1>
      <Card className="tt-card">
        <Card.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Nombre</Form.Label>
              <Form.Control placeholder="Nombre" {...register('name', { required: true })} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="slug">
              <Form.Label>Slug</Form.Label>
              <Form.Control placeholder="slug" {...register('slug')} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="contactEmail">
              <Form.Label>Contacto (email)</Form.Label>
              <Form.Control type="email" placeholder="email@ejemplo.com" {...register('contactEmail')} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="phone">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control placeholder="Teléfono" {...register('phone')} />
            </Form.Group>

            <div className="d-flex">
              <Button type="submit" variant="primary" className="me-2">
                {id ? 'Guardar' : 'Crear'}
              </Button>
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TenantFormPage;
