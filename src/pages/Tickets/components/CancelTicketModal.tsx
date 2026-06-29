import React, { useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useCancelTicket } from '@/hooks/useTickets';
import { Ticket } from '@/types/ticket.types';

interface CancelTicketModalProps {
  show: boolean;
  onHide: () => void;
  ticket: Ticket | null;
}

const CancelTicketModal: React.FC<CancelTicketModalProps> = ({
  show,
  onHide,
  ticket,
}) => {
  const [observation, setObservation] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const cancelMutation = useCancelTicket();

  const handleClose = (): void => {
    setObservation('');
    setSubmitError('');
    onHide();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');
    if (!ticket) return;
    try {
      await cancelMutation.mutateAsync({
        id: ticket._id,
        data: {
          closingObservation: observation.trim() || undefined,
        },
      });
      toast.success('Ticket cancelado.');
      handleClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'No fue posible cancelar el ticket.';
      setSubmitError(message);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cancelar Ticket</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {ticket && (
            <p className="text-muted small mb-3">
              Ticket <strong>{ticket.consecutivo}</strong>
            </p>
          )}
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Alert variant="warning" className="py-2">
            Esta acción cerrará el ticket con motivo "Cancelación manual".
          </Alert>

          <Form.Group controlId="cancelObservation">
            <Form.Label>Observación de cierre (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              maxLength={1000}
              placeholder="Explique brevemente el motivo de la cancelación..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Volver
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={cancelMutation.isLoading}
          >
            {cancelMutation.isLoading ? 'Cancelando...' : 'Cancelar Ticket'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CancelTicketModal;
