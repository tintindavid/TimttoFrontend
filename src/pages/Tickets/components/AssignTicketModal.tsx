import React, { useMemo, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useUsers } from '@/hooks/useUsers';
import { useAssignTicket } from '@/hooks/useTickets';
import { Ticket } from '@/types/ticket.types';
import { User } from '@/types/user.types';

interface AssignTicketModalProps {
  show: boolean;
  onHide: () => void;
  ticket: Ticket | null;
}

const ASSIGNABLE_ROLES: ReadonlyArray<string> = ['admin', 'technician'];

const renderUserLabel = (u: User): string => {
  const name =
    u.fullName ||
    [u.firstName, u.lastName].filter(Boolean).join(' ') ||
    u.email;
  return `${name} (${u.role})`;
};

const AssignTicketModal: React.FC<AssignTicketModalProps> = ({
  show,
  onHide,
  ticket,
}) => {
  const [responsableId, setResponsableId] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  const usersQuery = useUsers({ limit: 100 });
  const assignMutation = useAssignTicket();

  const users: User[] = useMemo(() => {
    const raw = (usersQuery.data?.data ?? []) as User[];
    return raw.filter((u) => ASSIGNABLE_ROLES.includes(u.role));
  }, [usersQuery.data]);

  const handleClose = (): void => {
    setResponsableId('');
    setSubmitError('');
    onHide();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');
    if (!ticket || !responsableId) {
      setSubmitError('Seleccione un responsable.');
      return;
    }
    try {
      await assignMutation.mutateAsync({
        id: ticket._id,
        data: { responsableId },
      });
      toast.success('Ticket asignado correctamente.');
      handleClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'No fue posible asignar el ticket.';
      setSubmitError(message);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Asignar Ticket</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {ticket && (
            <p className="text-muted small mb-3">
              Asignando ticket <strong>{ticket.consecutivo}</strong>.
            </p>
          )}

          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Form.Group controlId="assignTicketResponsable">
            <Form.Label>Responsable</Form.Label>
            {usersQuery.isLoading ? (
              <div className="d-flex align-items-center gap-2">
                <Spinner size="sm" animation="border" />
                <span>Cargando usuarios...</span>
              </div>
            ) : (
              <Form.Select
                value={responsableId}
                onChange={(e) => setResponsableId(e.target.value)}
                required
                aria-label="Seleccionar responsable"
              >
                <option value="">Seleccionar...</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {renderUserLabel(u)}
                  </option>
                ))}
              </Form.Select>
            )}
            <Form.Text className="text-muted">
              Solo admin y técnicos pueden ser responsables.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!responsableId || assignMutation.isLoading}
          >
            {assignMutation.isLoading ? 'Asignando...' : 'Asignar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AssignTicketModal;
