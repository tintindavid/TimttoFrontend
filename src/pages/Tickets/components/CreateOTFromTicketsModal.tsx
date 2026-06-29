import React, { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Form,
  ListGroup,
  Modal,
  Spinner,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/hooks/useUsers';
import { useCreateOTFromTickets } from '@/hooks/useTickets';
import {
  OT_PRIORITY_VARIANTS,
  computeMaxOtPriority,
} from '@/constants/ticket.constants';
import { Ticket } from '@/types/ticket.types';
import { User } from '@/types/user.types';

interface CreateOTFromTicketsModalProps {
  show: boolean;
  onHide: () => void;
  tickets: Ticket[];
}

// Role-based filtering for assignable users is intentionally OFF here:
// the granular permission system is owned by a separate feature. Until
// that lands, every tenant user is selectable as Responsable.
const renderUserLabel = (u: User): string => {
  const name =
    u.fullName ||
    [u.firstName, u.lastName].filter(Boolean).join(' ') ||
    u.email;
  return u.role ? `${name} (${u.role})` : name;
};

const CreateOTFromTicketsModal: React.FC<CreateOTFromTicketsModalProps> = ({
  show,
  onHide,
  tickets,
}) => {
  const navigate = useNavigate();
  const [responsableId, setResponsableId] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  // Backend caps `limit` at 100 (queryUserDto). Anything higher 400s and
  // leaves the dropdown empty — keep at 100 until we add pagination here.
  const usersQuery = useUsers({ limit: 100 });
  const createOtMutation = useCreateOTFromTickets();

  const users = useMemo<User[]>(
    () => (usersQuery.data?.data ?? []) as User[],
    [usersQuery.data],
  );

  const computedPriority = useMemo(
    () => computeMaxOtPriority(tickets.map((t) => t.urgency)),
    [tickets],
  );

  const handleClose = (): void => {
    setResponsableId('');
    setSubmitError('');
    onHide();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');
    if (!tickets.length) {
      setSubmitError('No hay tickets seleccionados.');
      return;
    }
    if (!responsableId) {
      setSubmitError('Seleccione un responsable.');
      return;
    }
    try {
      const res = await createOtMutation.mutateAsync({
        ticketIds: tickets.map((t) => t._id),
        responsableId,
      });
      const { otId } = res.data;
      toast.success('OT creada correctamente desde los tickets.');
      handleClose();
      if (otId) navigate(`/ots/${otId}`);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'No fue posible crear la OT.';
      setSubmitError(message);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Crear OT desde Tickets</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <p className="mb-2">
            Se creará una OT con <strong>{tickets.length}</strong> ticket(s).
          </p>

          <div className="mb-3">
            <span className="me-2">Prioridad estimada:</span>
            <Badge bg={OT_PRIORITY_VARIANTS[computedPriority]}>
              {computedPriority}
            </Badge>
            <Form.Text className="text-muted d-block">
              Calculada como el máximo de las urgencias seleccionadas
              (Normal → Media, Urgente → Alta, Crítico → Urgente).
            </Form.Text>
          </div>

          <Form.Group className="mb-3" controlId="otResponsable">
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
                aria-label="Seleccionar responsable de la OT"
              >
                <option value="">Seleccionar...</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {renderUserLabel(u)}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>

          <h6>Tickets incluidos</h6>
          <ListGroup style={{ maxHeight: 240, overflowY: 'auto' }}>
            {tickets.map((t) => (
              <ListGroup.Item key={t._id} className="py-2">
                <div className="d-flex justify-content-between">
                  <span>
                    <strong>{t.consecutivo}</strong>
                    <span className="text-muted ms-2">
                      {t.equipoSnapshot?.itemNombre || ''}
                      {t.equipoSnapshot?.inventario
                        ? ` · ${t.equipoSnapshot.inventario}`
                        : ''}
                    </span>
                  </span>
                  <Badge bg="light" text="dark">
                    {t.urgency}
                  </Badge>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!responsableId || createOtMutation.isLoading}
          >
            {createOtMutation.isLoading ? 'Creando...' : 'Crear OT'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateOTFromTicketsModal;
