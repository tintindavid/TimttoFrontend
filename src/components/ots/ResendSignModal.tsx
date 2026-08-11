import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { FaEnvelope } from 'react-icons/fa';
import { useResendSignRequest } from '@/hooks/useResendSignRequest';

interface Props {
  show: boolean;
  onHide: () => void;
  otId: string;
  sheetId: string | null;
  currentEmail: string | null;
  numeroHoja?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ResendSignModal: React.FC<Props> = ({
  show,
  onHide,
  otId,
  sheetId,
  currentEmail,
  numeroHoja,
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const mutation = useResendSignRequest(otId);

  useEffect(() => {
    if (show) {
      setEmail(currentEmail || '');
      setMessage('');
    }
  }, [show, currentEmail]);

  const emailValid = EMAIL_RE.test(email.trim());

  const handleSubmit = async () => {
    if (!emailValid || !sheetId) return;
    await mutation.mutateAsync({
      sheetId,
      email: email.trim().toLowerCase(),
      message: message.trim() || undefined,
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaEnvelope className="me-2" />
          Reenviar solicitud de firma
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info">
          {numeroHoja
            ? `Se reenviará el enlace de firma para la HT ${numeroHoja}.`
            : 'Se reenviará el enlace de firma al correo indicado.'}
        </Alert>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>
              Correo del destinatario <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              isInvalid={email.length > 0 && !emailValid}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mensaje adicional (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!emailValid || mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" /> Reenviando…
            </>
          ) : (
            <>
              <FaEnvelope className="me-1" /> Reenviar
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ResendSignModal;
