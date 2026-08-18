import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import { CreateNotificationRuleDto, NotificationRule } from '@/types/notification.types';
import { UserRole } from '@/types/user.types';
import { useUsers } from '@/hooks/useUsers';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'technician', label: 'Técnico' },
  { value: 'user', label: 'Usuario' },
];

interface Props {
  show: boolean;
  onHide: () => void;
  onSubmit: (values: CreateNotificationRuleDto) => Promise<void> | void;
  rule?: NotificationRule | null;
  events: string[];
  isSubmitting?: boolean;
}

const NotificationRuleFormModal: React.FC<Props> = ({ show, onHide, onSubmit, rule, events, isSubmitting = false }) => {
  const [event, setEvent] = useState('');
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [inappEnabled, setInappEnabled] = useState(true);
  const [enabled, setEnabled] = useState(true);

  // Users catalog for the recipients multi-select. limit=100 is a pragmatic
  // cap — tenants with more users than that are rare and this is an admin-only
  // config screen, not a high-traffic list.
  const { data: usersResponse } = useUsers({ page: 1, limit: 100 });
  const userOptions = (usersResponse?.data || []).map((u) => ({
    value: u._id as string,
    label: u.fullName || u.email,
  }));

  useEffect(() => {
    if (rule) {
      setEvent(rule.event);
      setRoles(rule.recipients.roles);
      setUserIds(rule.recipients.userIds);
      setInappEnabled(rule.channels.includes('inapp'));
      setEnabled(rule.enabled);
      return;
    }
    if (!show) {
      setEvent('');
      setRoles([]);
      setUserIds([]);
      setInappEnabled(true);
      setEnabled(true);
    }
  }, [rule, show]);

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    await onSubmit({
      event,
      recipients: { roles, userIds },
      channels: inappEnabled ? ['inapp'] : [],
      enabled,
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{rule ? 'Editar regla' : 'Nueva regla'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3 mb-3">
            <Col md={12}>
              <Form.Label>Evento</Form.Label>
              <Form.Select value={event} onChange={(e) => setEvent(e.target.value)} required disabled={!!rule}>
                <option value="">Seleccionar evento...</option>
                {events.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Roles destinatarios</Form.Label>
              <Select
                isMulti
                options={ROLE_OPTIONS}
                value={ROLE_OPTIONS.filter((opt) => roles.includes(opt.value))}
                onChange={(selected) => setRoles(selected.map((s) => s.value))}
                placeholder="Seleccionar roles..."
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                // Modal z-index (1055) > react-select portal default (1) — force it above.
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                aria-label="Roles destinatarios"
              />
            </Col>
            <Col md={6}>
              <Form.Label>Usuarios destinatarios</Form.Label>
              <Select
                isMulti
                options={userOptions}
                value={userOptions.filter((opt) => userIds.includes(opt.value))}
                onChange={(selected) => setUserIds(selected.map((s) => s.value))}
                placeholder="Seleccionar usuarios..."
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                aria-label="Usuarios destinatarios"
              />
            </Col>
          </Row>

          <div className="mb-2 fw-semibold">Canales</div>
          <Form.Check type="checkbox" id="channel-inapp" label="In-app" checked={inappEnabled} onChange={(e) => setInappEnabled(e.target.checked)} />
          <Form.Check type="checkbox" id="channel-email" label="Email (disponible próximamente)" checked={false} disabled title="Disponible próximamente" />
          {!inappEnabled && (
            <div className="text-danger small mt-1">Debes seleccionar al menos un canal.</div>
          )}

          <Form.Check
            type="switch"
            id="rule-enabled"
            label="Regla habilitada"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-3"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || !event || !inappEnabled}>
            {isSubmitting ? <Spinner as="span" size="sm" animation="border" className="me-2" /> : null}
            {rule ? 'Guardar cambios' : 'Crear regla'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default NotificationRuleFormModal;
