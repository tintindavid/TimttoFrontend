import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useReenviarInvitacion } from '@/hooks/useLicitacion';
import type { ProveedorLicitacion } from '@/types/licitacion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicionId: string;
  proveedor: ProveedorLicitacion | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Resends the invitation of one supplier, optionally to a new e-mail. The previous link stops working. */
const ReenviarInvitacionModal: React.FC<Props> = ({ show, onHide, requisicionId, proveedor }) => {
  const [correo, setCorreo] = useState('');
  const mutation = useReenviarInvitacion();

  useEffect(() => {
    if (show) setCorreo(proveedor?.correoEnvio ?? '');
  }, [show, proveedor]);

  const invalid = correo.trim() !== '' && !EMAIL_RE.test(correo.trim());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!proveedor || invalid || mutation.isLoading) return;
    const changed = correo.trim() && correo.trim() !== proveedor.correoEnvio;
    try {
      const result = await mutation.mutateAsync({
        id: requisicionId,
        paId: proveedor._id,
        data: changed ? { correoEnvio: correo.trim() } : {},
      });
      if ((result.data?.envios?.fallidos ?? []).length > 0) {
        toast.warning('No se pudo enviar el correo. Verifica la dirección e inténtalo de nuevo.');
      } else {
        toast.success('Invitación reenviada.');
      }
      onHide();
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible reenviar la invitación.'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>Reenviar invitación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">
            Proveedor: <strong>{proveedor?.nombre}</strong>
          </p>
          <Alert variant="warning" className="small">
            Se generará un enlace nuevo; el enlace anterior dejará de funcionar.
          </Alert>
          <Form.Group controlId="reenviar-correo">
            <Form.Label>Correo de envío</Form.Label>
            <Form.Control
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              isInvalid={invalid}
              disabled={mutation.isLoading}
            />
            <Form.Control.Feedback type="invalid">Ingresa un correo válido.</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={mutation.isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={invalid || mutation.isLoading}>
            {mutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Reenviar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReenviarInvitacionModal;
