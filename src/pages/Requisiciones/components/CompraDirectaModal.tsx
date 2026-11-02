import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useCustomers } from '@/hooks/useCustomers';
import CrearProveedorModal from '@/components/customers/CrearProveedorModal';
import type { Customer } from '@/types/customer.types';
import { useCompraDirecta } from '@/hooks/useLicitacion';
import { COMPRA_DIRECTA_MIN_JUSTIFICACION } from '@/types/licitacion.types';
import type { Requisicion } from '@/types/requisicion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import ReqHelp from '../help/ReqHelp';

const CREAR = '__crear__';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicion: Requisicion;
}

/** Awards the requisicion to one catalog supplier without a licitacion, with a mandatory justification. */
const CompraDirectaModal: React.FC<Props> = ({ show, onHide, requisicion }) => {
  const [proveedorId, setProveedorId] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const mutation = useCompraDirecta();
  const { data, isLoading, isError } = useCustomers({ kind: 'provider', limit: 100, sortBy: 'Razonsocial', order: 'asc' }, { enabled: show });

  useEffect(() => {
    if (show) {
      setProveedorId('');
      setJustificacion('');
    }
  }, [show]);

  const [mostrarCrear, setMostrarCrear] = useState(false);
  // Providers created from this picker are listed at once, before the catalog query refetches.
  const [creados, setCreados] = useState<Customer[]>([]);
  const options = useMemo(() => {
    const base = data?.data ?? [];
    return [...base, ...creados.filter((c) => !base.some((b) => b._id === c._id))].filter((c) => !!c._id);
  }, [data, creados]);
  const handleCreated = (provider: Customer) => {
    setMostrarCrear(false);
    setCreados((prev) => [...prev, provider]);
    setProveedorId(provider._id ?? '');
  };
  const text = justificacion.trim();
  const tooShort = text.length > 0 && text.length < COMPRA_DIRECTA_MIN_JUSTIFICACION;
  const invalid = !proveedorId || text.length < COMPRA_DIRECTA_MIN_JUSTIFICACION;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid || mutation.isLoading) return;
    try {
      await mutation.mutateAsync({ id: requisicion._id, data: { proveedorId, justificacion: text } });
      toast.success('Compra directa registrada. La requisición quedó adjudicada.');
      onHide();
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible registrar la compra directa.'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>
            Compra directa
            <ReqHelp id="accion.compraDirecta" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="small">
            Adjudicarás {requisicion.consecutivo} a un proveedor sin licitación. La justificación queda en el historial.
          </Alert>
          {isError && <Alert variant="danger">No fue posible cargar el catálogo de proveedores.</Alert>}
          <Form.Group className="mb-3" controlId="compra-directa-proveedor">
            <Form.Label>Proveedor *</Form.Label>
            {isLoading ? (
              <div>
                <Spinner size="sm" animation="border" aria-label="Cargando proveedores" />
              </div>
            ) : (
              <Form.Select value={proveedorId} onChange={(e) => (e.target.value === CREAR ? setMostrarCrear(true) : setProveedorId(e.target.value))} disabled={mutation.isLoading}>
                <option value="">Selecciona un proveedor</option>
                {options.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.Razonsocial}
                  </option>
                ))}
                <option value={CREAR}>+ Crear proveedor</option>
              </Form.Select>
            )}
          </Form.Group>
          <Form.Group controlId="compra-directa-justificacion">
            <Form.Label>Justificación *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              maxLength={2000}
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              isInvalid={tooShort}
              disabled={mutation.isLoading}
            />
            <Form.Control.Feedback type="invalid">
              La justificación debe tener al menos {COMPRA_DIRECTA_MIN_JUSTIFICACION} caracteres.
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              {text.length}/{COMPRA_DIRECTA_MIN_JUSTIFICACION} caracteres como mínimo.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={mutation.isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={invalid || mutation.isLoading}>
            {mutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Registrar compra directa
          </Button>
        </Modal.Footer>
      </Form>
      <CrearProveedorModal
        show={mostrarCrear}
        onClose={() => setMostrarCrear(false)}
        onCreated={handleCreated}
      />
    </Modal>
  );
};

export default CompraDirectaModal;
