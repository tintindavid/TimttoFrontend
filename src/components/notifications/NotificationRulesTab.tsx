import React, { useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  useCreateNotificationRule,
  useDeleteNotificationRule,
  useNotificationEvents,
  useNotificationRules,
  useSendTestNotification,
  useUpdateNotificationRule,
} from '@/hooks/useNotificationRules';
import { CreateNotificationRuleDto, NotificationRule } from '@/types/notification.types';
import NotificationRuleFormModal from './NotificationRuleFormModal';

/**
 * Rule catalog is bounded by NOTIFICATION_EVENTS (currently a single phase-1
 * event) — no search/sort/pagination needed, same exception as RolesPage's
 * small-catalog client-side pattern.
 */
const NotificationRulesTab: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);

  const { data: rulesResponse, isLoading, isError } = useNotificationRules({ page: 1, limit: 100 });
  const { data: eventsResponse } = useNotificationEvents();
  const createMutation = useCreateNotificationRule();
  const updateMutation = useUpdateNotificationRule();
  const deleteMutation = useDeleteNotificationRule();
  const testMutation = useSendTestNotification();

  const rules = rulesResponse?.data || [];
  const events = eventsResponse?.data || [];
  const systemTestRuleExists = rules.some((r) => r.event === 'system.test' && r.enabled);

  const openCreateModal = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const openEditModal = (rule: NotificationRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirma eliminar esta regla?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSubmit = async (values: CreateNotificationRuleDto) => {
    try {
      if (editingRule) {
        await updateMutation.mutateAsync({ id: editingRule._id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setShowModal(false);
      setEditingRule(null);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        toast.error('Ya existe una regla para este evento.');
      } else {
        toast.error('No fue posible guardar la regla.');
      }
    }
  };

  const handleSendTest = async () => {
    try {
      await testMutation.mutateAsync();
      toast.success('Notificación de prueba enviada.');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        toast.warning('Configura primero la regla "system.test".');
      } else if (status === 429) {
        toast.warning('Ya enviaste una prueba hace poco. Espera un minuto.');
      } else {
        toast.error('No fue posible enviar la notificación de prueba.');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Button variant="outline-primary" onClick={handleSendTest} disabled={testMutation.isLoading}>
            Enviar notificación de prueba
          </Button>
          {!systemTestRuleExists && (
            <span className="text-muted small ms-2">Configura primero la regla "system.test".</span>
          )}
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          Nueva regla
        </Button>
      </div>

      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" aria-label="Cargando reglas" />
        </div>
      )}

      {isError && <Alert variant="danger">No fue posible cargar las reglas.</Alert>}

      {!isLoading && !isError && (
        <Card className="tt-card">
          <Card.Body>
            {rules.length === 0 ? (
              <p className="text-center text-muted my-3 mb-0">Aún no hay reglas configuradas.</p>
            ) : (
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Roles</th>
                    <th>Usuarios</th>
                    <th>Canales</th>
                    <th>Habilitada</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule._id}>
                      <td>{rule.event}</td>
                      <td>
                        {rule.recipients.roles.map((role) => (
                          <Badge key={role} bg="secondary" pill className="me-1">
                            {role}
                          </Badge>
                        ))}
                      </td>
                      <td>{rule.recipients.userIds.length}</td>
                      <td>
                        {rule.channels.map((channel) => (
                          <Badge key={channel} bg="info" pill className="me-1">
                            {channel}
                          </Badge>
                        ))}
                      </td>
                      <td>{rule.enabled ? <Badge bg="success">Sí</Badge> : <Badge bg="secondary">No</Badge>}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-primary" onClick={() => openEditModal(rule)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDelete(rule._id)}>
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      <NotificationRuleFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleSubmit}
        rule={editingRule}
        events={events}
        isSubmitting={createMutation.isLoading || updateMutation.isLoading}
      />
    </div>
  );
};

export default NotificationRulesTab;
