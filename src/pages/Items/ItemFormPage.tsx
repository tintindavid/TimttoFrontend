import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Container, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import Select from 'react-select';
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

  const { register, handleSubmit, reset, setValue, watch } = useForm<any>({ defaultValues: { Nombre: '', Observacion: '', ProtocoloId: '' } });

  // Opciones ordenadas para protocolos
  const protocolOptions = useMemo(() => {
    const protocols = protocolsData?.data || [];
    return [...protocols]
      .sort((a, b) => {
        const nameA = (a.nombre || '').toUpperCase();
        const nameB = (b.nombre || '').toUpperCase();
        return nameA.localeCompare(nameB);
      })
      .map(p => ({
        value: p._id,
        label: p.nombre || 'Sin nombre'
      }));
  }, [protocolsData?.data]);

  const selectedProtocol = watch('ProtocoloId');

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
              <Form.Label>Precio</Form.Label>
              <Form.Control 
                type="number"
                step="1000"
                {...register('Precio')} 
                placeholder="Precio del item"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>IVA Incluido</Form.Label>
              <Form.Check 
                type="checkbox"
                {...register('IvaIncluido')} 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>IVA</Form.Label>
              <Form.Control 
                type="number"
                step="1"
                {...register('Iva')} 
                placeholder="IVA del item"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Protocolo</Form.Label>
              <Select
                options={protocolOptions}
                value={protocolOptions.find(opt => opt.value === selectedProtocol) || null}
                onChange={(selected) => setValue('ProtocoloId', selected?.value || '')}
                placeholder="-- Selecciona protocolo --"
                isSearchable
                isClearable
                noOptionsMessage={() => 'No hay protocolos disponibles'}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
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
