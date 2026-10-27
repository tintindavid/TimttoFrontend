import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, InputGroup, Modal, ProgressBar, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import DataTable from '@/components/common/DataTable';
import AppPagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import Can from '@/components/common/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { useDebounce } from '@/hooks/useDebounce';
import { useHasPermission } from '@/hooks/usePermission';
import { useGetAreas } from '@/hooks/useAreas';
import {
  useCreatePresupuestoArea,
  useDeletePresupuestoArea,
  useGetPresupuestoResumen,
  useGetPresupuestosArea,
  useUpdatePresupuestoArea,
} from '@/hooks/usePresupuestosArea';
import type { PresupuestoArea } from '@/types/requisicion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { catalogName, formatMoney, refId } from '@/utils/requisicion.utils';
import ConfigNav from './ConfigNav';
import ReqHelp from '../help/ReqHelp';

const PAGE_SIZE = 20;
const DEFAULT_THRESHOLD = 80;
const PERIODO_REGEX = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

interface FormValues {
  areaId: string;
  periodo: string;
  monto: number;
  umbralAlerta: number;
}

const createSchema = yup.object({
  areaId: yup.string().required('Selecciona un área'),
  periodo: yup
    .string()
    .trim()
    .matches(PERIODO_REGEX, 'Usa el formato AAAA (año) o AAAA-MM (mes)')
    .required('El período es obligatorio'),
  monto: yup.number().typeError('Ingresa el monto').min(0, 'No puede ser negativo').required('Ingresa el monto'),
  umbralAlerta: yup
    .number()
    .typeError('Ingresa el umbral')
    .min(1, 'Entre 1 y 100')
    .max(100, 'Entre 1 y 100')
    .required('Ingresa el umbral'),
});
// Area and period are the identity of the budget: only amount and threshold are editable.
const editSchema = createSchema.omit(['areaId', 'periodo']);

/** Consumed / committed / available figures of a budget row, fetched from the summary endpoint. */
export const ResumenCell: React.FC<{ presupuesto: PresupuestoArea }> = ({ presupuesto }) => {
  const { data, isLoading, isError } = useGetPresupuestoResumen({
    areaId: refId(presupuesto.areaId),
    periodo: presupuesto.periodo,
  });
  if (isLoading) return <Spinner size="sm" animation="border" aria-label="Cargando resumen" />;
  const resumen = data?.data;
  if (isError || !resumen) return <span className="text-muted">—</span>;
  const pct = resumen.porcentaje ?? 0;
  return (
    <div>
      <ProgressBar
        now={Math.min(pct, 100)}
        variant={resumen.sobrepasado ? 'danger' : resumen.alerta ? 'warning' : 'success'}
        label={`${pct}%`}
        aria-label={`Uso del presupuesto ${presupuesto.periodo}`}
      />
      <small className="text-muted d-block text-nowrap">
        Consumido {formatMoney(resumen.consumido, resumen.moneda)} · Comprometido {formatMoney(resumen.comprometido, resumen.moneda)}
      </small>
      <small className="d-block text-nowrap">Disponible {formatMoney(resumen.disponible, resumen.moneda)}</small>
    </div>
  );
};

interface ModalProps {
  show: boolean;
  presupuesto: PresupuestoArea | null;
  onHide: () => void;
}

export const PresupuestoFormModal: React.FC<ModalProps> = ({ show, presupuesto, onHide }) => {
  const isEdit = !!presupuesto;
  const createMutation = useCreatePresupuestoArea();
  const updateMutation = useUpdatePresupuestoArea();
  const { data: areasResponse } = useGetAreas({ limit: 100 });
  const areas = (areasResponse?.data ?? []).filter((a) => a.activa || a._id === refId(presupuesto?.areaId));
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: { areaId: '', periodo: String(new Date().getFullYear()), monto: 0, umbralAlerta: DEFAULT_THRESHOLD },
  });

  useEffect(() => {
    if (!show) return;
    setServerError(null);
    reset(
      presupuesto
        ? {
            areaId: refId(presupuesto.areaId),
            periodo: presupuesto.periodo,
            monto: presupuesto.monto,
            umbralAlerta: presupuesto.umbralAlerta ?? DEFAULT_THRESHOLD,
          }
        : { areaId: '', periodo: String(new Date().getFullYear()), monto: 0, umbralAlerta: DEFAULT_THRESHOLD }
    );
  }, [show, presupuesto, reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      if (presupuesto) {
        await updateMutation.mutateAsync({
          id: presupuesto._id,
          data: { monto: values.monto, umbralAlerta: values.umbralAlerta },
        });
        toast.success('Presupuesto actualizado.');
      } else {
        await createMutation.mutateAsync({
          areaId: values.areaId,
          periodo: values.periodo.trim(),
          monto: values.monto,
          umbralAlerta: values.umbralAlerta,
        });
        toast.success('Presupuesto creado.');
      }
      onHide();
    } catch (err) {
      setServerError(getRequisicionErrorMessage(err, 'No fue posible guardar el presupuesto.'));
    }
  };

  const saving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {serverError && <Alert variant="danger">{serverError}</Alert>}
          <Row className="g-3">
            <Col md={8}>
              <Form.Label htmlFor="pres-area">Área *</Form.Label>
              <ReqHelp id="pres.area" />
              <Form.Select id="pres-area" disabled={isEdit} isInvalid={!!errors.areaId} {...register('areaId')}>
                <option value="">— Seleccionar —</option>
                {areas.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.nombre}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.areaId?.message}</Form.Control.Feedback>
            </Col>
            <Col md={4}>
              <Form.Label htmlFor="pres-periodo">Período *</Form.Label>
              <ReqHelp id="pres.periodo" />
              <Form.Control id="pres-periodo" placeholder="2026 o 2026-03" disabled={isEdit} isInvalid={!!errors.periodo} {...register('periodo')} />
              <Form.Control.Feedback type="invalid">{errors.periodo?.message}</Form.Control.Feedback>
            </Col>
            <Col md={7}>
              <Form.Label htmlFor="pres-monto">Monto *</Form.Label>
              <ReqHelp id="pres.monto" />
              <Form.Control id="pres-monto" type="number" min={0} step="any" isInvalid={!!errors.monto} {...register('monto', { valueAsNumber: true })} />
              <Form.Control.Feedback type="invalid">{errors.monto?.message}</Form.Control.Feedback>
            </Col>
            <Col md={5}>
              <Form.Label htmlFor="pres-umbral">Umbral de alerta (%) *</Form.Label>
              <ReqHelp id="pres.umbral" />
              <Form.Control id="pres-umbral" type="number" min={1} max={100} isInvalid={!!errors.umbralAlerta} {...register('umbralAlerta', { valueAsNumber: true })} />
              <Form.Control.Feedback type="invalid">{errors.umbralAlerta?.message}</Form.Control.Feedback>
            </Col>
            <Col xs={12}>
              <Form.Text className="text-muted">
                El presupuesto es informativo: se muestra al aprobador pero no bloquea envíos ni aprobaciones.
              </Form.Text>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            {isEdit ? 'Guardar cambios' : 'Crear presupuesto'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const PresupuestosPage: React.FC = () => {
  const canUpdate = useHasPermission(PERMISSIONS.BUDGETS_UPDATE);
  const canDelete = useHasPermission(PERMISSIONS.BUDGETS_DELETE);

  const [page, setPage] = useState(1);
  const [areaId, setAreaId] = useState('');
  const [periodoInput, setPeriodoInput] = useState('');
  const [editing, setEditing] = useState<PresupuestoArea | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<PresupuestoArea | null>(null);

  const debouncedPeriodo = useDebounce(periodoInput.trim(), 300);
  // Only send a period the backend accepts, so a half-typed value does not produce a 400.
  const periodoFilter = PERIODO_REGEX.test(debouncedPeriodo) ? debouncedPeriodo : undefined;

  useEffect(() => {
    setPage(1);
  }, [areaId, periodoFilter]);

  const { data, isLoading, isFetching, isError } = useGetPresupuestosArea({
    page,
    limit: PAGE_SIZE,
    areaId: areaId || undefined,
    periodo: periodoFilter,
  });
  const { data: areasResponse } = useGetAreas({ limit: 100 });
  const deleteMutation = useDeletePresupuestoArea();

  const rows: PresupuestoArea[] = data?.data ?? [];
  const areas = areasResponse?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const totalCount = data?.pagination?.total ?? rows.length;
  const hasFilter = Boolean(areaId || periodoFilter);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete._id);
      toast.success('Presupuesto eliminado.');
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible eliminar el presupuesto.'));
    } finally {
      setToDelete(null);
    }
  };

  const areaName = (p: PresupuestoArea) => {
    const populated = catalogName(p.areaId);
    if (populated !== '—') return populated;
    return areas.find((a) => a._id === refId(p.areaId))?.nombre ?? '—';
  };

  const columns = [
    { key: 'area', label: 'Área', render: (p: PresupuestoArea) => areaName(p) },
    { key: 'periodo', label: 'Período', render: (p: PresupuestoArea) => <span className="fw-semibold">{p.periodo}</span> },
    { key: 'monto', label: 'Monto', render: (p: PresupuestoArea) => <span className="text-nowrap">{formatMoney(p.monto, p.moneda)}</span> },
    { key: 'umbral', label: 'Alerta', render: (p: PresupuestoArea) => `${p.umbralAlerta ?? DEFAULT_THRESHOLD}%` },
    { key: 'resumen', label: 'Ejecución', render: (p: PresupuestoArea) => <ResumenCell presupuesto={p} /> },
  ];

  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>
            Configuración de requisiciones
            <ReqHelp id="pagina.presupuestos" placement="bottom" />
          </h1>
          <p className="text-muted mb-0">Presupuestos informativos por área y período</p>
        </Col>
        <Col className="text-end">
          <Can permission={PERMISSIONS.BUDGETS_CREATE}>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <FaPlus className="me-2" aria-hidden="true" />
              Crear presupuesto
            </Button>
          </Can>
        </Col>
      </Row>

      <ConfigNav />

      <Row className="g-2 mb-3">
        <Col md={6} className="d-flex align-items-center gap-1">
          <Form.Select aria-label="Filtrar por área" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a._id} value={a._id}>
                {a.nombre}
              </option>
            ))}
          </Form.Select>
          <ReqHelp id="pres.filtroArea" className="ms-0" />
        </Col>
        <Col md={6} className="d-flex align-items-center gap-1">
          <InputGroup>
            <InputGroup.Text>Período</InputGroup.Text>
            <Form.Control
              placeholder="2026 o 2026-03"
              aria-label="Filtrar por período"
              value={periodoInput}
              onChange={(e) => setPeriodoInput(e.target.value)}
            />
          </InputGroup>
          <ReqHelp id="pres.filtroPeriodo" className="ms-0" />
        </Col>
      </Row>

      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" aria-label="Cargando presupuestos" />
        </div>
      )}
      {isError && <Alert variant="danger">Error al cargar los presupuestos.</Alert>}

      {data && (
        <>
          <div className="small text-muted mb-1">
            Columna «Ejecución»
            <ReqHelp id="pres.ejecucion" />
          </div>
          <Card className="tt-card mb-3 position-relative">
            {isFetching && !isLoading && (
              <div className="position-absolute top-0 end-0 m-2">
                <Spinner size="sm" animation="border" variant="secondary" />
              </div>
            )}
            <Card.Body>
              <div className="table-responsive">
                <DataTable
                  data={rows}
                  columns={columns}
                  actions={(row: PresupuestoArea) => (
                    <div className="d-flex gap-1">
                      {canUpdate && (
                        <Button
                          size="sm"
                          variant="outline-warning"
                          title="Editar"
                          aria-label={`Editar presupuesto ${row.periodo}`}
                          onClick={() => {
                            setEditing(row);
                            setShowForm(true);
                          }}
                        >
                          <FaEdit />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="outline-danger" title="Eliminar" aria-label={`Eliminar presupuesto ${row.periodo}`} onClick={() => setToDelete(row)}>
                          <FaTrash />
                        </Button>
                      )}
                    </div>
                  )}
                />
              </div>
              {rows.length === 0 && (
                <p className="text-center text-muted my-3 mb-0">
                  {hasFilter ? 'Ningún presupuesto coincide con los filtros.' : 'Aún no hay presupuestos configurados.'}
                </p>
              )}
            </Card.Body>
          </Card>
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Mostrando {rows.length} de {totalCount} presupuestos
            </small>
            <AppPagination page={page} pages={totalPages} onChange={setPage} />
          </div>
        </>
      )}

      <PresupuestoFormModal show={showForm} presupuesto={editing} onHide={() => setShowForm(false)} />

      <ConfirmModal
        show={!!toDelete}
        title="Eliminar presupuesto"
        body={`¿Eliminar el presupuesto ${toDelete?.periodo ?? ''}? Los montos consumidos no se alteran.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Container>
  );
};

export default PresupuestosPage;
