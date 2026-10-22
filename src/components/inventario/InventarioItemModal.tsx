import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useCreateInventarioRepuesto, useUpdateInventarioRepuesto } from '@/hooks/useInventarioRepuestos';
import {
  INVENTARIO_TIPO_LABELS,
  type CreateInventarioRepuestoDto,
  type InventarioRepuesto,
  type InventarioTipo,
} from '@/types/inventarioRepuesto.types';
import { getApiErrorMessage } from './getApiErrorMessage';

interface InventarioItemModalProps {
  show: boolean;
  onHide: () => void;
  /** Item being edited; when absent the modal creates a new one. */
  item?: InventarioRepuesto | null;
  /** usesInventoryAdvanced: shows the full sheet (reference, description, unit, price, minimum stock). */
  advanced: boolean;
  /** Prefills the name when creating (e.g. text typed in the request select). */
  initialNombre?: string;
  /** Called with the saved item after a successful create/update. */
  onSaved?: (item: InventarioRepuesto) => void;
}

interface FormValues {
  nombre: string;
  tipo: InventarioTipo;
  referencia?: string;
  descripcion?: string;
  unidad?: string;
  precio?: number;
  stockMinimo?: number;
}

const toOptionalNumber = (value: number, original: unknown) =>
  original === '' || Number.isNaN(value) ? undefined : value;

const schema = yup.object({
  nombre: yup.string().trim().required('El nombre es obligatorio'),
  tipo: yup.string().oneOf(['repuesto', 'accesorio']).required('El tipo es obligatorio'),
  referencia: yup.string().optional(),
  descripcion: yup.string().optional(),
  unidad: yup.string().optional(),
  precio: yup.number().transform(toOptionalNumber).min(0, 'El precio no puede ser negativo').optional(),
  stockMinimo: yup.number().transform(toOptionalNumber).min(0, 'El stock mínimo no puede ser negativo').optional(),
});

const EMPTY: FormValues = {
  nombre: '',
  tipo: 'repuesto',
  referencia: '',
  descripcion: '',
  unidad: 'unidades',
  precio: 0,
  stockMinimo: 0,
};

const InventarioItemModal: React.FC<InventarioItemModalProps> = ({
  show,
  onHide,
  item,
  advanced,
  initialNombre,
  onSaved,
}) => {
  const createMutation = useCreateInventarioRepuesto();
  const updateMutation = useUpdateInventarioRepuesto();
  const [serverError, setServerError] = useState<string | null>(null);
  const editing = !!item?._id;
  const saving = createMutation.isLoading || updateMutation.isLoading;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    // reason: yup's inferred optional-number type is wider than FormValues
    resolver: yupResolver(schema) as never,
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!show) return;
    setServerError(null);
    reset(
      item
        ? {
            nombre: item.nombre || '',
            tipo: item.tipo || 'repuesto',
            referencia: item.referencia || '',
            descripcion: item.descripcion || '',
            unidad: item.unidad || 'unidades',
            precio: item.precio ?? 0,
            stockMinimo: item.stockMinimo ?? 0,
          }
        : { ...EMPTY, nombre: initialNombre || '' }
    );
  }, [show, item, initialNombre, reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    // Basic level only sends nombre + tipo: the backend rejects advanced fields (403) without the capability.
    const payload: CreateInventarioRepuestoDto = { nombre: values.nombre.trim(), tipo: values.tipo };
    if (advanced) {
      payload.referencia = values.referencia?.trim() || undefined;
      payload.descripcion = values.descripcion?.trim() || undefined;
      payload.unidad = values.unidad || undefined;
      payload.precio = values.precio ?? 0;
      payload.stockMinimo = values.stockMinimo ?? 0;
    }
    try {
      const response = editing
        ? await updateMutation.mutateAsync({ id: item!._id as string, data: payload })
        : await createMutation.mutateAsync(payload);
      toast.success(editing ? 'Ítem actualizado' : 'Ítem creado');
      onSaved?.(response.data);
      onHide();
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Error guardando el ítem'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form
        onSubmit={(e) => {
          // The modal can be rendered inside another form (the part request): never submit that one.
          e.stopPropagation();
          return handleSubmit(onSubmit)(e);
        }}
        noValidate
      >
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Editar ítem' : 'Crear nuevo repuesto'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {serverError && <Alert variant="danger">{serverError}</Alert>}
          <Form.Group className="mb-2" controlId="inv-item-nombre">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control {...register('nombre')} isInvalid={!!errors.nombre} />
            <Form.Control.Feedback type="invalid">{errors.nombre?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-2" controlId="inv-item-tipo">
            <Form.Label>Tipo *</Form.Label>
            <Form.Select {...register('tipo')} isInvalid={!!errors.tipo}>
              {(Object.keys(INVENTARIO_TIPO_LABELS) as InventarioTipo[]).map((t) => (
                <option key={t} value={t}>
                  {INVENTARIO_TIPO_LABELS[t]}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.tipo?.message}</Form.Control.Feedback>
          </Form.Group>

          {advanced && (
            <>
              <Form.Group className="mb-2" controlId="inv-item-referencia">
                <Form.Label>Referencia</Form.Label>
                <Form.Control {...register('referencia')} />
              </Form.Group>
              <Form.Group className="mb-2" controlId="inv-item-descripcion">
                <Form.Label>Descripción</Form.Label>
                <Form.Control as="textarea" rows={2} {...register('descripcion')} />
              </Form.Group>
              <Row>
                <Col>
                  <Form.Group className="mb-2" controlId="inv-item-stockMinimo">
                    <Form.Label>Stock mínimo</Form.Label>
                    <Form.Control type="number" min={0} {...register('stockMinimo')} isInvalid={!!errors.stockMinimo} />
                    <Form.Control.Feedback type="invalid">{errors.stockMinimo?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-2" controlId="inv-item-unidad">
                    <Form.Label>Unidad</Form.Label>
                    <Form.Select {...register('unidad')}>
                      <option value="unidades">unidades</option>
                      <option value="metros">metros</option>
                      <option value="pares">pares</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-2" controlId="inv-item-precio">
                <Form.Label>Precio</Form.Label>
                <Form.Control type="number" min={0} step="any" {...register('precio')} isInvalid={!!errors.precio} />
                <Form.Control.Feedback type="invalid">{errors.precio?.message}</Form.Control.Feedback>
              </Form.Group>
              {!editing && (
                <Form.Text muted>El stock inicial se registra después con un movimiento de entrada.</Form.Text>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default InventarioItemModal;
