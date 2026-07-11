import React, { useState } from 'react';
import { Modal, Button, Alert, Form } from 'react-bootstrap';
import { FaCopy, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';
import type { CreateTenantWithAdminResponse } from '@/types';

interface CredentialsShownOnceProps {
  /** The full response from createWithAdmin; modal is shown when defined */
  credentials: CreateTenantWithAdminResponse;
  /** Called when the user confirms they've saved the credentials and closes the modal */
  onClose: () => void;
  /** When true the backend sent credentials by email (E3). Renders an info banner. */
  emailSent?: boolean;
  /** Email address the notification was sent to (shown inside the info banner). */
  adminEmail?: string;
}

/**
 * One-time credentials modal.
 * Design D7: shows email + temporaryPassword once, requires acknowledgement before close.
 * Once this modal is dismissed the password is gone — no endpoint exposes it again.
 */
const CredentialsShownOnce: React.FC<CredentialsShownOnceProps> = ({
  credentials,
  onClose,
  emailSent,
  adminEmail,
}) => {
  const [saved, setSaved] = useState(false);

  const credentialText = `Email: ${credentials.admin.email}\nContraseña temporal: ${credentials.temporaryPassword}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(credentialText);
      toast.success('Credenciales copiadas al portapapeles');
    } catch {
      toast.error('No se pudo copiar al portapapeles. Copia manualmente.');
    }
  };

  return (
    <Modal
      show
      onHide={() => {
        // Block backdrop-click dismissal if the user hasn't acknowledged
        if (!saved) return;
        onClose();
      }}
      backdrop="static"
      keyboard={false}
      centered
      aria-labelledby="credentials-modal-title"
    >
      <Modal.Header>
        <Modal.Title id="credentials-modal-title">
          Tenant creado — Credenciales del primer admin
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant="warning" className="mb-3">
          <strong>¡Atención!</strong> Esta es la única vez que se muestra la contraseña
          temporal. Guárdala antes de cerrar.
        </Alert>

        {/* Email notification banner — only rendered when the backend confirms dispatch (E3) */}
        {emailSent && adminEmail && (
          <Alert variant="info" className="mb-3">
            <strong>También enviado por email a {adminEmail}.</strong>
            <br />
            Si no lo recibe, revise la carpeta de spam o comparta las credenciales manualmente
            desde este modal.
          </Alert>
        )}

        {/* Credentials display */}
        <div
          className="bg-dark text-light rounded p-3 mb-3"
          style={{ fontFamily: 'monospace', fontSize: '1rem' }}
          aria-label="Credenciales del nuevo administrador"
        >
          <div className="mb-1">
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              EMAIL
            </span>
            <div>{credentials.admin.email}</div>
          </div>
          <div>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              CONTRASEÑA TEMPORAL
            </span>
            <div
              style={{ fontSize: '1.25rem', letterSpacing: '0.05em', wordBreak: 'break-all' }}
            >
              {credentials.temporaryPassword}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="d-flex gap-2 mb-4">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleCopy}
            aria-label="Copiar credenciales al portapapeles"
          >
            <FaCopy className="me-1" aria-hidden="true" />
            Copiar credenciales
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled
            title="Disponible cuando E3 (email) esté desplegado"
            aria-label="Enviar por email (no disponible)"
          >
            <FaEnvelope className="me-1" aria-hidden="true" />
            Enviar por email
          </Button>
        </div>

        {/* Acknowledgement checkbox — required before close */}
        <Form.Check
          id="credentials-saved-checkbox"
          type="checkbox"
          label="He guardado las credenciales en un lugar seguro"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
          aria-required="true"
        />
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="primary"
          onClick={onClose}
          disabled={!saved}
          aria-disabled={!saved}
          title={!saved ? 'Debes confirmar que guardaste las credenciales' : undefined}
        >
          Cerrar e ir al detalle del tenant
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CredentialsShownOnce;
