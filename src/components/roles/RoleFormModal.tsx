import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { CreateRoleDto, PermissionsCatalog, Role, UpdateRoleDto } from '@/types/role.types';

type RoleFormValues = CreateRoleDto;

type RoleFormModalProps = {
  show: boolean;
  onHide: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void> | void;
  role?: Role | null;
  permissions?: PermissionsCatalog;
  isSubmitting?: boolean;
};

const groupPermissions = (catalog?: PermissionsCatalog) => {
  const grouped: Record<string, string[]> = {};
  Object.values(catalog || {}).forEach((permission) => {
    const [group = 'general'] = permission.split(':');
    grouped[group] = grouped[group] || [];
    grouped[group].push(permission);
  });
  return grouped;
};

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const RoleFormModal: React.FC<RoleFormModalProps> = ({ show, onHide, onSubmit, role, permissions, isSubmitting = false }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isDefault, setIsDefault] = useState(false);

  const groupedPermissions = useMemo(() => groupPermissions(permissions), [permissions]);

  useEffect(() => {
    if (role) {
      setName(role.name || '');
      setDescription(role.description || '');
      setSelectedPermissions(role.permissions || []);
      setIsDefault(Boolean(role.isDefault));
      return;
    }

    if (!show) {
      setName('');
      setDescription('');
      setSelectedPermissions([]);
      setIsDefault(false);
    }
  }, [role, show]);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) => (
      current.includes(permission)
        ? current.filter((value) => value !== permission)
        : [...current, permission]
    ));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ name, description, permissions: selectedPermissions, isDefault });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{role ? 'Editar rol' : 'Crear rol'}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{maxHeight:'75vh', overflowY:'scroll'}}>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Nombre</Form.Label>
              <Form.Control value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} />
            </Col>
            <Col md={6}>
              <Form.Label>Descripción</Form.Label>
              <Form.Control value={description} onChange={(event) => setDescription(event.target.value)} />
            </Col>
          </Row>

          <Form.Check
            type="switch"
            id="role-is-default"
            label="Rol predeterminado"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
            className="mb-3"
          />

          <div className="mb-2 fw-semibold">Permisos</div>
          {Object.entries(groupedPermissions).map(([group, permissionList]) => (
            <div key={group} className="mb-3 p-3 border rounded-3 bg-light">
              <div className="fw-semibold mb-2">{titleCase(group)}</div>
              <Row xs={1} md={2} className="g-2">
                {permissionList.map((permission) => (
                  <Col key={permission}>
                    <Form.Check
                      type="checkbox"
                      id={`permission-${permission}`}
                      label={permission}
                      checked={selectedPermissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                    />
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner as="span" size="sm" animation="border" className="me-2" /> : null}
            {role ? 'Guardar cambios' : 'Crear rol'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RoleFormModal;