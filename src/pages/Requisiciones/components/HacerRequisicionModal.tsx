import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { useFieldArray, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/constants/permissions';
import { useGetAreas } from '@/hooks/useAreas';
import { useCurrentUserPermissions } from '@/hooks/usePermission';
import { useCreateRequisicionFromSolicitudes } from '@/hooks/useRepuestos';
import { useGetTiposRequisicion } from '@/hooks/useTiposRequisicion';
import { REQUISICION_PRIORIDADES, type RequisicionPrioridad } from '@/types/requisicion.types';
import { getApiErrorCode, getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { computeMontoTotal, formatMoney, refId } from '@/utils/requisicion.utils';
import ReqHelp from '../help/ReqHelp';

/** The fields of a spare-part request that the modal needs. */
export interface SolicitudParaRequisicion {
  _id: string;
  nombre: string;
  Cantidad?: string | number;
  PrecioRepuesto?: number;
  Prioridad?: string;
}

interface Props {
  show: boolean;
  onHide: () => void;
  solicitudes: SolicitudParaRequisicion[];
  /** Called after the requisicion was created (the modal itself navigates to it). */
  onCreated?: () => void;
}

interface LineaValues {
  repuestoId: string;
  nombre: string;
  cantidad: number;
  precioEstimado: number;
  descripcion: string;
}

interface FormValues {
  titulo: string;
  tipoRequisicionId: string;
  areaId: string;
  prioridad: string;
  fechaRequerida?: string;
  justificacion?: string;
  lineas: LineaValues[];
}

type SubmitMode = 'draft' | 'send';

const lineaSchema = yup.object({
  repuestoId: yup.string().required(),
  nombre: yup.string(),
  cantidad: yup
    .number()
    .typeError('Ingresa una cantidad')
    .moreThan(0, 'La cantidad debe ser mayor que cero')
    .required('Ingresa una cantidad'),
  precioEstimado: yup
    .number()
    .typeError('Ingresa un precio')
    .min(0, 'El precio no puede ser negativo')
    .required('Ingresa un precio'),
  descripcion: yup.string().trim().required('La descripción es obligatoria').max(300, 'Máximo 300 caracteres'),
});

const baseShape = {
  titulo: yup.string().trim().required('El título es obligatorio').max(200, 'Máximo 200 caracteres'),
  tipoRequisicionId: yup.string().required('Selecciona un tipo'),
  areaId: yup.string().required('Selecciona un área'),
  prioridad: yup.string().oneOf(REQUISICION_PRIORIDADES).required(),
  fechaRequerida: yup.string(),
  lineas: yup.array().of(lineaSchema).min(1, 'Agrega al menos una línea').required(),
};

const draftSchema = yup.object({ ...baseShape, justificacion: yup.string().max(2000, 'Máximo 2000 caracteres') });
const sendSchema = yup.object({
  ...baseShape,
  justificacion: yup.string().trim().required('La justificación es obligatoria para enviar').max(2000, 'Máximo 2000 caracteres'),
});

/** Spare-part priority (Baja|Media|Alta|Critica) mapped to the requisicion scale. */
const PRIORITY_RANK: Record<string, number> = { Baja: 0, Media: 1, Alta: 2, Critica: 3, Urgente: 3 };

/** Highest priority among the requests, expressed in the requisicion scale (default Media). */
export const highestPrioridad = (solicitudes: Array<Pick<SolicitudParaRequisicion, 'Prioridad'>>): RequisicionPrioridad => {
  let best = -1;
  solicitudes.forEach((s) => {
    const rank = PRIORITY_RANK[s.Prioridad ?? ''];
    if (rank !== undefined && rank > best) best = rank;
  });
  if (best < 0) return 'Media';
  return (['Baja', 'Media', 'Alta', 'Urgente'] as const)[best];
};

/** Quantity of a request: its text interpreted as a number, 1 when it is not a positive number (editable). */
export const parseCantidad = (raw?: string | number): number => {
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 1;
};

const isNumericCantidad = (raw?: string | number): boolean => {
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0;
};

const buildDefaults = (solicitudes: SolicitudParaRequisicion[]): FormValues => ({
  titulo:
    solicitudes.length === 1
      ? `Requisición: ${solicitudes[0].nombre}`.slice(0, 200)
      : `Requisición de ${solicitudes.length} repuestos`,
  tipoRequisicionId: '',
  areaId: '',
  prioridad: highestPrioridad(solicitudes),
  fechaRequerida: '',
  justificacion: '',
  lineas: solicitudes.map((s) => ({
    repuestoId: s._id,
    nombre: s.nombre,
    cantidad: parseCantidad(s.Cantidad),
    precioEstimado: typeof s.PrecioRepuesto === 'number' && s.PrecioRepuesto >= 0 ? s.PrecioRepuesto : 0,
    descripcion: s.nombre,
  })),
});

/** Modal that turns the selected spare-part requests into a requisicion (draft or sent for approval). */
const HacerRequisicionModal: React.FC<Props> = ({ show, onHide, solicitudes, onCreated }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { has } = useCurrentUserPermissions();
  const canSend = has(PERMISSIONS.REQUISICIONES_SEND);

  const { data: areasResponse } = useGetAreas({ limit: 100 }, show);
  const { data: tiposResponse } = useGetTiposRequisicion({ limit: 100 }, show);
  const createMutation = useCreateRequisicionFromSolicitudes();

  const areas = useMemo(() => (areasResponse?.data ?? []).filter((a) => a.activa), [areasResponse]);
  const tipos = useMemo(() => (tiposResponse?.data ?? []).filter((t) => t.activo), [tiposResponse]);

  const modeRef = useRef<SubmitMode>('draft');
  const [serverError, setServerError] = useState<string | null>(null);

  const resolver: Resolver<FormValues> = (values, context, options) =>
    (yupResolver(modeRef.current === 'send' ? sendSchema : draftSchema) as unknown as Resolver<FormValues>)(
      values,
      context,
      options
    );

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver, defaultValues: buildDefaults(solicitudes) });
  const { fields } = useFieldArray({ control, name: 'lineas' });

  // Reset the prefill every time the modal opens (the selection may have changed).
  const solicitudesKey = solicitudes.map((s) => s._id).join(',');
  useEffect(() => {
    if (show) {
      reset(buildDefaults(solicitudes));
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, solicitudesKey]);

  // Default the type to REPUESTO and the area to the user's own, once the catalogs arrive.
  useEffect(() => {
    if (!show) return;
    if (!getValues('tipoRequisicionId') && tipos.length > 0) {
      const repuesto = tipos.find((t) => t.codigo?.toUpperCase() === 'REPUESTO' || /repuesto/i.test(t.nombre));
      if (repuesto) setValue('tipoRequisicionId', repuesto._id);
    }
    if (!getValues('areaId') && areas.length > 0) {
      const ownArea = refId(user?.areaId as string | { _id: string } | null | undefined);
      if (ownArea && areas.some((a) => a._id === ownArea)) setValue('areaId', ownArea);
    }
  }, [show, tipos, areas, user, getValues, setValue]);

  const lineas = watch('lineas');
  const total = computeMontoTotal((lineas ?? []).map((l) => ({ cantidadSolicitada: Number(l.cantidad), precioEstimado: Number(l.precioEstimado) })));
  const nonNumeric = solicitudes.filter((s) => !isNumericCantidad(s.Cantidad));

  const onValid = async (values: FormValues) => {
    setServerError(null);
    const enviar = modeRef.current === 'send';
    try {
      const result = await createMutation.mutateAsync({
        repuestoIds: values.lineas.map((l) => l.repuestoId),
        titulo: values.titulo.trim(),
        tipoRequisicionId: values.tipoRequisicionId,
        areaId: values.areaId,
        prioridad: values.prioridad as RequisicionPrioridad,
        ...(values.fechaRequerida ? { fechaRequerida: values.fechaRequerida } : {}),
        ...(values.justificacion?.trim() ? { justificacion: values.justificacion.trim() } : {}),
        lineas: values.lineas.map((l) => ({
          repuestoId: l.repuestoId,
          cantidad: Number(l.cantidad),
          precioEstimado: Number(l.precioEstimado),
          descripcion: l.descripcion.trim(),
        })),
        enviar,
      });
      const requisicion = result?.data?.requisicion;
      toast.success(enviar ? 'Requisición creada y enviada a aprobación.' : 'Requisición creada como borrador.');
      (result?.data?.advertencias ?? []).forEach((advertencia) =>
        toast.warning(typeof advertencia === 'string' ? advertencia : advertencia.mensaje, { autoClose: 10000 })
      );
      onCreated?.();
      onHide();
      if (requisicion?._id) navigate(`/requisiciones/${requisicion._id}`);
    } catch (err) {
      setServerError(getRequisicionErrorMessage(err, 'No fue posible crear la requisición.'));
      // The selection is stale when someone else already linked a request: reload the list.
      if (['SOLICITUD_YA_VINCULADA', 'CAPABILITY_DISABLED'].includes(getApiErrorCode(err) ?? '')) {
        queryClient.invalidateQueries(['repuestos']);
      }
    }
  };

  const submitAs = (mode: SubmitMode) => () => {
    modeRef.current = mode;
    return handleSubmit(onValid)();
  };

  const submitting = createMutation.isLoading;

  return (
    <Modal show={show} onHide={submitting ? undefined : onHide} centered size="xl" scrollable aria-labelledby="hacer-req-title">
      <Modal.Header closeButton={!submitting}>
        <Modal.Title id="hacer-req-title">
          Hacer requisición ({solicitudes.length})
          <ReqHelp id="solicitudes.hacerRequisicion" placement="bottom" />
        </Modal.Title>
      </Modal.Header>
      <Form noValidate onSubmit={(e) => e.preventDefault()}>
        <Modal.Body>
          {serverError && (
            <Alert variant="danger" role="alert">
              {serverError}
            </Alert>
          )}
          {nonNumeric.length > 0 && (
            <Alert variant="warning">
              La cantidad de {nonNumeric.map((s) => `«${s.nombre}»`).join(', ')} no es un número: se propone 1. Corrígela antes de crear.
            </Alert>
          )}
          <Row className="g-3 mb-3">
            <Col md={8}>
              <Form.Group controlId="hr-titulo">
                <Form.Label>Título *</Form.Label>
                <Form.Control {...register('titulo')} isInvalid={!!errors.titulo} maxLength={200} />
                <Form.Control.Feedback type="invalid">{errors.titulo?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="hr-prioridad">
                <Form.Label>
                  Prioridad
                  <ReqHelp id="form.prioridad" />
                </Form.Label>
                <Form.Select {...register('prioridad')}>
                  {REQUISICION_PRIORIDADES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="hr-tipo">
                <Form.Label>
                  Tipo *
                  <ReqHelp id="form.tipo" />
                </Form.Label>
                <Form.Select {...register('tipoRequisicionId')} isInvalid={!!errors.tipoRequisicionId}>
                  <option value="">Selecciona un tipo</option>
                  {tipos.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.nombre}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.tipoRequisicionId?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="hr-area">
                <Form.Label>
                  Área *
                  <ReqHelp id="form.area" />
                </Form.Label>
                <Form.Select {...register('areaId')} isInvalid={!!errors.areaId}>
                  <option value="">Selecciona un área</option>
                  {areas.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.nombre}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.areaId?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="hr-fecha">
                <Form.Label>
                  Fecha requerida
                  <ReqHelp id="form.fechaRequerida" />
                </Form.Label>
                <Form.Control type="date" {...register('fechaRequerida')} />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId="hr-justificacion">
                <Form.Label>
                  Justificación
                  <ReqHelp id="form.justificacion" />
                </Form.Label>
                <Form.Control as="textarea" rows={2} maxLength={2000} {...register('justificacion')} isInvalid={!!errors.justificacion} />
                <Form.Control.Feedback type="invalid">{errors.justificacion?.message}</Form.Control.Feedback>
                <Form.Text className="text-muted">Obligatoria para enviar a aprobación.</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <h3 className="h6">
            Líneas
            <ReqHelp id="hacerReq.lineas" />
          </h3>
          {typeof errors.lineas?.message === 'string' && <div className="text-danger small mb-2">{errors.lineas.message}</div>}
          <div className="table-responsive">
            <Table size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Repuesto</th>
                  <th style={{ minWidth: 220 }}>Descripción</th>
                  <th style={{ width: 120 }}>Cantidad</th>
                  <th style={{ width: 150 }}>Precio estimado</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td>{field.nombre}</td>
                    <td>
                      <Form.Control
                        size="sm"
                        aria-label={`Descripción de ${field.nombre}`}
                        {...register(`lineas.${index}.descripcion`)}
                        isInvalid={!!errors.lineas?.[index]?.descripcion}
                      />
                      <Form.Control.Feedback type="invalid">{errors.lineas?.[index]?.descripcion?.message}</Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        step="any"
                        min={0}
                        aria-label={`Cantidad de ${field.nombre}`}
                        {...register(`lineas.${index}.cantidad`, { valueAsNumber: true })}
                        isInvalid={!!errors.lineas?.[index]?.cantidad}
                      />
                      <Form.Control.Feedback type="invalid">{errors.lineas?.[index]?.cantidad?.message}</Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        step="any"
                        min={0}
                        aria-label={`Precio estimado de ${field.nombre}`}
                        {...register(`lineas.${index}.precioEstimado`, { valueAsNumber: true })}
                        isInvalid={!!errors.lineas?.[index]?.precioEstimado}
                      />
                      <Form.Control.Feedback type="invalid">{errors.lineas?.[index]?.precioEstimado?.message}</Form.Control.Feedback>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={3} className="text-end">
                    Monto estimado
                  </th>
                  <th data-testid="hr-total">{formatMoney(total)}</th>
                </tr>
              </tfoot>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <ReqHelp id="hacerReq.crear" placement="top" className="me-auto" />
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="outline-primary" type="button" onClick={submitAs('draft')} disabled={submitting}>
            {submitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Crear borrador
          </Button>
          {canSend && (
            <Button variant="primary" type="button" onClick={submitAs('send')} disabled={submitting}>
              Crear y enviar a aprobación
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default HacerRequisicionModal;
