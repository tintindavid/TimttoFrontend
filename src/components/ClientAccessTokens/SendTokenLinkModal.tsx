import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { FaEnvelope } from 'react-icons/fa';
import { useSendTokenLink } from '@/hooks/clientAccessToken/useSendTokenLink';
import { ClientAccessToken } from '@/types/clientAccessToken.types';

interface Props {
  show: boolean;
  onHide: () => void;
  token: ClientAccessToken | null;
  customerEmail?: string | null;
  correousados?: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Dispatches the portal link by email. Pre-fills with
 * `token.emailHistory.lastEmail` first, then `customerEmail`. The recipient
 * is auto-added to `Customer.correousados` on the backend; the `<datalist>`
 * offers previously-used emails for quick reuse.
 */
const SendTokenLinkModal: React.FC<Props> = ({ show, onHide, token, customerEmail, correousados = [] }) => {
  const [email, setEmail] = useState('');
  const mutation = useSendTokenLink();

  useEffect(() => {
    if (show) {
      const prefill = token?.emailHistory?.lastEmail || customerEmail || '';
      setEmail(prefill);
    }
  }, [show, token, customerEmail]);

  const emailValid = EMAIL_RE.test(email.trim());

  const handleSubmit = async (): Promise<void> => {
    if (!token?._id || !emailValid) return;
    try {
      await mutation.mutateAsync({ id: token._id, email: email.trim().toLowerCase() });
      onHide();
    } catch {
      // toast surfaced by the hook
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaEnvelope className="me-2" />
          Enviar link del portal
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="mb-3">
          Enviaremos el enlace del portal al correo indicado. Puedes reenviarlo
          las veces que necesites; cada envío queda registrado en la fila del acceso.
        </Alert>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>
              Correo del destinatario <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              list="send-link-emails"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com"
              required
              isInvalid={email.length > 0 && !emailValid}
            />
            {correousados.length > 0 && (
              <datalist id="send-link-emails">
                {correousados.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
            )}
            <Form.Text className="text-muted">
              Se autocompleta con el último correo usado o con el correo del cliente.
              Editable si el firmante autorizado usa otra dirección.
            </Form.Text>
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
              <Spinner size="sm" animation="border" className="me-2" /> Enviando…
            </>
          ) : (
            <>
              <FaEnvelope className="me-1" /> Enviar
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SendTokenLinkModal;
