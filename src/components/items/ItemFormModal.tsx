import React from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useCreateItem } from '@/hooks/useItems';
import useProtocols from '@/hooks/useProtocols';
import Swal from 'sweetalert2';

interface ItemFormModalProps {
  show?: boolean;
  onHide?: () => void;
  onSuccess?: () => void;
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({ show, onHide, onSuccess }) => {
  const { data: protocolsData } = useProtocols({ page: 1, limit: 200 });
  const create = useCreateItem();

  const { register, handleSubmit, reset, formState } = useForm<any>({ 
    defaultValues: { 
      Nombre: '', 
      Observacion: '', 
      ProtocoloId: '',
      Iva: '',
      IvaIncluido: false,
      Precio: ''
    } 
  });

  console.log('register', register);
  const onSubmit = async (values: any) => {
    try {  
      await create.mutateAsync(values);
      await Swal.fire({
        icon: 'success',
        title: 'Item creado',
        text: 'El item se ha creado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      reset();
      onHide?.();
      onSuccess?.();
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo crear el item',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // Si no se pasan show/onHide, renderizar sin Modal (modo legacy)
  if (!show && !onHide) {
    return (
      <>
        {create.isError && (
          <Alert variant="danger" className="mb-3">
            Error al crear el item
          </Alert>
        )}

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control 
              {...register('Nombre', { required: true })} 
              placeholder="Nombre del item"
              disabled={formState.isSubmitting}
            />
          </Form.Group>

            <Form.Group className="mb-3">
            <Form.Label>IVA</Form.Label>
            <Form.Control 
              type="number"
              step="1"
              {...register('Iva')} 
              placeholder="IVA del item"
              disabled={formState.isSubmitting}
            />
          </Form.Group>

            <Form.Group className="mb-3">
            <Form.Label>IVA Incluido</Form.Label>
            <Form.Check 
              type="checkbox"
              {...register('IvaIncluido')} 
              disabled={formState.isSubmitting}
            />
          </Form.Group>
            <Form.Group className="mb-3">
            <Form.Label>Precio</Form.Label>
            <Form.Control 
              type="number"
              step="1000"
              {...register('Precio')} 
              placeholder="Precio del item"
              disabled={formState.isSubmitting}
            />
          </Form.Group> 

          <Form.Group className="mb-3">
            <Form.Label>Observación</Form.Label>
            <Form.Control 
              as="textarea"
              rows={3}
              {...register('Observacion')} 
              placeholder="Observaciones adicionales"
              disabled={formState.isSubmitting}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Protocolo</Form.Label>
            <Form.Select 
              {...register('ProtocoloId')}
              disabled={formState.isSubmitting}
            >
              <option value="">-- Selecciona protocolo --</option>
              {protocolsData?.data?.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.nombre || p.ProtocoloId || 'Sin nombre'}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="d-flex gap-2 justify-content-end">
            <Button 
              type="submit" 
              variant="primary"
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Creando...
                </>
              ) : (
                'Crear Item'
              )}
            </Button>
          </div>
        </Form>
      </>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Crear Nuevo Item</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          {create.isError && (
            <Alert variant="danger" className="mb-3">
              Error al crear el item
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control 
              {...register('Nombre', { required: true })} 
              placeholder="Nombre del item"
              disabled={formState.isSubmitting}
            />
          </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observación</Form.Label>
              <Form.Control 
                as="textarea"
                rows={3}
                {...register('Observacion')} 
                placeholder="Observaciones adicionales"
                disabled={formState.isSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>IVA</Form.Label>
              <Form.Control 
                type="number"
                step="0.01"
                {...register('Iva')} 
                placeholder="IVA del item"
                disabled={formState.isSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>IVA Incluido</Form.Label>
              <Form.Check 
                type="checkbox"
                {...register('IvaIncluido')} 
                disabled={formState.isSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Precio</Form.Label>
              <Form.Control 
                type="number"
                step="0.01"
                {...register('Precio')} 
                placeholder="Precio del item"
                disabled={formState.isSubmitting}
              />
            </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Protocolo</Form.Label>
            <Form.Select 
              {...register('ProtocoloId')}
              disabled={formState.isSubmitting}
            >
              <option value="">-- Selecciona protocolo --</option>
              {protocolsData?.data?.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.nombre || p.ProtocoloId || 'Sin nombre'}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Creando...
              </>
            ) : (
              'Crear Item'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ItemFormModal;
