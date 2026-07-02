import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
  Form,
  Breadcrumb,
} from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useGetPlatformTenant,
  useSuspendTenant,
  useReactivateTenant,
  useSoftDeleteTenant,
  useUpdateTenantMetadata,
} from '@/hooks/usePlatformTenants';
import type { TenantStatus, UpdateTenantMetadataInput } from '@/types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
const STATUS_LABELS: Record<TenantStatus, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  closed: 'Cerrado',
};
const STATUS_VARIANTS: Record<TenantStatus, string> = {
  active: 'success',
  suspended: 'warning',
  closed: 'secondary',
};

// ---------------------------------------------------------------------------
// Edit metadata form schema
// ---------------------------------------------------------------------------
const editSchema = yup.object({
  name: yup.string().required('El nombre es requerido').min(2).max(200),
  slogan: yup.string().optional(),
  direccion: yup.string().optional(),
  email: yup.string().email('Email inválido').optional(),
  telefono: yup.string().optional(),
  nit: yup.string().optional(),
  ciudad: yup.string().optional(),
  departamento: yup.string().optional(),
  pais: yup.string().optional(),
  website: yup
    .string()
    .transform((val: string) => (val === '' ? undefined : val))
    .url('URL inválida')
    .optional(),
});

type EditFormData = yup.InferType<typeof editSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const PlatformTenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useGetPlatformTenant(id);
  const suspendMut = useSuspendTenant();
  const reactivateMut = useReactivateTenant();
  const deleteMut = useSoftDeleteTenant();
  const updateMut = useUpdateTenantMetadata();

  // Suspend modal state
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLogoFile, setEditLogoFile] = useState<File | undefined>(undefined);

  const {
    register: regEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditFormData>({
    resolver: yupResolver(editSchema),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleOpenEdit = () => {
    if (!data) return;
    const t = data.tenant;
    resetEdit({
      name: t.name,
      slogan: t.slogan ?? '',
      direccion: t.direccion ?? '',
      email: t.email ?? '',
      telefono: t.telefono ?? '',
      nit: t.nit ?? '',
      ciudad: t.ciudad ?? '',
      departamento: t.departamento ?? '',
      pais: t.pais ?? '',
      website: t.website ?? '',
    });
    setEditLogoFile(undefined);
    setShowEditModal(true);
  };

  const handleEditSave = (formData: EditFormData) => {
    if (!id) return;
    const input: UpdateTenantMetadataInput = {
      name: formData.name,
      slogan: formData.slogan,
      direccion: formData.direccion,
      email: formData.email,
      telefono: formData.telefono,
      nit: formData.nit,
      ciudad: formData.ciudad,
      departamento: formData.departamento,
      pais: formData.pais,
      website: formData.website,
    };
    updateMut.mutate(
      { id, input, logoFile: editLogoFile },
      { onSuccess: () => setShowEditModal(false) }
    );
  };

  const handleSuspend = () => {
    if (!id || !suspendReason.trim()) return;
    suspendMut.mutate(
      { id, input: { reason: suspendReason.trim() } },
      {
        onSuccess: () => {
          setShowSuspendModal(false);
          setSuspendReason('');
        },
      }
    );
  };

  const handleReactivate = () => {
    if (!id) return;
    reactivateMut.mutate(id);
  };

  const handleDelete = () => {
    if (!id || !data) return;
    if (deleteConfirmText !== data.tenant.tenantId) return;
    deleteMut.mutate(id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        navigate('/admin/tenants');
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" aria-label="Cargando detalle del tenant" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="danger">
        No se pudo cargar la información del tenant.{' '}
        <Link to="/admin/tenants">Volver a la lista</Link>
      </Alert>
    );
  }

  const { tenant, counters } = data;
  const isActive = tenant.status === 'active';
  const isSuspended = tenant.status === 'suspended';

  return (
    <Container fluid>
      {/* Breadcrumb */}
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/admin/tenants' }}>
          Tenants
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{tenant.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Page header */}
      <Row className="align-items-center mb-4">
        <Col>
          <h4 className="mb-1">
            {tenant.name}{' '}
            <Badge bg={STATUS_VARIANTS[tenant.status]} className="ms-2 fs-6">
              {STATUS_LABELS[tenant.status]}
            </Badge>
          </h4>
          <code className="text-muted">{tenant.tenantId}</code>
        </Col>
        <Col xs="auto" className="d-flex gap-2 flex-wrap">
          <Button variant="outline-primary" size="sm" onClick={handleOpenEdit}>
            Editar
          </Button>
          {isActive && (
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => setShowSuspendModal(true)}
            >
              Suspender
            </Button>
          )}
          {isSuspended && (
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleReactivate}
              disabled={reactivateMut.isLoading}
            >
              {reactivateMut.isLoading ? 'Reactivando…' : 'Reactivar'}
            </Button>
          )}
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            Eliminar
          </Button>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Metadata card */}
        <Col md={8}>
          <Card>
            <Card.Header>Información del tenant</Card.Header>
            <Card.Body>
              <Row className="g-3">
                {[
                  ['Nombre', tenant.name],
                  ['Slogan', tenant.slogan],
                  ['NIT', tenant.nit],
                  ['Email', tenant.email],
                  ['Teléfono', tenant.telefono],
                  ['Dirección', tenant.direccion],
                  ['Ciudad', tenant.ciudad],
                  ['Departamento', tenant.departamento],
                  ['País', tenant.pais],
                  ['Sitio web', tenant.website],
                  ['Plan', tenant.plan],
                  [
                    'Creado',
                    new Date(tenant.createdAt).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }),
                  ],
                ].map(([label, value]) =>
                  value ? (
                    <Col xs={12} sm={6} key={label as string}>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {label}
                      </div>
                      <div>{value}</div>
                    </Col>
                  ) : null
                )}
              </Row>
              {tenant.logoUrl && (
                <div className="mt-3">
                  <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                    Logo
                  </div>
                  <img
                    src={tenant.logoUrl}
                    alt={`Logo de ${tenant.name}`}
                    style={{ maxHeight: '80px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Counters card */}
        <Col md={4}>
          <Card>
            <Card.Header>Contadores</Card.Header>
            <Card.Body>
              {[
                { label: 'Usuarios', value: counters.usersCount },
                { label: 'Clientes', value: counters.customersCount },
                { label: 'Equipos', value: counters.equiposCount },
                { label: 'OTs abiertas', value: counters.otsAbiertas },
              ].map((c) => (
                <div
                  key={c.label}
                  className="d-flex justify-content-between align-items-center py-2 border-bottom"
                >
                  <span className="text-muted">{c.label}</span>
                  <strong>{c.value}</strong>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* Edit modal                                                          */}
      {/* ------------------------------------------------------------------ */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Editar metadata del tenant</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit(handleEditSave)}>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control {...regEdit('name')} isInvalid={!!editErrors.name} />
                  <Form.Control.Feedback type="invalid">
                    {editErrors.name?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Slogan</Form.Label>
                  <Form.Control {...regEdit('slogan')} />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    {...regEdit('email')}
                    isInvalid={!!editErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {editErrors.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control {...regEdit('telefono')} />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>NIT</Form.Label>
                  <Form.Control {...regEdit('nit')} />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control {...regEdit('direccion')} />
                </Form.Group>
              </Col>
              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label>Ciudad</Form.Label>
                  <Form.Control {...regEdit('ciudad')} />
                </Form.Group>
              </Col>
              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label>Departamento</Form.Label>
                  <Form.Control {...regEdit('departamento')} />
                </Form.Group>
              </Col>
              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label>País</Form.Label>
                  <Form.Control {...regEdit('pais')} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Sitio web</Form.Label>
                  <Form.Control
                    type="url"
                    {...regEdit('website')}
                    isInvalid={!!editErrors.website}
                    placeholder="https://"
                  />
                  <Form.Control.Feedback type="invalid">
                    {editErrors.website?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Logo (opcional)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditLogoFile(e.target.files?.[0])
                    }
                    aria-label="Subir nuevo logo"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={updateMut.isLoading}>
              {updateMut.isLoading ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Suspend modal                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        show={showSuspendModal}
        onHide={() => {
          setShowSuspendModal(false);
          setSuspendReason('');
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Suspender tenant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Vas a suspender <strong>{tenant.name}</strong>. Sus usuarios no podrán acceder
            mientras el enforcement de estado esté activo.
          </p>
          <Form.Group>
            <Form.Label>Motivo de suspensión *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Describe el motivo…"
              aria-required="true"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowSuspendModal(false);
              setSuspendReason('');
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="warning"
            onClick={handleSuspend}
            disabled={!suspendReason.trim() || suspendMut.isLoading}
          >
            {suspendMut.isLoading ? 'Suspendiendo…' : 'Confirmar suspensión'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Delete modal — two-step: type tenantId to confirm                  */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Eliminar tenant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            Esta acción es <strong>irreversible</strong> desde la UI. El tenant quedará marcado
            como eliminado y sus usuarios no podrán acceder.
          </Alert>
          <p>
            Para confirmar, escribe el ID del tenant:{' '}
            <code>{tenant.tenantId}</code>
          </p>
          <Form.Control
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={tenant.tenantId}
            aria-label={`Escribir ${tenant.tenantId} para confirmar eliminación`}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmText('');
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleteConfirmText !== tenant.tenantId || deleteMut.isLoading}
          >
            {deleteMut.isLoading ? 'Eliminando…' : 'Confirmar eliminación'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PlatformTenantDetailPage;
