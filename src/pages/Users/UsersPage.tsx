import React, { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Pagination,
  Row,
  Spinner,
} from 'react-bootstrap';
import { FaArrowDown, FaArrowUp, FaEdit, FaEye, FaSearch, FaTrash } from 'react-icons/fa';
import { useUsers, useDeleteUser } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { useDebounce } from '@/hooks/useDebounce';
import DataTable from '@/components/common/DataTable';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/user.types';

const PAGE_SIZE = 20;

type SortDirection = 'asc' | 'desc';

function computeAge(fechaNacimiento?: string | null): string {
  if (!fechaNacimiento) return '—';
  const born = new Date(fechaNacimiento);
  if (Number.isNaN(born.getTime())) return '—';
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) years -= 1;
  return String(years);
}

function computeAntiguedad(fechaIngreso?: string | null): string {
  if (!fechaIngreso) return '—';
  const start = new Date(fechaIngreso);
  if (Number.isNaN(start.getTime())) return '—';
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) return '—';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mes${rest === 1 ? '' : 'es'}`;
  return `${years} año${years === 1 ? '' : 's'}${rest > 0 ? ` y ${rest} mes${rest === 1 ? '' : 'es'}` : ''}`;
}

function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined || value === 0) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const deleteMutation = useDeleteUser();

  const [page, setPage] = useState(1);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [filterRoleId, setFilterRoleId] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Debounce free-text inputs so the API isn't hit on every keystroke.
  // 300ms gives responsive feedback without spamming the server.
  const debouncedName = useDebounce(nameInput, 300);
  const debouncedEmail = useDebounce(emailInput, 300);

  // Reset to page 1 whenever a filter that changes the result set changes.
  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      name: debouncedName || undefined,
      email: debouncedEmail || undefined,
      roleId: filterRoleId || undefined,
      sortBy: 'firstName',
      order: sortDirection,
    }),
    [page, debouncedName, debouncedEmail, filterRoleId, sortDirection],
  );

  const { data, isLoading, isFetching, error } = useUsers(queryParams);
  const { data: rolesResponse } = useRoles({ page: 1, limit: 100 });

  const roles = rolesResponse?.data || [];
  const rolesById = useMemo(() => new Map(roles.map((r) => [r._id, r])), [roles]);

  const users: User[] = data?.data || [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirma eliminar este usuario?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const toggleSort = () => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));

  const columns = [
    { key: 'firstName', label: 'Nombre', render: (row: User) => row.firstName || '—' },
    { key: 'lastName', label: 'Apellido', render: (row: User) => row.lastName || '—' },
    { key: 'phone', label: 'Teléfono', render: (row: User) => row.phone || '—' },
    { key: 'edad', label: 'Edad', render: (row: User) => computeAge(row.fechaNacimiento) },
    { key: 'email', label: 'Email', render: (row: User) => row.email || '—' },
    {
      key: 'rol',
      label: 'Rol',
      render: (row: User) => {
        const role = row.roleId ? rolesById.get(row.roleId) : null;
        return role ? <Badge bg="info">{role.name}</Badge> : <Badge bg="secondary">{row.role || 'Sin rol'}</Badge>;
      },
    },
    {
      key: 'fechaIngreso',
      label: 'Fecha ingreso',
      render: (row: User) => (row.fechaIngreso ? new Date(row.fechaIngreso).toLocaleDateString('es-CO') : '—'),
    },
    { key: 'antiguedad', label: 'Antigüedad', render: (row: User) => computeAntiguedad(row.fechaIngreso) },
    {
      key: 'salario',
      label: 'Salario',
      render: (row: User) => <span className="text-nowrap">{formatCurrency(row.salario)}</span>,
    },
  ];

  const totalPages = Math.max(1, pagination?.pages || 1);
  const hasActiveFilter = Boolean(debouncedName || debouncedEmail || filterRoleId);

  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Usuarios</h1>
          <p className="text-muted mb-0">Gestión de personal y accesos por tenant</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/users/new')}>Crear Usuario</Button>
        </Col>
      </Row>

      <Row className="g-2 mb-3">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por nombre..."
              value={nameInput}
              onChange={(event) => { setNameInput(event.target.value); setPage(1); }}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por email..."
              value={emailInput}
              onChange={(event) => { setEmailInput(event.target.value); setPage(1); }}
            />
          </InputGroup>
        </Col>
        <Col md={2}>
          <Form.Select
            value={filterRoleId}
            onChange={(event) => { setFilterRoleId(event.target.value); setPage(1); }}
          >
            <option value="">Todos los roles</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>{role.name}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button variant="outline-secondary" onClick={toggleSort} className="w-100">
            Ordenar A–Z {sortDirection === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />}
          </Button>
        </Col>
      </Row>

      {isLoading && <div className="d-flex justify-content-center my-4"><Spinner animation="border" variant="primary" /></div>}
      {Boolean(error) && <Alert variant="danger">Error al cargar usuarios.</Alert>}

      {data && (
        <>
          <Card className="tt-card mb-3 position-relative">
            {isFetching && !isLoading && (
              <div className="position-absolute top-0 end-0 m-2">
                <Spinner size="sm" animation="border" variant="secondary" />
              </div>
            )}
            <Card.Body>
              <DataTable
                data={users}
                columns={columns}
                actions={(row: User) => (
                  <div className="d-flex gap-1">
                    <Button size="sm" variant="outline-primary" onClick={() => navigate(`/users/${row._id}`)} title="Ver">
                      <FaEye />
                    </Button>
                    <Button size="sm" variant="outline-warning" onClick={() => navigate(`/users/${row._id}/edit`)} title="Editar">
                      <FaEdit />
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => row._id && handleDelete(row._id)} title="Eliminar">
                      <FaTrash />
                    </Button>
                  </div>
                )}
              />
              {users.length === 0 && !isLoading && (
                <p className="text-center text-muted my-3 mb-0">
                  {hasActiveFilter ? 'Ningún usuario coincide con los filtros.' : 'Aún no hay usuarios registrados.'}
                </p>
              )}
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Mostrando {users.length} de {pagination?.total ?? users.length} usuarios
            </small>
            {totalPages > 1 && (
              <Pagination className="mb-0">
                <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <Pagination.Item
                    key={pageNumber}
                    active={pageNumber === page}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </Pagination>
            )}
          </div>
        </>
      )}
    </Container>
  );
};

export default UsersPage;
