import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Form } from 'react-bootstrap';
import { createEquipoItemSchema, updateEquipoItemSchema } from '@/schemas/equipoItem.schema';
import { CreateEquipoItemDto, EquipoItem, UpdateEquipoItemDto } from '@/types/equipoItem.types';

interface Props {
  initialData?: EquipoItem;
  mode?: 'create' | 'edit';
  onSubmit: (data: CreateEquipoItemDto | UpdateEquipoItemDto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const EquipoItemForm: React.FC<Props> = ({ initialData, mode = 'create', onSubmit, onCancel, isLoading = false }) => {
  const isEdit = mode === 'edit';

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: yupResolver(isEdit ? updateEquipoItemSchema : createEquipoItemSchema),
    defaultValues: initialData || {},
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const submit = async (data: any) => {
    await onSubmit(data);
  };

  return (
    <Form onSubmit={handleSubmit(submit)}>
      <Form.Group className="mb-3">
        <Form.Label>Equipo</Form.Label>
        <Form.Control {...register('Equipment')} placeholder="Nombre del equipo" />
        {errors.Equipment?.message && (
            <div className="text-danger">
                {String(errors.Equipment.message)}
            </div>
            )}

      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>ClienteId</Form.Label>
        <Form.Control {...register('ClienteId')} placeholder="ID del cliente" />
        {errors.Equipment?.message && (
            <div className="text-danger">
                {String(errors.Equipment.message)}
            </div>
            )}

      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>ClienteId</Form.Label>
        <Form.Control {...register('ClienteId')} placeholder="ID del cliente" />
        {errors.ClienteId?.message && (
            <div className="text-danger">
                {String(errors.ClienteId.message)}
            </div>
            )}

      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Marca</Form.Label>
        <Form.Control {...register('Marca')} placeholder="Marca" />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Serie</Form.Label>
        <Form.Control {...register('Serie')} placeholder="Serie" />
      </Form.Group>

      <div className="d-flex gap-2">
        <Button type="submit" disabled={isSubmitting || isLoading} variant="primary">
          {isEdit ? 'Actualizar' : 'Crear'}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting || isLoading}>
            Cancelar
          </Button>
        )}
      </div>
    </Form>
  );
};

export default EquipoItemForm;
