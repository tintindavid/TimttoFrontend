import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Breadcrumb, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { useCurrentUserPermissions } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import { useGetAreas } from '@/hooks/useAreas';
import { useGetTiposRequisicion } from '@/hooks/useTiposRequisicion';
import {
  useCreateRequisicion,
  useEnviarRequisicion,
  useGetRequisicion,
  useUpdateRequisicion,
} from '@/hooks/useRequisiciones';
import {
  REQUISICION_PRIORIDADES,
  type CreateRequisicionDto,
  type RequisicionLineaInput,
  type RequisicionPrioridad,
  type Requisicion,
} from '@/types/requisicion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { canActAsOwner, refId } from '@/utils/requisicion.utils';
import ReqHelp from './help/ReqHelp';
import LineasEditor, {
  MAX_LINEAS,
  emptyLinea,
  type LineaFormValues,
  type RequisicionFormValues,
} from './components/LineasEditor';

type SubmitMode = 'draft' | 'send';

const lineaSchema = yup.object({
  fuente: yup.string().oneOf(['stock', 'libre']).required(),
  inventarioItemId: yup
    .string()
    .nullable()
    .when('fuente', {
      is: 'stock',
      then: (s) => s.required('Selecciona un ítem de stock o cambia a texto libre'),
    }),
  descripcion: yup.string().trim().required('La descripción es obligatoria').max(300, 'Máximo 300 caracteres'),
  especificaciones: yup.string().max(1000, 'Máximo 1000 caracteres'),
  unidad: yup.string().trim().required('La unidad es obligatoria').max(30, 'Máximo 30 caracteres'),
  cantidadSolicitada: yup
    .number()
    .typeError('Ingresa una cantidad')
    .moreThan(0, 'La cantidad debe ser mayor que cero')
    .required('Ingresa una cantidad'),
  precioEstimado: yup
    .number()
    .typeError('Ingresa un precio')
    .min(0, 'El precio no puede ser negativo')
    .required('Ingresa un precio'),
});

const baseShape = {
  titulo: yup.string().trim().required('El título es obligatorio').max(200, 'Máximo 200 caracteres'),
  tipoRequisicionId: yup.string().required('Selecciona un tipo'),
  areaId: yup.string().required('Selecciona un área'),
  prioridad: yup.string().oneOf(REQUISICION_PRIORIDADES).required(),
  fechaRequerida: yup.string(),
  lineas: yup
    .array()
    .of(lineaSchema)
    .min(1, 'Agrega al menos una línea')
    .max(MAX_LINEAS, `Máximo ${MAX_LINEAS} líneas`)
    .required(),
};

const draftSchema = yup.object({
  ...baseShape,
  justificacion: yup.string().max(2000, 'Máximo 2000 caracteres'),
});

// Sending needs a justification (the backend validates it too).
const sendSchema = yup.object({
  ...baseShape,
  justificacion: yup.string().trim().required('La justificación es obligatoria para enviar').max(2000, 'Máximo 2000 caracteres'),
});

const toFormValues = (req: Requisicion): RequisicionFormValues => ({
  titulo: req.titulo,
  tipoRequisicionId: refId(req.tipoRequisicionId),
  areaId: refId(req.areaId),
  prioridad: req.prioridad,
  fechaRequerida: req.fechaRequerida ? String(req.fechaRequerida).slice(0, 10) : '',
  justificacion: req.justificacion ?? '',
  lineas: req.lineas.map<LineaFormValues>((l) => ({
    fuente: l.inventarioItemId ? 'stock' : 'libre',
    inventarioItemId: l.inventarioItemId ? refId(l.inventarioItemId as string | { _id: string }) : null,
    descripcion: l.descripcion,
    especificaciones: l.especificaciones ?? '',
    unidad: l.unidad,
    cantidadSolicitada: l.cantidadSolicitada,
    precioEstimado: l.precioEstimado,
  })),
});

const toLineasPayload = (lineas: LineaFormValues[]): RequisicionLineaInput[] =>
  lineas.map((l) => ({
    descripcion: l.descripcion.trim(),
    ...(l.especificaciones?.trim() ? { especificaciones: l.especificaciones.trim() } : {}),
    unidad: l.unidad.trim(),
    cantidadSolicitada: Number(l.cantidadSolicitada),
    precioEstimado: Number(l.precioEstimado),
    inventarioItemId: l.fuente === 'stock' && l.inventarioItemId ? l.inventarioItemId : null,
  }));

const RequisicionFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { has } = useCurrentUserPermissions();
  const { can } = useTenantCapabilities();
  const canUseStock = can('usesInventoryBasic');

  const { data: detail, isLoading: loadingDetail, isError: detailError } = useGetRequisicion(id);
  const { data: areasResponse, isLoading: loadingAreas } = useGetAreas({ limit: 100 });
  const { data: tiposResponse, isLoading: loadingTipos } = useGetTiposRequisicion({ limit: 100 });
  const createMutation = useCreateRequisicion();
  const updateMutation = useUpdateRequisicion();
  const enviarMutation = useEnviarRequisicion();

  const modeRef = useRef<SubmitMode>('draft');
  const [serverError, setServerError] = useState<string | null>(null);

  const requisicion = detail?.data;
  const areas = areasResponse?.data ?? [];
  const tipos = tiposResponse?.data ?? [];

  // The schema depends on whether the user is saving a draft or sending.
  const resolver: Resolver<RequisicionFormValues> = (values, context, options) =>
    (yupResolver(modeRef.current === 'send' ? sendSchema : draftSchema) as unknown as Resolver<RequisicionFormValues>)(
      values,
      context,
      options
    );

  const methods = useForm<RequisicionFormValues>({
    resolver,
    defaultValues: {
      titulo: '',
      tipoRequisicionId: '',
      areaId: '',
      prioridad: 'Media',
      fechaRequerida: '',
      justificacion: '',
      lineas: [emptyLinea(canUseStock ? 'stock' : 'libre')],
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  // Hydrate the form once the requisicion arrives (edit mode).
  useEffect(() => {
    if (isEdit && requisicion) reset(toFormValues(requisicion));
  }, [isEdit, requisicion, reset]);

  // Default the area to the user's own area (create mode only).
  useEffect(() => {
    if (isEdit || getValues('areaId')) return;
    const ownArea = refId(user?.areaId as string | { _id: string } | null | undefined);
    if (ownArea && areas.some((a) => a._id === ownArea && a.activa)) setValue('areaId', ownArea);
  }, [isEdit, user, areas, getValues, setValue]);

  const currentAreaId = refId(requisicion?.areaId);
  const currentTipoId = refId(requisicion?.tipoRequisicionId);
  const areaOptions = useMemo(
    () => areas.filter((a) => a.activa || a._id === currentAreaId),
    [areas, currentAreaId]
  );
  const tipoOptions = useMemo(
    () => tipos.filter((t) => t.activo || t._id === currentTipoId),
    [tipos, currentTipoId]
  );

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading || enviarMutation.isLoading;

  const onValid = async (values: RequisicionFormValues) => {
    setServerError(null);
    const base = {
      titulo: values.titulo.trim(),
      areaId: values.areaId,
      prioridad: values.prioridad as RequisicionPrioridad,
      fechaRequerida: values.fechaRequerida || null,
      justificacion: values.justificacion?.trim() || undefined,
      lineas: toLineasPayload(values.lineas),
    };

    let savedId = id ?? '';
    try {
      if (isEdit && id) {
        // `tipoRequisicionId` is immutable and is never sent on edit.
        await updateMutation.mutateAsync({ id, data: base });
      } else {
        const payload: CreateRequisicionDto = { ...base, tipoRequisicionId: values.tipoRequisicionId };
        const created = await createMutation.mutateAsync(payload);
        savedId = created.data._id;
      }
    } catch (err) {
      setServerError(getRequisicionErrorMessage(err, 'No fue posible guardar la requisición.'));
      return;
    }

    if (modeRef.current === 'send') {
      try {
        await enviarMutation.mutateAsync(savedId);
        toast.success('Requisición enviada a aprobación.');
      } catch (err) {
        // The draft is already saved: take the user to the detail where the send can be retried.
        toast.error(getRequisicionErrorMessage(err, 'La requisición se guardó pero no se pudo enviar.'));
      }
    } else {
      toast.success('Borrador guardado.');
    }
    navigate(`/requisiciones/${savedId}`);
  };

  const submitAs = (mode: SubmitMode) => () => {
    modeRef.current = mode;
    return handleSubmit(onValid)();
  };

  if (isEdit && loadingDetail) {
    return (
      <Container className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" aria-label="Cargando requisición" />
      </Container>
    );
  }

  if (isEdit && (detailError || !requisicion)) {
    return (
      <Container>
        <Alert variant="danger">No fue posible cargar la requisición.</Alert>
        <Link to="/requisiciones">Volver al listado</Link>
      </Container>
    );
  }

  if (isEdit && requisicion && requisicion.estado !== 'Borrador') {
    return (
      <Container>
        <Alert variant="warning">
          Solo se puede editar una requisición en estado Borrador. Si ya fue enviada, retírala primero desde el detalle.
        </Alert>
        <Link to={`/requisiciones/${requisicion._id}`}>Volver al detalle</Link>
      </Container>
    );
  }

  if (isEdit && requisicion && !canActAsOwner(requisicion, user, has(PERMISSIONS.REQUISICIONES_MANAGE_ALL))) {
    return (
      <Container>
        <Alert variant="warning">Solo el creador o el solicitante puede editar este borrador.</Alert>
        <Link to={`/requisiciones/${requisicion._id}`}>Volver al detalle</Link>
      </Container>
    );
  }

  const loadingCatalogs = loadingAreas || loadingTipos;

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/requisiciones' }}>
          Requisiciones
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{isEdit ? `Editar ${requisicion?.consecutivo ?? ''}` : 'Nueva requisición'}</Breadcrumb.Item>
      </Breadcrumb>
      <h1 className="mb-4">
        {isEdit ? 'Editar requisición' : 'Nueva requisición'}
        <ReqHelp id="pagina.formulario" placement="bottom" />
      </h1>

      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <FormProvider {...methods}>
        <Form noValidate onSubmit={(e) => e.preventDefault()}>
          <Card className="tt-card mb-3">
            <Card.Body>
              <h6 className="mb-3 text-muted text-uppercase">Datos generales</h6>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Label htmlFor="req-titulo">Título *</Form.Label>
                  <ReqHelp id="form.titulo" />
                  <Form.Control id="req-titulo" maxLength={200} isInvalid={!!errors.titulo} {...register('titulo')} />
                  <Form.Control.Feedback type="invalid">{errors.titulo?.message}</Form.Control.Feedback>
                </Col>
                <Col md={4}>
                  <Form.Label htmlFor="req-tipo">Tipo *</Form.Label>
                  <ReqHelp id="form.tipo" />
                  <Form.Select
                    id="req-tipo"
                    disabled={isEdit || loadingCatalogs}
                    isInvalid={!!errors.tipoRequisicionId}
                    {...register('tipoRequisicionId')}
                  >
                    <option value="">— Seleccionar —</option>
                    {tipoOptions.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.nombre}
                      </option>
                    ))}
                  </Form.Select>
                  {isEdit && <Form.Text className="text-muted">El tipo no puede cambiarse después de crear la requisición.</Form.Text>}
                  <Form.Control.Feedback type="invalid">{errors.tipoRequisicionId?.message}</Form.Control.Feedback>
                </Col>
                <Col md={4}>
                  <Form.Label htmlFor="req-area">Área *</Form.Label>
                  <ReqHelp id="form.area" />
                  <Form.Select id="req-area" disabled={loadingCatalogs} isInvalid={!!errors.areaId} {...register('areaId')}>
                    <option value="">— Seleccionar —</option>
                    {areaOptions.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.nombre}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.areaId?.message}</Form.Control.Feedback>
                </Col>
                <Col md={2}>
                  <Form.Label htmlFor="req-prioridad">Prioridad</Form.Label>
                  <ReqHelp id="form.prioridad" />
                  <Form.Select id="req-prioridad" {...register('prioridad')}>
                    {REQUISICION_PRIORIDADES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label htmlFor="req-fecha">Fecha requerida</Form.Label>
                  <ReqHelp id="form.fechaRequerida" />
                  <Form.Control id="req-fecha" type="date" {...register('fechaRequerida')} />
                </Col>
                <Col md={12}>
                  <Form.Label htmlFor="req-justificacion">Justificación (obligatoria para enviar)</Form.Label>
                  <ReqHelp id="form.justificacion" />
                  <Form.Control
                    id="req-justificacion"
                    as="textarea"
                    rows={3}
                    maxLength={2000}
                    isInvalid={!!errors.justificacion}
                    {...register('justificacion')}
                  />
                  <Form.Control.Feedback type="invalid">{errors.justificacion?.message}</Form.Control.Feedback>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="tt-card mb-3">
            <Card.Body>
              <h6 className="mb-3 text-muted text-uppercase">
                Líneas
                <ReqHelp id="form.lineas" />
              </h6>
              <LineasEditor canUseStock={canUseStock} currency={requisicion?.moneda} />
            </Card.Body>
          </Card>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <Button variant="outline-primary" type="button" disabled={isSubmitting} onClick={submitAs('draft')}>
              {isSubmitting && modeRef.current === 'draft' && <Spinner as="span" size="sm" animation="border" className="me-2" />}
              Guardar borrador
            </Button>
            <span className="d-inline-flex align-items-center">
              <ReqHelp id="form.guardarBorrador" className="ms-0" />
            </span>
            <Button variant="primary" type="button" disabled={isSubmitting} onClick={submitAs('send')}>
              {isSubmitting && modeRef.current === 'send' && <Spinner as="span" size="sm" animation="border" className="me-2" />}
              Guardar y enviar
            </Button>
            <span className="d-inline-flex align-items-center">
              <ReqHelp id="form.guardarEnviar" className="ms-0" />
            </span>
            <Button variant="outline-secondary" type="button" onClick={() => navigate(-1)} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </Form>
      </FormProvider>
    </Container>
  );
};

export default RequisicionFormPage;
