import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, ListGroup, Modal, Spinner } from 'react-bootstrap';
import { useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useConfirmarEntrega } from '@/hooks/useRequisiciones';
import {
  CONFIRMACION_RESULTADO_LABELS,
  type ConfirmacionResultado,
  type Recepcion,
  type RecepcionItem,
  type Requisicion,
} from '@/types/requisicion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import ReqHelp from '../help/ReqHelp';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicion: Requisicion;
  recepcion: Recepcion;
  /** Items of the reception that the user is allowed to confirm. */
  items: RecepcionItem[];
}

interface ItemValues {
  lineaId: string;
  descripcion: string;
  registrada: number;
  resultado: ConfirmacionResultado;
  cantidad?: number;
  observacion?: string;
}

interface FormValues {
  items: ItemValues[];
}

const RESULTADOS: ConfirmacionResultado[] = ['Recibido', 'No_Llego', 'Incompleto'];

const itemSchema = yup.object({
  lineaId: yup.string().required(),
  descripcion: yup.string(),
  registrada: yup.number().required(),
  resultado: yup.string().oneOf(RESULTADOS).required(),
  // Only "Llegó incompleto" asks how much arrived: it must be less than what was registered.
  cantidad: yup
    .number()
    .transform((value, original) => (original === '' || Number.isNaN(value) ? undefined : value))
    .when('resultado', {
      is: 'Incompleto',
      then: (s) =>
        s
          .required('Indica cuánto llegó')
          .min(0, 'La cantidad no puede ser negativa')
          .test('menor', 'Debe ser menor que la cantidad registrada', function (value) {
            return value === undefined || value < (this.parent as ItemValues).registrada;
          }),
      otherwise: (s) => s.notRequired(),
    }),
  // No llegó / Llegó incompleto: the reason is mandatory.
  observacion: yup
    .string()
    .trim()
    .max(1000, 'Máximo 1000 caracteres')
    .when('resultado', {
      is: (r: string) => r !== 'Recibido',
      then: (s) => s.required('La observación es obligatoria'),
    }),
});

const schema = yup.object({ items: yup.array().of(itemSchema).min(1).required() });

/** The requester confirms, per item of a reception: Recibí / No llegó / Llegó incompleto. */
const ConfirmarEntregaModal: React.FC<Props> = ({ show, onHide, requisicion, recepcion, items }) => {
  const mutation = useConfirmarEntrega();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaults = useMemo<FormValues>(
    () => ({
      items: items.map((item) => ({
        lineaId: item.lineaId,
        descripcion: requisicion.lineas.find((l) => l._id === item.lineaId)?.descripcion ?? 'Línea',
        registrada: item.cantidadRecibida,
        resultado: 'Recibido',
        cantidad: item.cantidadRecibida,
        observacion: '',
      })),
    }),
    [items, requisicion.lineas]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: yupResolver(schema) as never, defaultValues: defaults });
  const { fields } = useFieldArray({ control, name: 'items' });
  const watched = watch('items');

  useEffect(() => {
    if (show) {
      reset(defaults);
      setServerError(null);
    }
  }, [show, defaults, reset]);

  const onValid = async (values: FormValues) => {
    setServerError(null);
    try {
      await mutation.mutateAsync({
        id: requisicion._id,
        recepcionId: recepcion._id,
        data: {
          items: values.items.map((i) => ({
            lineaId: i.lineaId,
            resultado: i.resultado,
            cantidad: i.resultado === 'Recibido' ? i.registrada : i.resultado === 'No_Llego' ? 0 : Number(i.cantidad),
            ...(i.observacion?.trim() ? { observacion: i.observacion.trim() } : {}),
          })),
        },
      });
      toast.success('Entrega confirmada.');
      onHide();
    } catch (err) {
      setServerError(getRequisicionErrorMessage(err, 'No fue posible confirmar la entrega.'));
    }
  };

  const submitting = mutation.isLoading;

  return (
    <Modal show={show} onHide={submitting ? undefined : onHide} centered size="lg" scrollable aria-labelledby="conf-entrega-title">
      <Form noValidate onSubmit={handleSubmit(onValid)}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title id="conf-entrega-title">
            Confirmar entrega
            <ReqHelp id="accion.confirmarEntrega" placement="bottom" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {serverError && (
            <Alert variant="danger" role="alert">
              {serverError}
            </Alert>
          )}
          <p className="text-muted">
            Indica si recibiste lo registrado. Solo al confirmar «Recibí» el repuesto queda disponible.
            <ReqHelp id="recepcion.resultado" />
          </p>
          <ListGroup variant="flush">
            {fields.map((field, index) => {
              const resultado = watched?.[index]?.resultado ?? 'Recibido';
              const itemErrors = errors.items?.[index];
              return (
                <ListGroup.Item key={field.id} data-testid="confirm-item">
                  <div className="fw-semibold">{field.descripcion}</div>
                  <div className="small text-muted mb-2">Registrado: {field.registrada}</div>
                  <div role="radiogroup" aria-label={`Resultado de ${field.descripcion}`} className="mb-2">
                    {RESULTADOS.map((value) => (
                      <Form.Check
                        inline
                        type="radio"
                        key={value}
                        id={`ce-${index}-${value}`}
                        value={value}
                        label={CONFIRMACION_RESULTADO_LABELS[value]}
                        {...register(`items.${index}.resultado`)}
                      />
                    ))}
                  </div>
                  {resultado === 'Incompleto' && (
                    <Form.Group controlId={`ce-cant-${index}`} className="mb-2">
                      <Form.Label>Cantidad que llegó *</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        min={0}
                        {...register(`items.${index}.cantidad`, { valueAsNumber: true })}
                        isInvalid={!!itemErrors?.cantidad}
                      />
                      <Form.Control.Feedback type="invalid">{itemErrors?.cantidad?.message}</Form.Control.Feedback>
                    </Form.Group>
                  )}
                  <Form.Group controlId={`ce-obs-${index}`}>
                    <Form.Label>Observación{resultado !== 'Recibido' ? ' *' : ''}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      maxLength={1000}
                      {...register(`items.${index}.observacion`)}
                      isInvalid={!!itemErrors?.observacion}
                    />
                    <Form.Control.Feedback type="invalid">{itemErrors?.observacion?.message}</Form.Control.Feedback>
                  </Form.Group>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Confirmar entrega
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ConfirmarEntregaModal;
