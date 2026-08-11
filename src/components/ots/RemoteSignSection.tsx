import React, { useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
import { useRemoteSignRequest } from '@/hooks/useRemoteSignRequest';

interface Props {
  otId: string;
  reportIds: string[];
  clientEmail?: string;
  correousados?: string[];
  onSuccess?: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Firma Remota" tab of the create-sheet modal. Sends a POST to the
 * remote-sign-request endpoint; on success calls onSuccess (the parent
 * closes the modal + refetches sheets).
 */
export const RemoteSignSection: React.FC<Props> = ({
  otId,
  reportIds,
  clientEmail,
  correousados = [],
  onSuccess,
}) => {
  const [email, setEmail] = useState(clientEmail || '');
  const [message, setMessage] = useState('');
  const mutation = useRemoteSignRequest(otId);
  const emailValid = EMAIL_RE.test(email.trim());

  const handleSubmit = async () => {
    if (!emailValid || reportIds.length === 0) return;
    await mutation.mutateAsync({
      otId,
      reportIds,
      email: email.trim().toLowerCase(),
      message: message.trim() || undefined,
    });
    onSuccess?.();
  };

  return (
    <div>
      <Alert variant="info">
        Enviaremos un enlace único al correo indicado para que el cliente firme
        la Hoja de Trabajo con {reportIds.length} equipo(s). El enlace es válido
        por 7 días.
      </Alert>

      <Form>
        <Form.Group className="mb-3">
          <Form.Label>
            Correo del destinatario <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            type="email"
            list="remote-sign-emails"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@empresa.com"
            required
            isInvalid={email.length > 0 && !emailValid}
          />
          {correousados.length > 0 && (
            <datalist id="remote-sign-emails">
              {correousados.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          )}
          <Form.Text className="text-muted">
            Se autocompleta con el correo del cliente. Puedes editarlo si el
            firmante autorizado usa otra dirección.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Mensaje adicional (opcional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ej: Por favor firma antes del cierre del mes."
          />
        </Form.Group>
      </Form>

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!emailValid || reportIds.length === 0 || mutation.isPending}
      >
        {mutation.isPending ? (
          <>
            <Spinner size="sm" animation="border" className="me-2" /> Enviando…
          </>
        ) : (
          <>
            <FaPaperPlane className="me-1" /> Enviar solicitud de firma
          </>
        )}
      </Button>
    </div>
  );
};

export default RemoteSignSection;
