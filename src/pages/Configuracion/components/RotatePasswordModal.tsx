import React, { useMemo, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useRotateQrPassword } from '@/hooks/useServiceQrs';
import {
  QR_PASSWORD_MAX,
  QR_PASSWORD_MIN,
  QR_PASSWORD_RULES,
} from '@/constants/ticket.constants';
import { ServiceQr } from '@/types/serviceQr.types';

interface RotatePasswordModalProps {
  show: boolean;
  onHide: () => void;
  qr: ServiceQr | null;
}

interface PolicyState {
  length: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
}

const evaluatePolicy = (pw: string): PolicyState => ({
  length: pw.length >= QR_PASSWORD_MIN && pw.length <= QR_PASSWORD_MAX,
  upper: QR_PASSWORD_RULES.hasUpper.test(pw),
  lower: QR_PASSWORD_RULES.hasLower.test(pw),
  digit: QR_PASSWORD_RULES.hasDigit.test(pw),
});

const isPolicyOk = (p: PolicyState): boolean =>
  p.length && p.upper && p.lower && p.digit;

const RotatePasswordModal: React.FC<RotatePasswordModalProps> = ({ show, onHide, qr }) => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  const rotateMutation = useRotateQrPassword();

  const policy = useMemo(() => evaluatePolicy(newPassword), [newPassword]);
  const policyOk = isPolicyOk(policy);
  const passwordsMatch = newPassword === confirm && newPassword.length > 0;

  const handleClose = (): void => {
    setNewPassword('');
    setConfirm('');
    setSubmitError('');
    onHide();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');

    if (!qr) return;
    if (!policyOk) {
      setSubmitError('La contraseña no cumple la política.');
      return;
    }
    if (!passwordsMatch) {
      setSubmitError('Las contraseñas no coinciden.');
      return;
    }

    try {
      await rotateMutation.mutateAsync({ id: qr._id, data: { newPassword } });
      toast.success('Contraseña rotada. Las sesiones activas quedaron invalidadas.');
      handleClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'No fue posible rotar la contraseña.';
      setSubmitError(message);
    }
  };

  const PolicyRule: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
    <div className={`small ${ok ? 'text-success' : 'text-muted'}`}>
      {ok ? '✓' : '○'} {label}
    </div>
  );

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Rotar contraseña del QR</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="warning" className="small">
            <strong>Atención:</strong> al rotar la contraseña, todos los usuarios con sesión activa
            (sessionToken) deberán volver a ingresar la nueva contraseña en el formulario público.
          </Alert>

          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Form.Group className="mb-3" controlId="rotateNewPassword">
            <Form.Label>Nueva contraseña</Form.Label>
            <Form.Control
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              maxLength={QR_PASSWORD_MAX}
              autoComplete="new-password"
              required
            />
            <div className="mt-2">
              <PolicyRule ok={policy.length} label={`${QR_PASSWORD_MIN}–${QR_PASSWORD_MAX} caracteres`} />
              <PolicyRule ok={policy.upper} label="Una mayúscula" />
              <PolicyRule ok={policy.lower} label="Una minúscula" />
              <PolicyRule ok={policy.digit} label="Un dígito" />
            </div>
          </Form.Group>

          <Form.Group className="mb-3" controlId="rotateConfirm">
            <Form.Label>Confirmar nueva contraseña</Form.Label>
            <Form.Control
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              isInvalid={confirm.length > 0 && !passwordsMatch}
            />
            <Form.Control.Feedback type="invalid">Las contraseñas no coinciden.</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="warning"
            disabled={!policyOk || !passwordsMatch || rotateMutation.isLoading}
          >
            {rotateMutation.isLoading ? 'Rotando...' : 'Rotar contraseña'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RotatePasswordModal;
