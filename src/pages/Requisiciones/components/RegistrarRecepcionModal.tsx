import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Form, ListGroup, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useRegistrarRecepcion } from '@/hooks/useRequisiciones';
import {
  EVIDENCIA_MAX_BYTES,
  EVIDENCIA_MAX_FILES,
  EVIDENCIA_TIPOS_PERMITIDOS,
  type Requisicion,
} from '@/types/requisicion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { cantidadPendienteRecepcion } from '@/utils/requisicion.utils';
import ReqHelp from '../help/ReqHelp';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicion: Requisicion;
}

interface ItemValues {
  lineaId: string;
  descripcion: string;
  pendiente: number;
  cantidadRecibida: number;
}

interface FormValues {
  fecha: string;
  documento?: string;
  observacion?: string;
  items: ItemValues[];
}

/** Today as `YYYY-MM-DD` in the user's local time. */
const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const MB = 1024 * 1024;

/** Client-side check of the evidence files (the server validates them again). Returns a Spanish message or null. */
export const validateEvidencias = (files: File[]): string | null => {
  if (files.length > EVIDENCIA_MAX_FILES) return `Puedes adjuntar hasta ${EVIDENCIA_MAX_FILES} archivos.`;
  for (const file of files) {
    if (!EVIDENCIA_TIPOS_PERMITIDOS.includes(file.type)) {
      return `«${file.name}» no es una imagen ni un PDF.`;
    }
    if (file.size > EVIDENCIA_MAX_BYTES) {
      return `«${file.name}» supera ${EVIDENCIA_MAX_BYTES / MB} MB.`;
    }
  }
  return null;
};

const itemSchema = yup.object({
  lineaId: yup.string().required(),
  descripcion: yup.string(),
  pendiente: yup.number().required(),
  cantidadRecibida: yup
    .number()
    .typeError('Ingresa una cantidad')
    .min(0, 'La cantidad no puede ser negativa')
    .test('max-pendiente', 'No puede superar lo pendiente', function (value) {
      return value === undefined || value === null || value <= (this.parent as ItemValues).pendiente;
    })
    .required('Ingresa una cantidad'),
});

const schema = yup.object({
  fecha: yup
    .string()
    .required('La fecha es obligatoria')
    .test('no-futura', 'La fecha no puede ser futura', (value) => !value || value <= today()),
  documento: yup.string().trim().max(100, 'Máximo 100 caracteres'),
  observacion: yup.string().trim().max(1000, 'Máximo 1000 caracteres'),
  items: yup
    .array()
    .of(itemSchema)
    .required()
    .test('alguna', 'Indica la cantidad recibida de al menos una línea', (items) =>
      (items ?? []).some((i) => Number(i?.cantidadRecibida) > 0)
    ),
});

const buildDefaults = (requisicion: Requisicion): FormValues => ({
  fecha: today(),
  documento: '',
  observacion: '',
  items: requisicion.lineas
    .filter((l) => !!l._id && cantidadPendienteRecepcion(l) > 0)
    .map((l) => ({
      lineaId: l._id as string,
      descripcion: l.descripcion,
      pendiente: cantidadPendienteRecepcion(l),
      cantidadRecibida: 0,
    })),
});

/** Registers a reception: quantity per line (limited to what is pending), date, document, notes and evidence files. */
const RegistrarRecepcionModal: React.FC<Props> = ({ show, onHide, requisicion }) => {
  const mutation = useRegistrarRecepcion();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const defaults = useMemo(() => buildDefaults(requisicion), [requisicion]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: yupResolver(schema) as never, defaultValues: defaults });
  const { fields } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (show) {
      reset(defaults);
      setFiles([]);
      setFileError(null);
      setServerError(null);
    }
  }, [show, defaults, reset]);

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const error = validateEvidencias(selected);
    setFileError(error);
    setFiles(error ? [] : selected);
    if (error) event.target.value = '';
  };

  const onValid = async (values: FormValues) => {
    setServerError(null);
    if (fileError) return;
    try {
      await mutation.mutateAsync({
        id: requisicion._id,
        data: {
          fecha: values.fecha,
          documento: values.documento?.trim() || undefined,
          observacion: values.observacion?.trim() || undefined,
          items: values.items
            .filter((i) => Number(i.cantidadRecibida) > 0)
            .map((i) => ({ lineaId: i.lineaId, cantidadRecibida: Number(i.cantidadRecibida) })),
          evidencias: files,
        },
      });
      toast.success('Recepción registrada.');
      onHide();
    } catch (err) {
      setServerError(getRequisicionErrorMessage(err, 'No fue posible registrar la recepción.'));
    }
  };

  const submitting = mutation.isLoading;

  return (
    <Modal show={show} onHide={submitting ? undefined : onHide} centered size="lg" scrollable aria-labelledby="reg-recepcion-title">
      <Form noValidate onSubmit={handleSubmit(onValid)}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title id="reg-recepcion-title">
            Registrar recepción
            <ReqHelp id="accion.registrarRecepcion" placement="bottom" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {serverError && (
            <Alert variant="danger" role="alert">
              {serverError}
            </Alert>
          )}
          <Row className="g-3 mb-3">
            <Col md={4}>
              <Form.Group controlId="rr-fecha">
                <Form.Label>Fecha de recepción *</Form.Label>
                <Form.Control type="date" max={today()} {...register('fecha')} isInvalid={!!errors.fecha} />
                <Form.Control.Feedback type="invalid">{errors.fecha?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group controlId="rr-documento">
                <Form.Label>Remisión o factura</Form.Label>
                <Form.Control maxLength={100} placeholder="Número de remisión o factura" {...register('documento')} isInvalid={!!errors.documento} />
                <Form.Control.Feedback type="invalid">{errors.documento?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId="rr-observacion">
                <Form.Label>Observaciones</Form.Label>
                <Form.Control as="textarea" rows={2} maxLength={1000} {...register('observacion')} isInvalid={!!errors.observacion} />
                <Form.Control.Feedback type="invalid">{errors.observacion?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <h3 className="h6">
            Cantidades recibidas
            <ReqHelp id="recepcion.cantidad" />
          </h3>
          {typeof errors.items?.message === 'string' && <div className="text-danger small mb-2" role="alert">{errors.items.message}</div>}
          {typeof errors.items?.root?.message === 'string' && <div className="text-danger small mb-2" role="alert">{errors.items.root.message}</div>}
          {fields.length === 0 ? (
            <p className="text-muted">No hay líneas pendientes de recibir.</p>
          ) : (
            <div className="table-responsive">
              <Table size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Línea</th>
                    <th className="text-end">Pendiente</th>
                    <th style={{ width: 160 }}>Recibido ahora</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td>{field.descripcion}</td>
                      <td className="text-end">{field.pendiente}</td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          step="any"
                          min={0}
                          max={field.pendiente}
                          aria-label={`Cantidad recibida de ${field.descripcion}`}
                          {...register(`items.${index}.cantidadRecibida`, { valueAsNumber: true })}
                          isInvalid={!!errors.items?.[index]?.cantidadRecibida}
                        />
                        <Form.Control.Feedback type="invalid">{errors.items?.[index]?.cantidadRecibida?.message}</Form.Control.Feedback>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          <Form.Group controlId="rr-evidencias" className="mt-3">
            <Form.Label>
              Evidencias
              <ReqHelp id="recepcion.evidencias" />
            </Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFiles}
              isInvalid={!!fileError}
            />
            <Form.Control.Feedback type="invalid">{fileError}</Form.Control.Feedback>
            <Form.Text className="text-muted">
              Opcional. Hasta {EVIDENCIA_MAX_FILES} archivos (imagen o PDF) de {EVIDENCIA_MAX_BYTES / MB} MB.
            </Form.Text>
            {files.length > 0 && (
              <ListGroup className="mt-2" variant="flush">
                {files.map((file) => (
                  <ListGroup.Item key={`${file.name}-${file.size}`} className="py-1 small">
                    {file.name}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={submitting || fields.length === 0 || !!fileError}>
            {submitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Registrar recepción
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RegistrarRecepcionModal;
