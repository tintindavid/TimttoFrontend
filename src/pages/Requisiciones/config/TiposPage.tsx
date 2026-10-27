import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { FaArrowDown, FaArrowUp, FaEdit, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import DataTable from '@/components/common/DataTable';
import AppPagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import Can from '@/components/common/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { useDebounce } from '@/hooks/useDebounce';
import { useHasPermission } from '@/hooks/usePermission';
import {
  useCreateTipoRequisicion,
  useDeleteTipoRequisicion,
  useGetTiposRequisicion,
  useUpdateTipoRequisicion,
} from '@/hooks/useTiposRequisicion';
import type { TipoRequisicion } from '@/types/requisicion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import ConfigNav from './ConfigNav';
import ReqHelp from '../help/ReqHelp';

const PAGE_SIZE = 20;

type SortDirection = 'asc' | 'desc';

interface FormValues {
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
}

const createSchema = yup.object({
  nombre: yup.string().trim().required('El nombre es obligatorio').max(120, 'Máximo 120 caracteres'),
  codigo: yup.string().trim().required('El código es obligatorio').max(30, 'Máximo 30 caracteres'),
  descripcion: yup.string().max(500, 'Máximo 500 caracteres'),
  activo: yup.boolean().required(),
});
// `codigo` is immutable: it is not validated (nor sent) on edit.
const editSchema = createSchema.omit(['codigo']);

interface ModalProps {
  show: boolean;
  tipo: TipoRequisicion | null;
  onHide: () => void;
}

export const TipoFormModal: React.FC<ModalProps> = ({ show, tipo, onHide }) => {
  const isEdit = !!tipo;
  const createMutation = useCreateTipoRequisicion();
  const updateMutation = useUpdateTipoRequisicion();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: { nombre: '', codigo: '', descripcion: '', activo: true },
  });

  useEffect(() => {
    if (!show) return;
    setServerError(null);
    reset(
      tipo
        ? { nombre: tipo.nombre, codigo: tipo.codigo, descripcion: tipo.descripcion ?? '', activo: tipo.activo }
        : { nombre: '', codigo: '', descripcion: '', activo: true }
    );
  }, [show, tipo, reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      if (tipo) {
        await updateMutation.mutateAsync({
          id: tipo._id,
          data: { nombre: values.nombre.trim(), descripcion: values.descripcion?.trim() ?? '', activo: values.activo },
        });
        toast.success('Tipo actualizado.');
      } else {
        await createMutation.mutateAsync({
          nombre: values.nombre.trim(),
          codigo: values.codigo.trim(),
          descripcion: values.descripcion?.trim() || undefined,
          activo: values.activo,
        });
        toast.success('Tipo creado.');
      }
      onHide();
    } catch (err) {
      setServerError(getRequisicionErrorMessage(err, 'No fue posible guardar el tipo.'));
    }
  };

  const saving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Editar tipo' : 'Nuevo tipo de requisición'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {serverError && <Alert variant="danger">{serverError}</Alert>}
          <Row className="g-3">
            <Col md={8}>
              <Form.Label htmlFor="tipo-nombre">Nombre *</Form.Label>
              <Form.Control id="tipo-nombre" maxLength={120} isInvalid={!!errors.nombre} {...register('nombre')} />
              <Form.Control.Feedback type="invalid">{errors.nombre?.message}</Form.Control.Feedback>
            </Col>
            <Col md={4}>
              <Form.Label htmlFor="tipo-codigo">Código *</Form.Label>
              <ReqHelp id="tipo.codigo" />
              <Form.Control id="tipo-codigo" maxLength={30} disabled={isEdit} isInvalid={!!errors.codigo} {...register('codigo')} />
              {isEdit && <Form.Text className="text-muted">No se puede cambiar.</Form.Text>}
              <Form.Control.Feedback type="invalid">{errors.codigo?.message}</Form.Control.Feedback>
            </Col>
            <Col xs={12}>
              <Form.Label htmlFor="tipo-descripcion">Descripción</Form.Label>
              <Form.Control id="tipo-descripcion" as="textarea" rows={2} maxLength={500} isInvalid={!!errors.descripcion} {...register('descripcion')} />
              <Form.Control.Feedback type="invalid">{errors.descripcion?.message}</Form.Control.Feedback>
            </Col>
            <Col xs={12}>
              <div className="d-flex align-items-center gap-1">
                <Form.Check type="switch" id="tipo-activo" label="Tipo activo" {...register('activo')} />
                <ReqHelp id="tipo.activo" className="ms-0" />
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
            {isEdit ? 'Guardar cambios' : 'Crear tipo'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const TiposPage: React.FC = () => {
  const canUpdate = useHasPermission(PERMISSIONS.REQUEST_TYPES_UPDATE);
  const canDelete = useHasPermission(PERMISSIONS.REQUEST_TYPES_DELETE);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editing, setEditing] = useState<TipoRequisicion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<TipoRequisicion | null>(null);

  const debouncedSearch = useDebounce(searchInput, 300);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortDirection]);

  const { data, isLoading, isFetching, isError } = useGetTiposRequisicion({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    sortBy: 'nombre',
    order: sortDirection,
  });
  const deleteMutation = useDeleteTipoRequisicion();

  const rows: TipoRequisicion[] = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const totalCount = data?.pagination?.total ?? rows.length;

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete._id);
      toast.success('Tipo eliminado.');
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible eliminar el tipo.'));
    } finally {
      setToDelete(null);
    }
  };

  const columns = [
    { key: 'codigo', label: 'Código', render: (t: TipoRequisicion) => <span className="fw-semibold">{t.codigo}</span> },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción', render: (t: TipoRequisicion) => t.descripcion || '—' },
    {
      key: 'activo',
      label: 'Estado',
      render: (t: TipoRequisicion) => <Badge bg={t.activo ? 'success' : 'secondary'}>{t.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
  ];

  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>
            Configuración de requisiciones
            <ReqHelp id="pagina.tipos" placement="bottom" />
          </h1>
          <p className="text-muted mb-0">Tipos de requisición disponibles</p>
        </Col>
        <Col className="text-end">
          <Can permission={PERMISSIONS.REQUEST_TYPES_CREATE}>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <FaPlus className="me-2" aria-hidden="true" />
              Crear tipo
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
              placeholder="Buscar tipo por nombre..."
              aria-label="Buscar tipos"
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
          <Spinner animation="border" variant="primary" aria-label="Cargando tipos" />
        </div>
      )}
      {isError && <Alert variant="danger">Error al cargar los tipos.</Alert>}

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
                  actions={(row: TipoRequisicion) => (
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
                  {debouncedSearch.trim() ? 'Ningún tipo coincide con la búsqueda.' : 'Aún no hay tipos configurados.'}
                </p>
              )}
            </Card.Body>
          </Card>
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Mostrando {rows.length} de {totalCount} tipos
            </small>
            <AppPagination page={page} pages={totalPages} onChange={setPage} />
          </div>
        </>
      )}

      <TipoFormModal show={showForm} tipo={editing} onHide={() => setShowForm(false)} />

      <ConfirmModal
        show={!!toDelete}
        title="Eliminar tipo"
        body={`¿Eliminar el tipo «${toDelete?.nombre ?? ''}»? Si está en uso solo podrás desactivarlo.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Container>
  );
};

export default TiposPage;
