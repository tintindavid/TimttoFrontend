import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { useResetUserPassword } from '@/hooks/usePlatformUsers';
import type { PlatformUser } from '@/types';

interface Props {
  user: PlatformUser | null;
  onHide: () => void;
}

/**
 * Two-phase modal:
 * Phase 1 — Confirmation of intent.
 * Phase 2 — Shows the one-time temporaryPassword with copy-to-clipboard.
 *            Requires checkbox before closing.
 */
const UserPasswordResetModal: React.FC<Props> = ({ user, onHide }) => {
  const [phase, setPhase] = useState<'confirm' | 'result'>('confirm');
  const [temporaryPassword, setTemporaryPassword] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  /** Tracks whether the backend confirmed sending a credentials email (E3). */
  const [emailSent, setEmailSent] = useState(false);

  const resetMutation = useResetUserPassword();

  const show = !!user;

  const handleConfirm = async () => {
    if (!user) return;
    try {
      const result = await resetMutation.mutateAsync(user._id);
      setTemporaryPassword(result.temporaryPassword);
      setEmailSent(result.emailSent ?? false);
      setPhase('result');
    } catch {
      // Error toast is handled by the hook's onError
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
    toast.success('Contraseña copiada al portapapeles');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    // Reset internal state for next open
    setPhase('confirm');
    setTemporaryPassword('');
    setCopied(false);
    setSavedConfirmed(false);
    setEmailSent(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={phase === 'result' && !savedConfirmed ? undefined : handleClose} centered>
      <Modal.Header closeButton={phase === 'confirm' || savedConfirmed}>
        <Modal.Title>
          {phase === 'confirm' ? 'Resetear contraseña' : 'Nueva contraseña temporal'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {phase === 'confirm' && user && (
          <>
            <p>
              ¿Estás seguro de que deseas resetear la contraseña del usuario{' '}
              <strong>{user.email}</strong>?
            </p>
            <Alert variant="warning">
              Se generará una contraseña temporal. El usuario deberá cambiarla en su próximo
              inicio de sesión.
            </Alert>
          </>
        )}

        {phase === 'result' && (
          <>
            <Alert variant="success">
              Contraseña reseteada correctamente. Esta es la <strong>única vez</strong> que se
              mostrará.
            </Alert>

            {/* Email notification banner — only rendered when the backend confirms dispatch (E3) */}
            {emailSent && user && (
              <Alert variant="info" className="mb-3">
                <strong>También enviado por email a {user.email}.</strong>
                <br />
                Si no lo recibe, revise la carpeta de spam o comparta manualmente desde este
                modal.
              </Alert>
            )}

            <div className="d-flex align-items-center gap-2 mb-3">
              <code
                className="flex-grow-1 p-2 rounded"
                style={{
                  background: '#f8f9fa',
                  fontSize: '1.1rem',
                  wordBreak: 'break-all',
                  border: '1px solid #dee2e6',
                }}
                aria-label="Contraseña temporal generada"
              >
                {temporaryPassword}
              </code>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleCopy}
                aria-label="Copiar contraseña al portapapeles"
              >
                {copied ? <FaCheck aria-hidden="true" /> : <FaCopy aria-hidden="true" />}
              </Button>
            </div>

            <Form.Check
              id="savedConfirmedCheck"
              type="checkbox"
              label="He guardado la contraseña en un lugar seguro"
              checked={savedConfirmed}
              onChange={(e) => setSavedConfirmed(e.target.checked)}
            />
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        {phase === 'confirm' && (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              disabled={resetMutation.isLoading}
              aria-label="Confirmar reseteo de contraseña"
            >
              {resetMutation.isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />
                  Procesando…
                </>
              ) : (
                'Resetear contraseña'
              )}
            </Button>
          </>
        )}

        {phase === 'result' && (
          <Button
            variant="primary"
            onClick={handleClose}
            disabled={!savedConfirmed}
            aria-label="Cerrar modal — requiere confirmar que guardó la contraseña"
          >
            Cerrar
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default UserPasswordResetModal;
