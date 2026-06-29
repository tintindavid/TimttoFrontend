import React, { useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAddTicketNote } from '@/hooks/useTickets';
import { Ticket } from '@/types/ticket.types';

interface AddNoteModalProps {
  show: boolean;
  onHide: () => void;
  ticket: Ticket | null;
}

const MAX_NOTE_LENGTH = 1000;

const AddNoteModal: React.FC<AddNoteModalProps> = ({ show, onHide, ticket }) => {
  const [note, setNote] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  const addNoteMutation = useAddTicketNote();

  const handleClose = (): void => {
    setNote('');
    setSubmitError('');
    onHide();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');
    const trimmed = note.trim();
    if (!ticket || !trimmed) {
      setSubmitError('La nota no puede estar vacía.');
      return;
    }
    try {
      await addNoteMutation.mutateAsync({
        id: ticket._id,
        data: { note: trimmed },
      });
      toast.success('Nota interna agregada.');
      handleClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'No fue posible agregar la nota.';
      setSubmitError(message);
    }
  };

  const remaining = MAX_NOTE_LENGTH - note.length;

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Agregar Nota Interna</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {ticket && (
            <p className="text-muted small mb-3">
              Ticket <strong>{ticket.consecutivo}</strong>
            </p>
          )}

          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Form.Group controlId="ticketNote">
            <Form.Label>Nota</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={MAX_NOTE_LENGTH}
              placeholder="Escriba una nota interna (solo visible para el equipo)..."
              required
            />
            <Form.Text className={remaining < 0 ? 'text-danger' : 'text-muted'}>
              {remaining} caracteres restantes
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
            disabled={!note.trim() || addNoteMutation.isLoading}
          >
            {addNoteMutation.isLoading ? 'Guardando...' : 'Agregar Nota'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddNoteModal;
