import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { FaEdit, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import DataTable from '@/components/common/DataTable';
import ConfirmModal from '@/components/common/ConfirmModal';
import Can from '@/components/common/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { useHasPermission } from '@/hooks/usePermission';
import {
  useCreateReglaAprobacion,
  useDeleteReglaAprobacion,
  useGetReglasAprobacion,
  useUpdateReglaAprobacion,
} from '@/hooks/useReglasAprobacion';
import { useRoles } from '@/hooks/useRoles';
import { useUsers } from '@/hooks/useUsers';
import {
  REGLA_CONFLICTO_LABELS,
  type AprobadorTipo,
  type CreateReglaAprobacionDto,
  type ReglaAprobacion,
} from '@/types/requisicion.types';
import type { User } from '@/types/user.types';
import { getApiErrorCode, getReglaConflictMessages, getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { findReglaConflicts, formatMoney, refId, userRefName, warningText } from '@/utils/requisicion.utils';
import ConfigNav from './ConfigNav';
import ReqHelp from '../help/ReqHelp';
import { SISTEMA_HINT, SistemaBadge, SistemaNote } from './SistemaBadge';

const APROBADOR_TIPO_OPTIONS: Array<{ value: AprobadorTipo; label: string }> = [
  { value: 'jefe_area', label: 'Jefe del área de la requisición' },
  { value: 'rol', label: 'Usuarios de un rol' },
  { value: 'usuarios', label: 'Usuarios específicos' },
];

interface UserOption {
  value: string;
  label: string;
}

const userLabel = (u: User) => u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;

interface FormValues {
  orden: number;
  nombre: string;
  montoDesde: number;
  montoHasta?: number | null;
  aprobadorTipo: AprobadorTipo;
  rolId?: string;
  usuariosIds: string[];
  activo: boolean;
}

const schema = yup.object({
  orden: yup.number().typeError('Ingresa el orden').integer('Debe ser un entero').min(1, 'Mínimo 1').required('Ingresa el orden'),
  nombre: yup.string().trim().required('El nombre es obligatorio').max(120, 'Máximo 120 caracteres'),
  montoDesde: yup.number().typeError('Ingresa el monto inicial').min(0, 'No puede ser negativo').required('Ingresa el monto inicial'),
  montoHasta: yup
    .number()
    .transform((value, original) => (original === '' || original === null || Number.isNaN(value) ? null : value))
    .nullable()
    .min(0, 'No puede ser negativo')
    .when('montoDesde', ([desde], s) =>
      typeof desde === 'number' && !Number.isNaN(desde) ? s.moreThan(desde, 'Debe ser mayor que el monto inicial') : s
    ),
  aprobadorTipo: yup.string().oneOf(['jefe_area', 'rol', 'usuarios']).required(),
  rolId: yup.string().when('aprobadorTipo', { is: 'rol', then: (s) => s.required('Selecciona un rol') }),
  usuariosIds: yup
    .array()
    .of(yup.string().required())
    .when('aprobadorTipo', { is: 'usuarios', then: (s) => s.min(1, 'Selecciona al menos un usuario') })
    .required(),
  activo: yup.boolean().required(),
});

const emptyValues = (nextOrden: number): FormValues => ({
  orden: nextOrden,
  nombre: '',
  montoDesde: 0,
  montoHasta: null,
  aprobadorTipo: 'jefe_area',
  rolId: '',
  usuariosIds: [],
  activo: true,
});

interface ModalProps {
  show: boolean;
  regla: ReglaAprobacion | null;
  allReglas: ReglaAprobacion[];
  users: User[];
  onHide: () => void;
}

export const ReglaFormModal: React.FC<ModalProps> = ({ show, regla, allReglas, users, onHide }) => {
  const isEdit = !!regla;
  const createMutation = useCreateReglaAprobacion();
  const updateMutation = useUpdateReglaAprobacion();
  const { data: rolesResponse } = useRoles({ page: 1, limit: 100 });
  const roles = rolesResponse?.data ?? [];
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverConflicts, setServerConflicts] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as never,
    defaultValues: emptyValues(1),
  });

  useEffect(() => {
    if (!show) return;
    setServerError(null);
    setServerConflicts([]);
    reset(
      regla
        ? {
            orden: regla.orden,
            nombre: regla.nombre,
            montoDesde: regla.montoDesde,
            montoHasta: regla.montoHasta,
            aprobadorTipo: regla.aprobadorTipo,
            rolId: regla.rolId ?? '',
            usuariosIds: (regla.usuariosIds ?? []).map((u) => refId(u)),
            activo: regla.activo,
          }
        : emptyValues(Math.max(0, ...allReglas.map((r) => r.orden)) + 1)
    );
  }, [show, regla, allReglas, reset]);

  const watched = useWatch({ control });
  const tipo = watched.aprobadorTipo;

  // Live hints: the same checks the server runs on the active rules of the tenant.
  const liveConflicts = useMemo(() => {
    if (watched.activo === false) return [];
    const desde = Number(watched.montoDesde);
    const orden = Number(watched.orden);
    if (!Number.isFinite(desde) || !Number.isFinite(orden)) return [];
    const hasta = watched.montoHasta === null || watched.montoHasta === undefined || String(watched.montoHasta) === '' ? null : Number(watched.montoHasta);
    const others = allReglas.filter((r) => r.activo && r._id !== regla?._id);
    return Array.from(
      new Set(
        findReglaConflicts({ _id: regla?._id, orden, montoDesde: desde, montoHasta: hasta }, others).map(
          (c) => `${REGLA_CONFLICTO_LABELS[c.tipo]}${c.orden !== undefined ? ` (nivel ${c.orden})` : ''}`
        )
      )
    );
  }, [watched.activo, watched.montoDesde, watched.montoHasta, watched.orden, allReglas, regla]);

  const userOptions: UserOption[] = useMemo(() => {
    const known = new Map(users.map((u) => [u._id ?? '', userLabel(u)]));
    (regla?.usuariosIds ?? []).forEach((u) => {
      const id = refId(u);
      if (id && !known.has(id)) known.set(id, userRefName(u));
    });
    return Array.from(known.entries())
      .filter(([value]) => !!value)
      .map(([value, label]) => ({ value, label }));
  }, [users, regla]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setServerConflicts([]);
    const montoHasta = values.montoHasta === undefined || values.montoHasta === null ? null : Number(values.montoHasta);
    try {
      if (regla) {
        await updateMutation.mutateAsync({
          id: regla._id,
          data: {
            orden: values.orden,
            nombre: values.nombre.trim(),
            montoDesde: values.montoDesde,
            montoHasta,
            aprobadorTipo: values.aprobadorTipo,
            rolId: values.aprobadorTipo === 'rol' ? values.rolId : null,
            usuariosIds: values.aprobadorTipo === 'usuarios' ? values.usuariosIds : [],
            activo: values.activo,
          },
        });
        toast.success('Regla actualizada.');
      } else {
        const payload: CreateReglaAprobacionDto = {
          orden: values.orden,
          nombre: values.nombre.trim(),
          montoDesde: values.montoDesde,
          montoHasta,
          aprobadorTipo: values.aprobadorTipo,
          activo: values.activo,
          // The backend rejects approver fields that do not belong to the chosen type.
          ...(values.aprobadorTipo === 'rol' ? { rolId: values.rolId } : {}),
          ...(values.aprobadorTipo === 'usuarios' ? { usuariosIds: values.usuariosIds } : {}),
        };
        await createMutation.mutateAsync(payload);
        toast.success('Regla creada.');
      }
      onHide();
    } catch (err) {
      setServerError(getRequisicionErrorMessage(err, 'No fue posible guardar la regla.'));
      if (getApiErrorCode(err) === 'REGLAS_INCONSISTENTES') setServerConflicts(getReglaConflictMessages(err));
    }
  };

  const saving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Editar nivel de aprobación' : 'Nuevo nivel de aprobación'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {serverError && (
            <Alert variant="danger">
              {serverError}
              {serverConflicts.length > 0 && (
                <ul className="mb-0 mt-2">
                  {serverConflicts.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
          <Alert variant="info" className="py-2">
            Cada regla es un nivel. Una requisición pasa por todos los niveles activos cuyo monto inicial sea menor o igual a su
            monto estimado, en orden. Un monto inicial mayor debe tener un orden mayor y los rangos no deben traslaparse.
          </Alert>
          {liveConflicts.length > 0 && (
            <Alert variant="warning" className="py-2" data-testid="regla-hints">
              <ul className="mb-0">
                {liveConflicts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Alert>
          )}
          <Row className="g-3">
            <Col md={2}>
              <Form.Label htmlFor="regla-orden">Orden *</Form.Label>
              <ReqHelp id="regla.orden" />
              <Form.Control id="regla-orden" type="number" min={1} step={1} isInvalid={!!errors.orden} {...register('orden', { valueAsNumber: true })} />
              <Form.Control.Feedback type="invalid">{errors.orden?.message}</Form.Control.Feedback>
            </Col>
            <Col md={10}>
              <Form.Label htmlFor="regla-nombre">Nombre *</Form.Label>
              <Form.Control id="regla-nombre" maxLength={120} disabled={!!regla?.esSistema} isInvalid={!!errors.nombre} {...register('nombre')} />
              {regla?.esSistema && <SistemaNote />}
              <Form.Control.Feedback type="invalid">{errors.nombre?.message}</Form.Control.Feedback>
            </Col>
            <Col md={6}>
              <Form.Label htmlFor="regla-desde">Monto desde *</Form.Label>
              <ReqHelp id="regla.montoDesde" />
              <Form.Control id="regla-desde" type="number" min={0} step="any" isInvalid={!!errors.montoDesde} {...register('montoDesde', { valueAsNumber: true })} />
              <Form.Control.Feedback type="invalid">{errors.montoDesde?.message}</Form.Control.Feedback>
            </Col>
            <Col md={6}>
              <Form.Label htmlFor="regla-hasta">Monto hasta</Form.Label>
              <ReqHelp id="regla.montoHasta" />
              <Form.Control
                id="regla-hasta"
                type="number"
                min={0}
                step="any"
                placeholder="Sin límite"
                isInvalid={!!errors.montoHasta}
                {...register('montoHasta', { setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)) })}
              />
              <Form.Text className="text-muted">Déjalo vacío si el nivel no tiene límite superior.</Form.Text>
              <Form.Control.Feedback type="invalid">{errors.montoHasta?.message}</Form.Control.Feedback>
            </Col>
            <Col md={6}>
              <Form.Label htmlFor="regla-tipo">Aprobador *</Form.Label>
              <ReqHelp id="regla.aprobadorTipo" />
              <Form.Select id="regla-tipo" {...register('aprobadorTipo')}>
                {APROBADOR_TIPO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            {tipo === 'rol' && (
              <Col md={6}>
                <Form.Label htmlFor="regla-rol">Rol *</Form.Label>
                <Form.Select id="regla-rol" isInvalid={!!errors.rolId} {...register('rolId')}>
                  <option value="">— Seleccionar rol —</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">Se verifica en vivo que el usuario tenga el permiso de aprobar.</Form.Text>
                <Form.Control.Feedback type="invalid">{errors.rolId?.message}</Form.Control.Feedback>
              </Col>
            )}
            {tipo === 'usuarios' && (
              <Col md={6}>
                <Form.Label htmlFor="regla-usuarios">Usuarios *</Form.Label>
                <Controller
                  control={control}
                  name="usuariosIds"
                  render={({ field }) => (
                    <Select<UserOption, true>
                      inputId="regla-usuarios"
                      isMulti
                      classNamePrefix="react-select"
                      placeholder="Seleccionar usuarios..."
                      noOptionsMessage={() => 'Sin usuarios'}
                      options={userOptions}
                      value={userOptions.filter((o) => field.value.includes(o.value))}
                      onChange={(selected) => field.onChange(selected.map((s) => s.value))}
                      menuPortalTarget={document.body}
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 1060 }) }}
                    />
                  )}
                />
                {errors.usuariosIds && <div className="text-danger small">{errors.usuariosIds.message as string}</div>}
              </Col>
            )}
            <Col xs={12}>
              <div className="d-flex align-items-center gap-1">
                <Form.Check type="switch" id="regla-activo" label="Nivel activo" disabled={!!regla?.esSistema} {...register('activo')} />
                <ReqHelp id="regla.activa" className="ms-0" />
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            {isEdit ? 'Guardar cambios' : 'Crear nivel'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const ReglasPage: React.FC = () => {
  const canUpdate = useHasPermission(PERMISSIONS.APPROVAL_RULES_UPDATE);
  const canDelete = useHasPermission(PERMISSIONS.APPROVAL_RULES_DELETE);

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ReglaAprobacion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<ReglaAprobacion | null>(null);

  // Approval levels per tenant are few (a handful, capped by the DTO at 100): fetch them all once and
  // filter / order client-side, same exception as RolesPage. The backend query has no search or sort params.
  const { data, isLoading, isError } = useGetReglasAprobacion({ page: 1, limit: 100 });
  const { data: rolesResponse } = useRoles({ page: 1, limit: 100 });
  const { data: usersResponse } = useUsers({ page: 1, limit: 100 });
  const deleteMutation = useDeleteReglaAprobacion();

  const reglas = useMemo(() => [...(data?.data ?? [])].sort((a, b) => a.orden - b.orden), [data]);
  const roles = rolesResponse?.data ?? [];
  const users: User[] = usersResponse?.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? reglas.filter((r) => r.nombre.toLowerCase().includes(term)) : reglas;
  }, [reglas, search]);

  // Consistency of the rules as stored (e.g. edited directly in the DB): same checks as the form.
  const globalConflicts = useMemo(() => {
    const active = reglas.filter((r) => r.activo);
    return Array.from(
      new Set(active.flatMap((r) => findReglaConflicts(r, active.filter((o) => o._id !== r._id)).map((c) => REGLA_CONFLICTO_LABELS[c.tipo])))
    );
  }, [reglas]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete._id);
      toast.success('Nivel eliminado.');
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible eliminar el nivel.'));
    } finally {
      setToDelete(null);
    }
  };

  const approverText = (r: ReglaAprobacion) => {
    if (r.aprobadorTipo === 'jefe_area') return 'Jefe del área';
    if (r.aprobadorTipo === 'rol') return `Rol: ${roles.find((x) => x._id === r.rolId)?.name ?? '—'}`;
    return `${r.usuariosIds?.length ?? 0} usuario(s)`;
  };

  const columns = [
    { key: 'orden', label: 'Orden', render: (r: ReglaAprobacion) => <span className="fw-semibold">{r.orden}</span> },
    {
      key: 'nombre',
      label: 'Nombre',
      render: (r: ReglaAprobacion) => (
        <>
          {r.nombre}
          <SistemaBadge esSistema={r.esSistema} />
        </>
      ),
    },
    {
      key: 'rango',
      label: 'Rango de monto',
      render: (r: ReglaAprobacion) => (
        <span className="text-nowrap">
          {formatMoney(r.montoDesde)} – {r.montoHasta === null ? 'sin límite' : formatMoney(r.montoHasta)}
        </span>
      ),
    },
    { key: 'aprobador', label: 'Aprobador', render: approverText },
    {
      key: 'activo',
      label: 'Estado',
      render: (r: ReglaAprobacion) => <Badge bg={r.activo ? 'success' : 'secondary'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
  ];

  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>
            Configuración de requisiciones
            <ReqHelp id="pagina.reglas" placement="bottom" />
          </h1>
          <p className="text-muted mb-0">Niveles de aprobación según el monto estimado</p>
        </Col>
        <Col className="text-end">
          <Can permission={PERMISSIONS.APPROVAL_RULES_CREATE}>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <FaPlus className="me-2" aria-hidden="true" />
              Crear nivel
            </Button>
          </Can>
        </Col>
      </Row>

      <ConfigNav />

      {(data?.warnings ?? []).length > 0 && (
        <Alert variant="warning" data-testid="reglas-warnings">
          <ul className="mb-0">
            {(data?.warnings ?? []).map((w, i) => (
              <li key={`${i}-${warningText(w)}`}>{warningText(w)}</li>
            ))}
          </ul>
        </Alert>
      )}

      {globalConflicts.length > 0 && (
        <Alert variant="warning">
          Los niveles activos tienen inconsistencias:
          <ul className="mb-0">
            {globalConflicts.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Row className="g-2 mb-3">
        <Col md={8} className="d-flex align-items-center gap-1">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch aria-hidden="true" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar nivel por nombre..."
              aria-label="Buscar niveles"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <ReqHelp id="config.buscar" className="ms-0" />
        </Col>
      </Row>

      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" aria-label="Cargando reglas" />
        </div>
      )}
      {isError && <Alert variant="danger">Error al cargar las reglas de aprobación.</Alert>}

      {data && (
        <>
          <Card className="tt-card mb-3">
            <Card.Body>
              <div className="table-responsive">
                <DataTable
                  data={filtered}
                  columns={columns}
                  actions={(row: ReglaAprobacion) => (
                    <div className="d-flex gap-1">
                      {canUpdate && (
                        <Button
                          size="sm"
                          variant="outline-warning"
                          title="Editar"
                          aria-label={`Editar ${row.nombre}`}
                          onClick={() => {
                            setEditing(row);
                            setShowForm(true);
                          }}
                        >
                          <FaEdit />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          title={row.esSistema ? SISTEMA_HINT : 'Eliminar'}
                          aria-label={`Eliminar ${row.nombre}`}
                          disabled={!!row.esSistema}
                          onClick={() => setToDelete(row)}
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </div>
                  )}
                />
              </div>
              {filtered.length === 0 && (
                <p className="text-center text-muted my-3 mb-0">
                  {search.trim() ? 'Ningún nivel coincide con la búsqueda.' : 'Aún no hay niveles de aprobación configurados.'}
                </p>
              )}
            </Card.Body>
          </Card>
          <small className="text-muted">
            Mostrando {filtered.length} de {reglas.length} niveles
          </small>
        </>
      )}

      <ReglaFormModal show={showForm} regla={editing} allReglas={reglas} users={users} onHide={() => setShowForm(false)} />

      <ConfirmModal
        show={!!toDelete}
        title="Eliminar nivel"
        body={`¿Eliminar el nivel «${toDelete?.nombre ?? ''}»? Las requisiciones en aprobación conservan sus niveles.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Container>
  );
};

export default ReglasPage;
