import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useReenviarOrdenCompra } from '@/hooks/useOrdenCompra';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicionId: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Asks for the supplier's e-mail when the previous send found none on file (estadoCorreo `Sin_correo`). */
const ReenviarOcModal: React.FC<Props> = ({ show, onHide, requisicionId }) => {
  const [correo, setCorreo] = useState('');
  const mutation = useReenviarOrdenCompra();

  useEffect(() => {
    if (show) setCorreo('');
  }, [show]);

  const trimmed = correo.trim();
  const error = trimmed && !EMAIL_RE.test(trimmed) ? 'Ingresa un correo válido.' : '';
  const invalid = !trimmed || !!error;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid || mutation.isLoading) return;
    try {
      await mutation.mutateAsync({ id: requisicionId, correoEnvio: trimmed });
      toast.success('Correo enviado al proveedor.');
      onHide();
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible reenviar la orden de compra.'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>Enviar correo al proveedor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="small">
            El proveedor ganador no tiene un correo registrado. Indica a dónde enviar el enlace de su portal; el enlace anterior dejará de funcionar.
          </Alert>
          <Form.Group controlId="reenviar-oc-correo">
            <Form.Label>Correo del proveedor *</Form.Label>
            <Form.Control type="email" value={correo} isInvalid={!!error} onChange={(e) => setCorreo(e.target.value)} autoFocus />
            <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={mutation.isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={invalid || mutation.isLoading}>
            {mutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Enviar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReenviarOcModal;
