import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAbrirLicitacion } from '@/hooks/useLicitacion';
import { INSTRUCCIONES_MAX } from '@/types/licitacion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import ReqHelp from '../help/ReqHelp';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicionId: string;
}

const MAX_DAYS = 90;

/** `YYYY-MM-DDTHH:mm` (local) for a `datetime-local` input. */
const toLocalInput = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Asks for the quotation deadline (future, up to 90 days) and opens the licitacion. */
const AbrirLicitacionModal: React.FC<Props> = ({ show, onHide, requisicionId }) => {
  const [fecha, setFecha] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const mutation = useAbrirLicitacion();

  useEffect(() => {
    if (show) {
      setFecha('');
      setInstrucciones('');
    }
  }, [show]);

  const parsed = fecha ? new Date(fecha) : null;
  const now = Date.now();
  let error = '';
  if (parsed) {
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= now) error = 'La fecha límite debe ser futura.';
    else if (parsed.getTime() > now + MAX_DAYS * 24 * 60 * 60 * 1000) {
      error = `La fecha límite no puede superar ${MAX_DAYS} días.`;
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!parsed || error || mutation.isLoading) return;
    try {
      const result = await mutation.mutateAsync({
        id: requisicionId,
        data: {
          fechaLimiteCotizacion: parsed.toISOString(),
          ...(instrucciones.trim() ? { instrucciones: instrucciones.trim() } : {}),
        },
      });
      const fallidos = result.data?.envios?.fallidos ?? [];
      if (fallidos.length > 0) {
        toast.warning(
          `Licitación abierta. ${fallidos.length} invitación(es) no se pudieron enviar; puedes reenviarlas desde la lista.`
        );
      } else {
        toast.success('Licitación abierta e invitaciones enviadas.');
      }
      onHide();
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible abrir la licitación.'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>
            Abrir licitación
            <ReqHelp id="accion.abrirLicitacion" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="small">
            Se enviará un correo con un enlace personal a cada proveedor asignado.
          </Alert>
          <Form.Group controlId="abrir-licitacion-fecha">
            <Form.Label>Fecha límite para cotizar *</Form.Label>
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
          <Form.Group className="mt-3" controlId="abrir-licitacion-instrucciones">
            <Form.Label>Instrucciones para los proveedores</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={INSTRUCCIONES_MAX}
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              disabled={mutation.isLoading}
            />
            <Form.Text className="text-muted">
              Opcional. Los proveedores lo verán en el portal; no incluyas información interna. {instrucciones.length}/{INSTRUCCIONES_MAX}
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={mutation.isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!parsed || !!error || mutation.isLoading}>
            {mutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Abrir y enviar invitaciones
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AbrirLicitacionModal;
