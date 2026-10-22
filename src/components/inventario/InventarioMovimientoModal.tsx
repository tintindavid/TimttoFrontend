import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useCreateInventarioMovimiento } from '@/hooks/useInventarioMovimientos';
import {
  INVENTARIO_MOVIMIENTO_LABELS,
  type InventarioMovimientoTipo,
  type InventarioRepuesto,
} from '@/types/inventarioRepuesto.types';
import { getApiErrorMessage } from './getApiErrorMessage';

interface InventarioMovimientoModalProps {
  show: boolean;
  onHide: () => void;
  item: InventarioRepuesto | null;
}

const InventarioMovimientoModal: React.FC<InventarioMovimientoModalProps> = ({ show, onHide, item }) => {
  const mutation = useCreateInventarioMovimiento();
  const [tipo, setTipo] = useState<InventarioMovimientoTipo>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setTipo('entrada');
      setCantidad('');
      setMotivo('');
      setError(null);
    }
  }, [show]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!item?._id) return;
    const qty = Number(cantidad);
    const isAjuste = tipo === 'ajuste';
    if (!Number.isFinite(qty) || qty === 0 || (!isAjuste && qty < 0)) {
      setError(isAjuste ? 'La cantidad del ajuste no puede ser cero' : 'La cantidad debe ser mayor que cero');
      return;
    }
    if (tipo === 'ajuste' && !motivo.trim()) {
      setError('El motivo es obligatorio en un ajuste');
      return;
    }
    try {
      await mutation.mutateAsync({
        itemId: item._id,
        tipo,
        cantidad: qty,
        motivo: motivo.trim() || undefined,
      });
      toast.success('Movimiento registrado');
      onHide();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error registrando el movimiento'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>Registrar movimiento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">
            <strong>{item?.nombre}</strong> — stock actual: {item?.stockActual ?? 0} {item?.unidad || ''}
          </p>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-2" controlId="inv-mov-tipo">
            <Form.Label>Tipo de movimiento</Form.Label>
            <Form.Select value={tipo} onChange={(e) => setTipo(e.target.value as InventarioMovimientoTipo)}>
              {(Object.keys(INVENTARIO_MOVIMIENTO_LABELS) as InventarioMovimientoTipo[]).map((t) => (
                <option key={t} value={t}>
                  {INVENTARIO_MOVIMIENTO_LABELS[t]}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2" controlId="inv-mov-cantidad">
            <Form.Label>Cantidad</Form.Label>
            <Form.Control
              type="number"
              min={tipo === 'ajuste' ? undefined : 0}
              step="any"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
            {tipo === 'ajuste' && (
              <Form.Text muted>Use un valor negativo para restar stock y positivo para sumar.</Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-2" controlId="inv-mov-motivo">
            <Form.Label>Motivo{tipo === 'ajuste' ? ' *' : ''}</Form.Label>
            <Form.Control value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={mutation.isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Guardando...' : 'Registrar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default InventarioMovimientoModal;
