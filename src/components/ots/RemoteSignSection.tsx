import React, { useMemo, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
import { useRemoteSignRequest } from '@/hooks/useRemoteSignRequest';
import { useUsersWithSignature } from '@/hooks/useUsers';
import { useAuth } from '@/context/AuthContext';
import { nameShort } from '@/utils/nameShort';

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
 *
 * Includes a "Firmante técnico" selector (report-processor-and-signer-
 * traceability) — the user requesting the remote signature may be different
 * from the technician whose signature/name stamps the PDF once the client
 * signs. Defaults to the user in session. A confirmation step guards
 * against picking the wrong firmante by mistake.
 */
export const RemoteSignSection: React.FC<Props> = ({
  otId,
  reportIds,
  clientEmail,
  correousados = [],
  onSuccess,
}) => {
  const { user: authUser } = useAuth();
  const [email, setEmail] = useState(clientEmail || '');
  const [message, setMessage] = useState('');
  const [firmanteUserId, setFirmanteUserId] = useState<string>(authUser?._id || '');
  const [showConfirm, setShowConfirm] = useState(false);
  const mutation = useRemoteSignRequest(otId);
  const { data: usersWithSignatureResp } = useUsersWithSignature();
  const usersWithSignature = usersWithSignatureResp?.data || [];
  const emailValid = EMAIL_RE.test(email.trim());

  const selectedFirmanteName = useMemo(() => {
    const id = firmanteUserId || authUser?._id;
    if (!id) return 'tú';
    if (id === authUser?._id) return 'tú';
    const u = usersWithSignature.find((x) => x._id === id);
    return u ? nameShort(u) : 'el firmante seleccionado';
  }, [firmanteUserId, authUser, usersWithSignature]);

  const handleSubmit = async () => {
    if (!emailValid || reportIds.length === 0) return;
    await mutation.mutateAsync({
      otId,
      reportIds,
      email: email.trim().toLowerCase(),
      message: message.trim() || undefined,
      firmanteUserId: firmanteUserId || undefined,
    });
    setShowConfirm(false);
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

        <Form.Group className="mb-3">
          <Form.Label>Firmante técnico</Form.Label>
          <Form.Select
            aria-label="Firmante técnico"
            value={firmanteUserId}
            onChange={(e) => setFirmanteUserId(e.target.value)}
          >
            {authUser?._id && (
              <option value={authUser._id}>{nameShort(authUser)} (tú)</option>
            )}
            {usersWithSignature
              .filter((u) => u._id !== authUser?._id)
              .map((u) => (
                <option key={u._id} value={u._id}>
                  {nameShort(u)}
                </option>
              ))}
          </Form.Select>
          <Form.Text className="text-muted">
            El nombre y la firma de este usuario quedarán en el PDF una vez el cliente firme.
          </Form.Text>
        </Form.Group>
      </Form>

      <Button
        variant="primary"
        onClick={() => setShowConfirm(true)}
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

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar firmante</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Confirmar que <strong>{selectedFirmanteName}</strong> firmará esta hoja de trabajo?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" /> Enviando…
              </>
            ) : (
              'Confirmar y firmar'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RemoteSignSection;
