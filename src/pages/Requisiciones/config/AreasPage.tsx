import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { FaArrowDown, FaArrowUp, FaEdit, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import DataTable from '@/components/common/DataTable';
import AppPagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import Can from '@/components/common/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { useDebounce } from '@/hooks/useDebounce';
import { useCreateArea, useDeleteArea, useGetAreas, useUpdateArea } from '@/hooks/useAreas';
import { useUsers } from '@/hooks/useUsers';
import { useHasPermission } from '@/hooks/usePermission';
import { AREA_MAX_JEFES } from '@/types/requisicion.types';
import type { Area } from '@/types/requisicion.types';
import type { User } from '@/types/user.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { refId, userRefName } from '@/utils/requisicion.utils';
import ConfigNav from './ConfigNav';
import ReqHelp from '../help/ReqHelp';

const PAGE_SIZE = 20;
const MAX_JEFES_BADGES = 3;

type SortDirection = 'asc' | 'desc';

interface UserOption {
  value: string;
  label: string;
}

const userLabel = (u: User) => u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;

interface FormValues {
  nombre: string;
  codigo: string;
  descripcion?: string;
  jefesIds: string[];
  activa: boolean;
}

const createSchema = yup.object({
  nombre: yup.string().trim().required('El nombre es obligatorio').max(120, 'Máximo 120 caracteres'),
  codigo: yup.string().trim().required('El código es obligatorio').max(30, 'Máximo 30 caracteres'),
  descripcion: yup.string().max(500, 'Máximo 500 caracteres'),
  jefesIds: yup.array().of(yup.string().required()).max(AREA_MAX_JEFES, `Máximo ${AREA_MAX_JEFES} jefes`).required(),
  activa: yup.boolean().required(),
});

// `codigo` is immutable: it is not validated (nor sent) on edit.
const editSchema = createSchema.omit(['codigo']);

interface AreaModalProps {
  show: boolean;
  area: Area | null;
  users: User[];
  onHide: () => void;
}

export const AreaFormModal: React.FC<AreaModalProps> = ({ show, area, users, onHide }) => {
  const isEdit = !!area;
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: { nombre: '', codigo: '', descripcion: '', jefesIds: [], activa: true },
  });

  useEffect(() => {
    if (!show) return;
    setServerError(null);
    reset(
      area
        ? {
            nombre: area.nombre,
            codigo: area.codigo,
            descripcion: area.descripcion ?? '',
            jefesIds: area.jefesIds.map((j) => refId(j)),
            activa: area.activa,
          }
        : { nombre: '', codigo: '', descripcion: '', jefesIds: [], activa: true }
    );
  }, [show, area, reset]);

  const options: UserOption[] = useMemo(() => {
    const known = new Map(users.map((u) => [u._id ?? '', userLabel(u)]));
    // Keep jefes that are not in the loaded page selectable/visible by their populated name.
    (area?.jefesIds ?? []).forEach((j) => {
      const id = refId(j);
      if (id && !known.has(id)) known.set(id, userRefName(j));
    });
    return Array.from(known.entries())
      .filter(([value]) => !!value)
      .map(([value, label]) => ({ value, label }));
  }, [users, area]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      if (area) {
        await updateMutation.mutateAsync({
          id: area._id,
          data: {
            nombre: values.nombre.trim(),
            descripcion: values.descripcion?.trim() ?? '',
            jefesIds: values.jefesIds,
            activa: values.activa,
          },
        });
        toast.success('Área actualizada.');
      } else {
        await createMutation.mutateAsync({
          nombre: values.nombre.trim(),
          codigo: values.codigo.trim(),
          descripcion: values.descripcion?.trim() || undefined,
          jefesIds: values.jefesIds,
          activa: values.activa,
        });
        toast.success('Área creada.');
      }
      onHide();
    } catch (err) {
      setServerError(getRequisicionErrorMessage(err, 'No fue posible guardar el área.'));
    }
  };

  const saving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Editar área' : 'Nueva área'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {serverError && <Alert variant="danger">{serverError}</Alert>}
          <Row className="g-3">
            <Col md={8}>
              <Form.Label htmlFor="area-nombre">Nombre *</Form.Label>
              <Form.Control id="area-nombre" maxLength={120} isInvalid={!!errors.nombre} {...register('nombre')} />
              <Form.Control.Feedback type="invalid">{errors.nombre?.message}</Form.Control.Feedback>
            </Col>
            <Col md={4}>
              <Form.Label htmlFor="area-codigo">Código *</Form.Label>
              <ReqHelp id="area.codigo" />
              <Form.Control id="area-codigo" maxLength={30} disabled={isEdit} isInvalid={!!errors.codigo} {...register('codigo')} />
              {isEdit && <Form.Text className="text-muted">No se puede cambiar.</Form.Text>}
              <Form.Control.Feedback type="invalid">{errors.codigo?.message}</Form.Control.Feedback>
            </Col>
            <Col xs={12}>
              <Form.Label htmlFor="area-descripcion">Descripción</Form.Label>
              <Form.Control id="area-descripcion" as="textarea" rows={2} maxLength={500} isInvalid={!!errors.descripcion} {...register('descripcion')} />
              <Form.Control.Feedback type="invalid">{errors.descripcion?.message}</Form.Control.Feedback>
            </Col>
            <Col xs={12}>
              <Form.Label htmlFor="area-jefes">Jefes del área</Form.Label>
              <ReqHelp id="area.jefes" />
              <Controller
                control={control}
                name="jefesIds"
                render={({ field }) => (
                  <Select<UserOption, true>
                    inputId="area-jefes"
                    isMulti
                    classNamePrefix="react-select"
                    placeholder="Seleccionar usuarios..."
                    noOptionsMessage={() => 'Sin usuarios'}
                    options={options}
                    value={options.filter((o) => field.value.includes(o.value))}
                    onChange={(selected) => field.onChange(selected.map((s) => s.value))}
                    menuPortalTarget={document.body}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 1060 }) }}
                  />
                )}
              />
              <Form.Text className="text-muted">
                Aprueban el nivel «Jefe de área» de las requisiciones del área (máximo {AREA_MAX_JEFES}).
              </Form.Text>
              {errors.jefesIds && <div className="text-danger small">{errors.jefesIds.message}</div>}
            </Col>
            <Col xs={12}>
              <div className="d-flex align-items-center gap-1">
                <Form.Check type="switch" id="area-activa" label="Área activa" {...register('activa')} />
                <ReqHelp id="area.activa" className="ms-0" />
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
            {isEdit ? 'Guardar cambios' : 'Crear área'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const AreasPage: React.FC = () => {
  const canUpdate = useHasPermission(PERMISSIONS.AREAS_UPDATE);
  const canDelete = useHasPermission(PERMISSIONS.AREAS_DELETE);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editing, setEditing] = useState<Area | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<Area | null>(null);

  const debouncedSearch = useDebounce(searchInput, 300);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortDirection]);

  const { data, isLoading, isFetching, isError } = useGetAreas({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    sortBy: 'nombre',
    order: sortDirection,
  });
  const { data: usersResponse } = useUsers({ page: 1, limit: 100 });
  const deleteMutation = useDeleteArea();

  const rows: Area[] = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const totalCount = data?.pagination?.total ?? rows.length;
  const users: User[] = usersResponse?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (area: Area) => {
    setEditing(area);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete._id);
      toast.success('Área eliminada.');
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible eliminar el área.'));
    } finally {
      setToDelete(null);
    }
  };

  const columns = [
    { key: 'codigo', label: 'Código', render: (a: Area) => <span className="fw-semibold">{a.codigo}</span> },
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'jefes',
      label: 'Jefes',
      render: (a: Area) => {
        if (a.jefesIds.length === 0) return <span className="text-muted">Sin jefes</span>;
        const shown = a.jefesIds.slice(0, MAX_JEFES_BADGES);
        const extra = a.jefesIds.length - shown.length;
        return (
          <>
            {shown.map((j) => (
              <Badge key={refId(j)} bg="info" className="me-1">
                {typeof j === 'string' ? userLabelById(users, j) : userRefName(j)}
              </Badge>
            ))}
            {extra > 0 && <span className="text-muted small">+{extra} más</span>}
          </>
        );
      },
    },
    {
      key: 'activa',
      label: 'Estado',
      render: (a: Area) => <Badge bg={a.activa ? 'success' : 'secondary'}>{a.activa ? 'Activa' : 'Inactiva'}</Badge>,
    },
  ];

  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>
            Configuración de requisiciones
            <ReqHelp id="pagina.areas" placement="bottom" />
          </h1>
          <p className="text-muted mb-0">Áreas de la organización y sus jefes</p>
        </Col>
        <Col className="text-end">
          <Can permission={PERMISSIONS.AREAS_CREATE}>
            <Button variant="primary" onClick={openCreate}>
              <FaPlus className="me-2" aria-hidden="true" />
              Crear área
            </Button>
          </Can>
        </Col>
      </Row>

      <ConfigNav />

      <Row className="g-2 mb-3">
        <Col md={8} className="d-flex align-items-center gap-1">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch aria-hidden="true" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar área por nombre..."
              aria-label="Buscar áreas"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </InputGroup>
          <ReqHelp id="config.buscar" className="ms-0" />
        </Col>
        <Col md={4} className="text-md-end d-flex align-items-center justify-content-md-end gap-1">
          <Button variant="outline-secondary" onClick={() => setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'))}>
            Ordenar A–Z {sortDirection === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />}
          </Button>
          <ReqHelp id="config.orden" className="ms-0" />
        </Col>
      </Row>

      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" aria-label="Cargando áreas" />
        </div>
      )}
      {isError && <Alert variant="danger">Error al cargar las áreas.</Alert>}

      {data && (
        <>
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
                  actions={(row: Area) => (
                    <div className="d-flex gap-1">
                      {canUpdate && (
                        <Button size="sm" variant="outline-warning" title="Editar" aria-label={`Editar ${row.nombre}`} onClick={() => openEdit(row)}>
                          <FaEdit />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="outline-danger" title="Eliminar" aria-label={`Eliminar ${row.nombre}`} onClick={() => setToDelete(row)}>
                          <FaTrash />
                        </Button>
                      )}
                    </div>
                  )}
                />
              </div>
              {rows.length === 0 && (
                <p className="text-center text-muted my-3 mb-0">
                  {debouncedSearch.trim() ? 'Ninguna área coincide con la búsqueda.' : 'Aún no hay áreas configuradas.'}
                </p>
              )}
            </Card.Body>
          </Card>
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Mostrando {rows.length} de {totalCount} áreas
            </small>
            <AppPagination page={page} pages={totalPages} onChange={setPage} />
          </div>
        </>
      )}

      <AreaFormModal show={showForm} area={editing} users={users} onHide={() => setShowForm(false)} />

      <ConfirmModal
        show={!!toDelete}
        title="Eliminar área"
        body={`¿Eliminar el área «${toDelete?.nombre ?? ''}»? Si está en uso solo podrás desactivarla.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Container>
  );
};

function userLabelById(users: User[], id: string): string {
  const found = users.find((u) => u._id === id);
  return found ? userLabel(found) : 'Usuario';
}

export default AreasPage;
