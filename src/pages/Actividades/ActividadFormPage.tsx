import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Container, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useCreateActividad, useActividad, useUpdateActividad } from '@/hooks/useActividades';
import { CreateActividadDto, UpdateActividadDto } from '@/types/actividad.types';
import { useNavigate, useParams } from 'react-router-dom';

const ActividadFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { register, handleSubmit, formState, reset } = useForm<CreateActividadDto | UpdateActividadDto>({ defaultValues: { Nombre: '', Descripcion: '', EsObligatoria: false } });
  const create = useCreateActividad();
  const update = useUpdateActividad();
  const navigate = useNavigate();

  const { data: actividadResp, isLoading: isLoadingActividad } = useActividad(id);

  const onSubmit = async (values: CreateActividadDto | UpdateActividadDto) => {
    try {
      if (id) {
        await update.mutateAsync({ id, payload: values as UpdateActividadDto });
      } else {
        await create.mutateAsync(values as CreateActividadDto);
      }
      navigate('/actividades');
    } catch (err) {
      // TODO: show toast
    }
  };

  useEffect(() => {
    if (actividadResp?.data) {
      // actividadResp follows ApiResponse<ActividadMtto>
      const actividad = actividadResp.data as any;
      reset({
        Nombre: actividad.Nombre || '',
        Descripcion: actividad.Descripcion || '',
        EsObligatoria: !!actividad.EsObligatoria,
      });
    }
  }, [actividadResp, reset]);

  // Solo mostrar spinner cuando estamos en modo edición Y cargando datos
  if (id && isLoadingActividad) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>;

  const title = id ? 'Editar Actividad' : 'Crear Actividad';
  const submitting = formState.isSubmitting || create.isLoading || update.isLoading;

  return (
    <Container>
      <h1>{title}</h1>
      <p className="text-muted">{id ? 'Editar actividad existente' : 'Crear una nueva actividad de mantenimiento'}</p>

      {(create.isError || update.isError) && <Alert variant="danger">Error al guardar la actividad.</Alert>}

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
              <Button type="submit" variant="primary" disabled={submitting}>{id ? 'Guardar cambios' : 'Crear'}</Button>
              <Button variant="secondary" className="ms-2" onClick={() => navigate(-1)}>Cancelar</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ActividadFormPage;
