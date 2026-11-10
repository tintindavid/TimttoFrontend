import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useEditarOrdenCompra, useEmitirOrdenCompra } from '@/hooks/useOrdenCompra';
import type { OrdenCompraDto } from '@/types/ordenCompra.types';
import type { Requisicion } from '@/types/requisicion.types';
import { formatMoney } from '@/utils/requisicion.utils';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import ReqHelp from '../help/ReqHelp';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicion: Requisicion;
  /** `emitir` starts with blank prices; `editar` is prefilled from the current purchase order. */
  mode: 'emitir' | 'editar';
}

/** Today as YYYY-MM-DD in local time (the minimum selectable delivery date). */
const todayIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const toDateInput = (value?: string | null): string => (value ? value.slice(0, 10) : '');

/** Issues (or edits, while still Emitida) the purchase order: real unit price per line, conditions and delivery date. */
const OrdenCompraModal: React.FC<Props> = ({ show, onHide, requisicion, mode }) => {
  const emitir = useEmitirOrdenCompra();
  const editar = useEditarOrdenCompra();
  const mutation = mode === 'emitir' ? emitir : editar;
  const oc = requisicion.ordenCompra;

  // Cancelled lines are not bought; the quantity of every other line comes from the requisicion.
  const lineas = useMemo(() => requisicion.lineas.filter((l) => l.estadoLinea !== 'Cancelada' && !!l._id), [requisicion.lineas]);

  const [precios, setPrecios] = useState<Record<string, string>>({});
  const [condiciones, setCondiciones] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [requiereEntregables, setRequiereEntregables] = useState(false);

  useEffect(() => {
    if (!show) return;
    const initial: Record<string, string> = {};
    lineas.forEach((l) => {
      const current = mode === 'editar' ? oc?.lineas.find((x) => x.lineaId === l._id) : undefined;
      initial[l._id as string] = current ? String(current.precioUnitario) : '';
    });
    setPrecios(initial);
    setCondiciones(mode === 'editar' ? oc?.condiciones ?? '' : '');
    setFechaEntrega(mode === 'editar' ? toDateInput(oc?.fechaEntrega) : '');
    setRequiereEntregables(mode === 'editar' ? !!oc?.requiereEntregables : false);
    // Reset only when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, mode]);

  const priceOf = (lineaId: string): number | null => {
    const raw = (precios[lineaId] ?? '').trim();
    if (raw === '') return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };

  // Integer cents per line, like the server, so the preview never differs by a float rounding.
  const total = lineas.reduce((sum, l) => sum + Math.round((priceOf(l._id as string) ?? 0) * l.cantidadSolicitada * 100), 0) / 100;
  const missingPrice = lineas.some((l) => priceOf(l._id as string) === null);
  const fechaError = fechaEntrega !== '' && fechaEntrega < todayIso() ? 'La fecha de entrega no puede ser anterior a hoy.' : '';
  const invalid = lineas.length === 0 || missingPrice || fechaEntrega === '' || !!fechaError;
  const moneda = requisicion.moneda;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid || mutation.isLoading) return;
    const data: OrdenCompraDto = {
      lineas: lineas.map((l) => ({ lineaId: l._id as string, precioUnitario: priceOf(l._id as string) as number })),
      condiciones: condiciones.trim() || undefined,
      fechaEntrega,
      requiereEntregables,
    };
    try {
      await mutation.mutateAsync({ id: requisicion._id, data });
      toast.success(mode === 'emitir' ? 'Orden de compra emitida.' : 'Orden de compra actualizada.');
      onHide();
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible guardar la orden de compra.'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>
            {mode === 'emitir' ? 'Emitir orden de compra' : `Editar orden de compra ${oc?.numero ?? ''}`}
            <ReqHelp id="accion.emitirOc" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="small">
            Ingresa el precio unitario real acordado con el proveedor ganador. El total lo calcula el sistema; si supera el
            estimado más el margen configurado (10 % por defecto) o la requisición no tenía estimado, la orden requerirá reaprobación.
          </Alert>
          <div className="table-responsive">
            <Table size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Línea</th>
                  <th className="text-end">Cantidad</th>
                  <th className="text-end">Precio estimado</th>
                  <th>Precio unitario real *</th>
                  <th className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l) => {
                  const id = l._id as string;
                  const price = priceOf(id);
                  const touched = (precios[id] ?? '') !== '' && price === null;
                  return (
                    <tr key={id}>
                      <td>{l.descripcion}</td>
                      <td className="text-end">{l.cantidadSolicitada}</td>
                      <td className="text-end">{formatMoney(l.precioEstimado, l.moneda ?? moneda)}</td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          min={0}
                          step="any"
                          aria-label={`Precio unitario de ${l.descripcion}`}
                          value={precios[id] ?? ''}
                          isInvalid={touched}
                          onChange={(e) => setPrecios((prev) => ({ ...prev, [id]: e.target.value }))}
                        />
                      </td>
                      <td className="text-end">{price === null ? '—' : formatMoney(Math.round(price * l.cantidadSolicitada * 100) / 100, moneda)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={4} className="text-end">
                    Total de la orden
                  </th>
                  <th className="text-end" data-testid="oc-modal-total">
                    {formatMoney(total, moneda)}
                  </th>
                </tr>
                <tr>
                  <td colSpan={4} className="text-end text-muted small">
                    Monto estimado de la requisición
                  </td>
                  <td className="text-end text-muted small">{formatMoney(requisicion.montoEstimado, moneda)}</td>
                </tr>
              </tfoot>
            </Table>
          </div>
          <Form.Group className="mb-3" controlId="oc-fecha-entrega">
            <Form.Label>Fecha de entrega *</Form.Label>
            <Form.Control
              type="date"
              min={todayIso()}
              value={fechaEntrega}
              isInvalid={!!fechaError}
              onChange={(e) => setFechaEntrega(e.target.value)}
            />
            <Form.Control.Feedback type="invalid">{fechaError}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="oc-condiciones">
            <Form.Label>Condiciones</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={2000}
              value={condiciones}
              onChange={(e) => setCondiciones(e.target.value)}
              placeholder="Forma de pago, garantía, lugar de entrega…"
            />
          </Form.Group>
          <Form.Group controlId="oc-requiere-entregables">
            <Form.Check
              type="switch"
              label="Exigir entregables al proveedor (soportes que se revisan antes de cerrar la requisición)"
              checked={requiereEntregables}
              onChange={(e) => setRequiereEntregables(e.target.checked)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={mutation.isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={invalid || mutation.isLoading}>
            {mutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            {mode === 'emitir' ? 'Emitir orden' : 'Guardar cambios'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default OrdenCompraModal;
