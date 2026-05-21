import React, { useState } from 'react';
import { Alert, Button, Card, Col, Container, Pagination, Row, Spinner, Badge } from 'react-bootstrap';
import DataTable from '@/components/common/DataTable';
import RoleFormModal from '@/components/roles/RoleFormModal';
import { useCreateRole, useDeleteRole, usePermissions, useRoles, useUpdateRole } from '@/hooks/useRoles';
import { Role } from '@/types/role.types';

const RolesPage: React.FC = () => {
  const [page] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { data: rolesResponse, isLoading, error } = useRoles({ page, limit: 20 });
  const { data: permissionsResponse } = usePermissions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const roles = rolesResponse?.data || [];
  const pagination = rolesResponse?.pagination;
  const permissions = permissionsResponse?.data;

  const openCreateModal = () => {
    setEditingRole(null);
    setShowModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirma eliminar este rol?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSubmit = async (values: { name: string; description?: string; permissions: string[]; isDefault?: boolean }) => {
    if (editingRole) {
      await updateMutation.mutateAsync({ id: editingRole._id, data: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setShowModal(false);
    setEditingRole(null);
  };

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Roles</h1>
          <p className="text-muted mb-0">Administración de roles y permisos por tenant</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={openCreateModal}>Crear Rol</Button>
        </Col>
      </Row>

      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {Boolean(error) && <Alert variant="danger">No fue posible cargar los roles.</Alert>}

      {rolesResponse && (
        <Card className="tt-card mb-3">
          <Card.Body>
            <DataTable
              data={roles}
              columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'description', label: 'Descripción' },
                {
                  key: 'permissions',
                  label: 'Permisos',
                  render: (row: Role) => (
                    <div className="d-flex flex-wrap gap-1">
                      {row.permissions.map((permission) => (
                        <Badge key={permission} bg="secondary" pill>{permission}</Badge>
                      ))}
                    </div>
                  ),
                },
              ]}
              actions={(row: Role) => (
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-primary" onClick={() => openEditModal(row)}>Editar</Button>
                  <Button size="sm" variant="outline-danger" onClick={() => handleDelete(row._id)}>Eliminar</Button>
                </div>
              )}
            />
          </Card.Body>
        </Card>
      )}

      {pagination && pagination.pages > 1 && (
        <Pagination>
          <Pagination.Prev disabled={page === 1} />
          <Pagination.Item active>{page}</Pagination.Item>
          <Pagination.Next disabled={page >= pagination.pages} />
        </Pagination>
      )}

      <RoleFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleSubmit}
        role={editingRole}
        permissions={permissions}
        isSubmitting={createMutation.isLoading || updateMutation.isLoading}
      />
    </Container>
  );
};

export default RolesPage;