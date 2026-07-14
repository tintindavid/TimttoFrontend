import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { CreateRoleDto, PermissionsCatalog, Role, UpdateRoleDto } from '@/types/role.types';
import { formatPermission, RESOURCE_LABELS } from '@/constants/permissionLabels';

type RoleFormValues = CreateRoleDto;

type RoleFormModalProps = {
  show: boolean;
  onHide: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void> | void;
  role?: Role | null;
  permissions?: PermissionsCatalog;
  isSubmitting?: boolean;
};

const groupPermissions = (catalog?: PermissionsCatalog): Record<string, string[]> => {
  // Backend already groups by resource. If for any reason we only receive the
  // flat map, derive the grouping here as a fallback.
  if (catalog?.grouped) return catalog.grouped;
  const flat = catalog?.flat || {};
  const grouped: Record<string, string[]> = {};
  Object.values(flat).forEach((permission) => {
    if (typeof permission !== 'string') return;
    const [group = 'general'] = permission.split(':');
    grouped[group] = grouped[group] || [];
    grouped[group].push(permission);
  });
  return grouped;
};

const resourceTitle = (resourceKey: string) =>
  RESOURCE_LABELS[resourceKey]?.plural ?? resourceKey.charAt(0).toUpperCase() + resourceKey.slice(1);

/**
 * Section master checkbox with tri-state (unchecked / indeterminate / checked).
 * React does not expose the `indeterminate` prop, so we set it imperatively on
 * the underlying input via ref whenever the prop flips.
 */
const SectionMasterCheck: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  indeterminate: boolean;
  onChange: (next: boolean) => void;
}> = ({ id, label, checked, indeterminate, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <Form.Check
      type="checkbox"
      id={id}
      className="fw-semibold"
      label={label}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      ref={inputRef}
    />
  );
};

const RoleFormModal: React.FC<RoleFormModalProps> = ({ show, onHide, onSubmit, role, permissions, isSubmitting = false }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  // Permissions that came in on the role but aren't in the current catalog
  // (legacy strings from previous versions). We hide them from the submit
  // payload so the API doesn't reject the whole update, and warn the user so
  // they know they were dropped.
  const [droppedPermissions, setDroppedPermissions] = useState<string[]>([]);

  const groupedPermissions = useMemo(() => groupPermissions(permissions), [permissions]);

  // Full set of permission strings the backend currently accepts, derived from
  // the catalog the server sent for this session. If the catalog hasn't loaded
  // yet we keep an empty allowlist and skip filtering — never drop before we
  // know what's valid.
  const catalogAllowlist = useMemo(() => {
    const flat = new Set<string>();
    if (permissions?.flat) Object.values(permissions.flat).forEach((v) => flat.add(v));
    if (permissions?.grouped) Object.values(permissions.grouped).flat().forEach((v) => flat.add(v));
    return flat;
  }, [permissions]);

  useEffect(() => {
    if (role) {
      setName(role.name || '');
      setDescription(role.description || '');
      const raw = role.permissions || [];
      if (catalogAllowlist.size > 0) {
        const valid: string[] = [];
        const dropped: string[] = [];
        raw.forEach((permission) => {
          if (catalogAllowlist.has(permission)) valid.push(permission);
          else dropped.push(permission);
        });
        setSelectedPermissions(valid);
        setDroppedPermissions(dropped);
      } else {
        setSelectedPermissions(raw);
        setDroppedPermissions([]);
      }
      setIsDefault(Boolean(role.isDefault));
      return;
    }

    if (!show) {
      setName('');
      setDescription('');
      setSelectedPermissions([]);
      setDroppedPermissions([]);
      setIsDefault(false);
    }
  }, [role, show, catalogAllowlist]);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) => (
      current.includes(permission)
        ? current.filter((value) => value !== permission)
        : [...current, permission]
    ));
  };

  /**
   * Toggle every permission of a section at once. When the section is fully
   * selected we clear it; otherwise (empty or partial) we select all — that
   * matches how master checkboxes behave in file managers and email clients.
   */
  const toggleSection = (sectionPermissions: string[], selectAll: boolean) => {
    setSelectedPermissions((current) => {
      if (selectAll) {
        const next = new Set(current);
        sectionPermissions.forEach((permission) => next.add(permission));
        return Array.from(next);
      }
      const toRemove = new Set(sectionPermissions);
      return current.filter((permission) => !toRemove.has(permission));
    });
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

          {droppedPermissions.length > 0 && (
            <Alert variant="warning" className="mb-3">
              <strong>{droppedPermissions.length} permiso{droppedPermissions.length === 1 ? '' : 's'} obsoleto{droppedPermissions.length === 1 ? '' : 's'} detectado{droppedPermissions.length === 1 ? '' : 's'}.</strong>{' '}
              Fueron descartados porque ya no existen en el catálogo actual. Al guardar el rol se quedará solo con los permisos vigentes que marques abajo.
              <div className="small mt-2 text-muted">
                Descartados: {droppedPermissions.slice(0, 6).join(', ')}{droppedPermissions.length > 6 ? `, +${droppedPermissions.length - 6} más` : ''}
              </div>
            </Alert>
          )}
          <div className="mb-2 fw-semibold">Permisos</div>
          {Object.entries(groupedPermissions).map(([group, permissionList]) => {
            const selectedInGroup = permissionList.filter((permission) => selectedPermissions.includes(permission));
            const allSelected = selectedInGroup.length === permissionList.length && permissionList.length > 0;
            const someSelected = selectedInGroup.length > 0 && !allSelected;
            return (
              <div key={group} className="mb-3 p-3 border rounded-3 bg-light">
                <div className="d-flex justify-content-between align-items-center mb-2 gap-2">
                  <SectionMasterCheck
                    id={`section-master-${group}`}
                    label={resourceTitle(group)}
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={(next) => toggleSection(permissionList, next)}
                  />
                  <small className="text-muted">
                    {selectedInGroup.length}/{permissionList.length}
                  </small>
                </div>
                <Row xs={1} md={2} className="g-2">
                  {permissionList.map((permission) => {
                    const { action, id } = formatPermission(permission);
                    return (
                      <Col key={permission}>
                        <Form.Check
                          type="checkbox"
                          id={`permission-${permission}`}
                          label={action}
                          title={id}
                          checked={selectedPermissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                        />
                      </Col>
                    );
                  })}
                </Row>
              </div>
            );
          })}
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