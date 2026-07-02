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
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { useGetPlatformTenants } from '@/hooks/usePlatformTenants';
import type { TenantStatus, PlatformTenantsListParams } from '@/types';

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

const LIMIT = 20;

const PlatformTenantsPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | ''>('');
  // Draft values — applied when user submits the search form
  const [draftSearch, setDraftSearch] = useState('');

  const queryParams: PlatformTenantsListParams = {
    page,
    limit: LIMIT,
    search: search || undefined,
    status: statusFilter || undefined,
  };

  const { data, isLoading, isError } = useGetPlatformTenants(queryParams);

  const totalPages = data?.pagination?.pages ?? 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(draftSearch);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as TenantStatus | '');
    setPage(1);
  };

  return (
    <Container fluid>
      {/* Header */}
      <Row className="align-items-center mb-4">
        <Col>
          <h4 className="mb-0">Tenants</h4>
          <small className="text-muted">Gestión de organizaciones en la plataforma</small>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            onClick={() => navigate('/admin/tenants/new')}
            aria-label="Crear nuevo tenant"
          >
            <FaPlus className="me-1" aria-hidden="true" />
            Nuevo Tenant
          </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-3 g-2">
        <Col xs={12} md={4}>
          <Form onSubmit={handleSearchSubmit}>
            <InputGroup>
              <Form.Control
                placeholder="Buscar por nombre, ID o email…"
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                aria-label="Buscar tenants"
              />
              <Button variant="outline-secondary" type="submit" aria-label="Ejecutar búsqueda">
                <FaSearch aria-hidden="true" />
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col xs={12} md={3}>
          <Form.Select
            value={statusFilter}
            onChange={handleStatusChange}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
            <option value="closed">Cerrados</option>
          </Form.Select>
        </Col>
      </Row>

      {/* States */}
      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" aria-label="Cargando tenants" />
        </div>
      )}

      {isError && (
        <Alert variant="danger">Error al cargar la lista de tenants. Intenta de nuevo.</Alert>
      )}

      {!isLoading && !isError && data && data.data.length === 0 && (
        <Alert variant="info">
          No se encontraron tenants con los filtros aplicados.
        </Alert>
      )}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <Table hover responsive aria-label="Lista de tenants">
            <thead>
              <tr>
                <th>Tenant ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((tenant) => (
                <tr
                  key={tenant._id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/tenants/${tenant._id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/admin/tenants/${tenant._id}`);
                  }}
                  aria-label={`Ver detalle de ${tenant.name}`}
                >
                  <td>
                    <code>{tenant.tenantId}</code>
                  </td>
                  <td>{tenant.name}</td>
                  <td>{tenant.email ?? '—'}</td>
                  <td>{tenant.plan ?? '—'}</td>
                  <td>
                    <Badge bg={STATUS_VARIANTS[tenant.status]}>
                      {STATUS_LABELS[tenant.status]}
                    </Badge>
                  </td>
                  <td>
                    {new Date(tenant.createdAt).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
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
            Total: {data.pagination.total} tenant{data.pagination.total !== 1 ? 's' : ''}
          </small>
        </>
      )}
    </Container>
  );
};

export default PlatformTenantsPage;
