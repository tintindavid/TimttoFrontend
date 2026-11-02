import React, { useEffect, useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAmpliarFecha } from '@/hooks/useLicitacion';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import ReqHelp from '../help/ReqHelp';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicionId: string;
}

const MAX_DAYS = 90;

const toLocalInput = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Moves the quotation deadline of an open licitacion (future, up to 90 days). */
const AmpliarFechaModal: React.FC<Props> = ({ show, onHide, requisicionId }) => {
  const [fecha, setFecha] = useState('');
  const mutation = useAmpliarFecha();

  useEffect(() => {
    if (show) setFecha('');
  }, [show]);

  const parsed = fecha ? new Date(fecha) : null;
  const now = Date.now();
  let error = '';
  if (parsed) {
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= now) error = 'La fecha límite debe ser futura.';
    else if (parsed.getTime() > now + MAX_DAYS * 24 * 60 * 60 * 1000) error = `La fecha límite no puede superar ${MAX_DAYS} días.`;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!parsed || error || mutation.isLoading) return;
    try {
      await mutation.mutateAsync({ id: requisicionId, data: { fechaLimiteCotizacion: parsed.toISOString() } });
      toast.success('Fecha límite actualizada.');
      onHide();
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible ampliar la fecha límite.'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>
            Ampliar fecha límite
            <ReqHelp id="accion.ampliarFecha" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="ampliar-fecha-limite">
            <Form.Label>Nueva fecha límite *</Form.Label>
            <Form.Control
              type="datetime-local"
              value={fecha}
              min={toLocalInput(new Date())}
              onChange={(e) => setFecha(e.target.value)}
              isInvalid={!!error}
              disabled={mutation.isLoading}
              autoFocus
            />
            <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
            <Form.Text className="text-muted">Máximo {MAX_DAYS} días desde hoy.</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={mutation.isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!parsed || !!error || mutation.isLoading}>
            {mutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Guardar fecha
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AmpliarFechaModal;
