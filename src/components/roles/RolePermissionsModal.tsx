import React, { useMemo } from 'react';
import { Badge, Button, Modal, Row, Col } from 'react-bootstrap';
import { PermissionsCatalog, Role } from '@/types/role.types';
import { formatPermission, RESOURCE_LABELS } from '@/constants/permissionLabels';

interface Props {
  show: boolean;
  onHide: () => void;
  role: Role | null;
  catalog?: PermissionsCatalog;
}

const resourceTitle = (resourceKey: string) =>
  RESOURCE_LABELS[resourceKey]?.plural ??
  resourceKey
    .split('-')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');

const RolePermissionsModal: React.FC<Props> = ({ show, onHide, role, catalog }) => {
  const groupedByResource = useMemo(() => {
    if (!role) return {};
    // Prefer server-supplied grouping so the resource ordering matches the edit modal.
    const grouped = catalog?.grouped;
    if (grouped) {
      const result: Record<string, string[]> = {};
      Object.entries(grouped).forEach(([resource, catalogPerms]) => {
        const owned = catalogPerms.filter((permission) => role.permissions.includes(permission));
        if (owned.length > 0) result[resource] = owned;
      });
      return result;
    }
    // Fallback: derive grouping from the role's own permission strings.
    return role.permissions.reduce<Record<string, string[]>>((acc, permission) => {
      const [resource = 'general'] = permission.split(':');
      acc[resource] = acc[resource] || [];
      acc[resource].push(permission);
      return acc;
    }, {});
  }, [role, catalog]);

  const totalOwned = role?.permissions.length ?? 0;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          Permisos de {role?.name}
          <span className="text-muted fs-6 ms-2">({totalOwned})</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: '70vh' }}>
        {role?.description && <p className="text-muted mb-3">{role.description}</p>}
        {Object.keys(groupedByResource).length === 0 && (
          <p className="text-muted">Este rol no tiene permisos asignados.</p>
        )}
        {Object.entries(groupedByResource).map(([resource, perms]) => (
          <div key={resource} className="mb-3 p-3 border rounded-3 bg-light">
            <div className="fw-semibold mb-2">
              {resourceTitle(resource)}
              <span className="text-muted ms-2 fs-6">({perms.length})</span>
            </div>
            <Row xs={1} md={2} className="g-2">
              {perms.map((permission) => {
                const { action, id } = formatPermission(permission);
                return (
                  <Col key={permission}>
                    <Badge bg="secondary" pill className="me-1" title={id}>
                      {action}
                    </Badge>
                  </Col>
                );
              })}
            </Row>
          </div>
        ))}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RolePermissionsModal;
