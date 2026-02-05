import React from 'react';
import { useForm } from 'react-hook-form';
import { Container, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useCreateActividad } from '@/hooks/useActividades';
import { CreateActividadDto } from '@/types/actividad.types';
import { useNavigate } from 'react-router-dom';

const ActividadFormPage: React.FC = () => {
  const { register, handleSubmit, formState } = useForm<CreateActividadDto>({ defaultValues: { Nombre: '', Descripcion: '', EsObligatoria: false } });
  const create = useCreateActividad();
  const navigate = useNavigate();

  const onSubmit = async (values: CreateActividadDto) => {
    try {
        console.log('Creating actividad with values:', values);
      await create.mutateAsync(values);
      navigate('/actividades');
    } catch (err) {
      // TODO: show toast
    }
  };

  if (create.isLoading) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>;

  return (
    <Container>
      <h1>Crear Actividad</h1>
      <p className="text-muted">Crear una nueva actividad de mantenimiento</p>

      {create.isError && <Alert variant="danger">Error creando la actividad.</Alert>}

      <Card className="tt-card">
        <Card.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3" controlId="Nombre">
              <Form.Label>Nombre</Form.Label>
              <Form.Control {...register('Nombre', { required: true })} placeholder="Nombre de la actividad" />
            </Form.Group>

            <Form.Group className="mb-3" controlId="Descripcion">
              <Form.Label>Descripción</Form.Label>
              <Form.Control as="textarea" rows={3} {...register('Descripcion')} placeholder="Descripción" />
            </Form.Group>

            <Form.Group className="mb-3" controlId="EsObligatoria">
              <Form.Check type="checkbox" label="Es obligatoria" {...register('EsObligatoria')} />
            </Form.Group>

            <div className="d-flex">
              <Button type="submit" variant="primary" disabled={formState.isSubmitting}>Crear</Button>
              <Button variant="secondary" className="ms-2" onClick={() => navigate(-1)}>Cancelar</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ActividadFormPage;
