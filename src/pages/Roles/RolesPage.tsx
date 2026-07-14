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
import { FaArrowUp, FaArrowDown, FaSearch } from 'react-icons/fa';
import DataTable from '@/components/common/DataTable';
import RoleFormModal from '@/components/roles/RoleFormModal';
import RolePermissionsModal from '@/components/roles/RolePermissionsModal';
import { useCreateRole, useDeleteRole, usePermissions, useRoles, useUpdateRole } from '@/hooks/useRoles';
import { Role } from '@/types/role.types';
import { formatPermission } from '@/constants/permissionLabels';

const PAGE_SIZE = 20;
const MAX_PERMISSION_BADGES = 18;

type SortDirection = 'asc' | 'desc';

const RolesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [permissionsPreview, setPermissionsPreview] = useState<Role | null>(null);

  // Fetch a wide page (limit 100) once and filter/sort/paginate client-side.
  // Role catalogs are always small (typically < 20 per tenant) so this avoids
  // an extra roundtrip on every keystroke.
  const { data: rolesResponse, isLoading, error } = useRoles({ page: 1, limit: 100 });
  const { data: permissionsResponse } = usePermissions();

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const allRoles = rolesResponse?.data || [];
  const catalog = permissionsResponse?.data;

  const filteredSortedRoles = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? allRoles.filter((role) => role.name.toLowerCase().includes(term))
      : allRoles;
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [allRoles, search, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredSortedRoles.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRoles = useMemo(
    () => filteredSortedRoles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredSortedRoles, currentPage],
  );

  const openCreateModal = () => {
    setEditingRole(null);
    setShowFormModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setShowFormModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirma eliminar este rol?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSubmit = async (values: {
    name: string;
    description?: string;
    permissions: string[];
    isDefault?: boolean;
  }) => {
    if (editingRole) {
      await updateMutation.mutateAsync({ id: editingRole._id, data: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setShowFormModal(false);
    setEditingRole(null);
  };

  const toggleSort = () => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Roles</h1>
          <p className="text-muted mb-0">Administración de roles y permisos por tenant</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={openCreateModal}>
            Crear Rol
          </Button>
        </Col>
      </Row>

      <Row className="g-2 mb-3">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar rol por nombre..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </InputGroup>
        </Col>
        <Col md={4} className="text-md-end">
          <Button variant="outline-secondary" onClick={toggleSort} className="w-100 w-md-auto">
            Ordenar A–Z {sortDirection === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />}
          </Button>
        </Col>
      </Row>

      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {Boolean(error) && <Alert variant="danger">No fue posible cargar los roles.</Alert>}

      {rolesResponse && (
        <>
          <Card className="tt-card mb-3">
            <Card.Body>
              <DataTable
                data={pagedRoles}
                columns={[
                  { key: 'name', label: 'Nombre' },
                  { key: 'description', label: 'Descripción' },
                  {
                    key: 'permissions',
                    label: 'Permisos',
                    render: (row: Role) => {
                      const shown = row.permissions.slice(0, MAX_PERMISSION_BADGES);
                      const hidden = row.permissions.length - shown.length;
                      return (
                        <div className="d-flex flex-wrap gap-1 align-items-center">
                          {shown.map((permission) => {
                            const { short, id } = formatPermission(permission);
                            return (
                              <Badge key={permission} bg="secondary" pill title={id}>
                                {short}
                              </Badge>
                            );
                          })}
                          {hidden > 0 && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 ms-1"
                              onClick={() => setPermissionsPreview(row)}
                            >
                              +{hidden} más — ver
                            </Button>
                          )}
                        </div>
                      );
                    },
                  },
                ]}
                actions={(row: Role) => (
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => openEditModal(row)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(row._id)}>
                      Eliminar
                    </Button>
                  </div>
                )}
              />
              {filteredSortedRoles.length === 0 && !isLoading && (
                <p className="text-center text-muted my-3 mb-0">
                  {search ? 'Ningún rol coincide con la búsqueda.' : 'Aún no hay roles configurados.'}
                </p>
              )}
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Mostrando {pagedRoles.length} de {filteredSortedRoles.length} roles
            </small>
            {totalPages > 1 && (
              <Pagination className="mb-0">
                <Pagination.Prev disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <Pagination.Item
                    key={pageNumber}
                    active={pageNumber === currentPage}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </Pagination>
            )}
          </div>
        </>
      )}

      <RoleFormModal
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        onSubmit={handleSubmit}
        role={editingRole}
        permissions={catalog}
        isSubmitting={createMutation.isLoading || updateMutation.isLoading}
      />

      <RolePermissionsModal
        show={Boolean(permissionsPreview)}
        onHide={() => setPermissionsPreview(null)}
        role={permissionsPreview}
        catalog={catalog}
      />
    </Container>
  );
};

export default RolesPage;
