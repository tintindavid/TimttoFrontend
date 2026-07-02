import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Form,
  Spinner,
  Alert,
  Badge,
  Pagination,
  InputGroup,
} from 'react-bootstrap';
import { FaSearch, FaKey } from 'react-icons/fa';
import { useGetPlatformUsers } from '@/hooks/usePlatformUsers';
import type { PlatformUser, PlatformUsersListParams, UserRole } from '@/types';
import UserPasswordResetModal from './UserPasswordResetModal';

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  technician: 'Técnico',
  user: 'Usuario',
};

const ROLE_VARIANTS: Record<UserRole, string> = {
  superadmin: 'danger',
  admin: 'primary',
  technician: 'info',
  user: 'secondary',
};

const LIMIT = 20;

const PlatformUsersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [tenantIdFilter, setTenantIdFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [emailFilter, setEmailFilter] = useState('');

  // Draft values — applied when the user submits the search form
  const [draftTenantId, setDraftTenantId] = useState('');
  const [draftEmail, setDraftEmail] = useState('');

  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  const queryParams: PlatformUsersListParams = {
    page,
    limit: LIMIT,
    tenantId: tenantIdFilter || undefined,
    role: roleFilter || undefined,
    email: emailFilter || undefined,
  };

  const { data, isLoading, isError } = useGetPlatformUsers(queryParams);

  const totalPages = data?.pagination?.pages ?? 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTenantIdFilter(draftTenantId);
    setEmailFilter(draftEmail);
    setPage(1);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value as UserRole | '');
    setPage(1);
  };

  return (
    <Container fluid>
      {/* Header */}
      <Row className="align-items-center mb-4">
        <Col>
          <h4 className="mb-0">Usuarios de la plataforma</h4>
          <small className="text-muted">Gestión cross-tenant de usuarios</small>
        </Col>
      </Row>

      {/* Filters */}
      <Form onSubmit={handleSearchSubmit}>
        <Row className="mb-3 g-2">
          <Col xs={12} md={3}>
            <InputGroup>
              <Form.Control
                placeholder="Tenant ID"
                value={draftTenantId}
                onChange={(e) => setDraftTenantId(e.target.value)}
                aria-label="Filtrar por Tenant ID"
              />
            </InputGroup>
          </Col>
          <Col xs={12} md={3}>
            <InputGroup>
              <Form.Control
                placeholder="Email"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                aria-label="Filtrar por email"
              />
            </InputGroup>
          </Col>
          <Col xs={12} md={3}>
            <Form.Select
              value={roleFilter}
              onChange={handleRoleChange}
              aria-label="Filtrar por rol"
            >
              <option value="">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="technician">Técnico</option>
              <option value="user">Usuario</option>
            </Form.Select>
          </Col>
          <Col xs={12} md={2}>
            <Button
              type="submit"
              variant="outline-secondary"
              className="w-100"
              aria-label="Ejecutar búsqueda"
            >
              <FaSearch aria-hidden="true" className="me-1" />
              Buscar
            </Button>
          </Col>
        </Row>
      </Form>

      {/* States */}
      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" aria-label="Cargando usuarios" />
        </div>
      )}

      {isError && (
        <Alert variant="danger">Error al cargar la lista de usuarios. Intenta de nuevo.</Alert>
      )}

      {!isLoading && !isError && data && data.data.length === 0 && (
        <Alert variant="info">No se encontraron usuarios con los filtros aplicados.</Alert>
      )}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <Table hover responsive aria-label="Lista de usuarios de la plataforma">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Tenant ID</th>
                <th>Rol</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((u) => (
                <tr key={u._id}>
                  <td>{u.email}</td>
                  <td>{u.fullName ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—'}</td>
                  <td>
                    <code>{u.tenantId}</code>
                  </td>
                  <td>
                    <Badge bg={ROLE_VARIANTS[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    {u.mustChangePassword && (
                      <Badge bg="warning" text="dark" className="ms-1">
                        Cambio requerido
                      </Badge>
                    )}
                  </td>
                  <td>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => setSelectedUser(u)}
                      aria-label={`Resetear contraseña de ${u.email}`}
                    >
                      <FaKey aria-hidden="true" className="me-1" />
                      Reset Password
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.Prev
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Página anterior"
                />
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Pagination.Item
                    key={p}
                    active={p === page}
                    onClick={() => setPage(p)}
                    aria-label={`Página ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Página siguiente"
                />
              </Pagination>
            </div>
          )}

          <small className="text-muted d-block text-center">
            Total: {data.pagination.total} usuario{data.pagination.total !== 1 ? 's' : ''}
          </small>
        </>
      )}

      {/* Reset password modal */}
      <UserPasswordResetModal
        user={selectedUser}
        onHide={() => setSelectedUser(null)}
      />
    </Container>
  );
};

export default PlatformUsersPage;
