import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Container, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateItem, useItem, useUpdateItem } from '@/hooks/useItems';
import useProtocols from '@/hooks/useProtocols';

const ItemFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: protocolsData } = useProtocols({ page: 1, limit: 200 });
  const { data: itemData, isLoading: loadingItem } = useItem(id);
  const create = useCreateItem();
  const update = useUpdateItem();

  const { register, handleSubmit, reset } = useForm<any>({ defaultValues: { Nombre: '', Observacion: '', ProtocoloId: '' } });

  console.log('isEdit:', isEdit);
  useEffect(() => {
    if (itemData?.data) reset(itemData.data);
  }, [itemData, reset]);


  const onSubmit = async (values: any) => {
    try {  
      if (isEdit && id) await update.mutateAsync({ id, payload: values });
      else await create.mutateAsync(values);
      navigate('/items');
    } catch (err) {
      // TODO: toast
    }
  };

  if (isEdit && loadingItem) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>;

  return (
    <Container>
      <h1>{isEdit ? 'Editar Item' : 'Crear Item'}</h1>
      <Card className="tt-card">
        <Card.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control {...register('Nombre', { required: true })} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observación</Form.Label>
              <Form.Control {...register('Observacion')} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Protocolo</Form.Label>
              <Form.Select {...register('ProtocoloId')}>
                <option value="">-- Selecciona protocolo --</option>
                {protocolsData?.data?.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.nombre || p.ProtocoloId || p.nombre}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary">{isEdit ? 'Actualizar' : 'Crear'}</Button>
              <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ItemFormPage;
