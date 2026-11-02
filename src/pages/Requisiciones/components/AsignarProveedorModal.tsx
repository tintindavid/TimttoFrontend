import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useCustomers } from '@/hooks/useCustomers';
import CrearProveedorModal from '@/components/customers/CrearProveedorModal';
import type { Customer } from '@/types/customer.types';
import { useAsignarProveedor } from '@/hooks/useLicitacion';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicionId: string;
  /** Catalog ids already assigned, to hide them from the picker. */
  assignedIds: string[];
}

const CREAR = '__crear__';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Picks a provider (third party of kind `provider`) and the e-mail where its invitation will be sent. */
const AsignarProveedorModal: React.FC<Props> = ({ show, onHide, requisicionId, assignedIds }) => {
  const [proveedorId, setProveedorId] = useState('');
  const [correo, setCorreo] = useState('');
  const [touchedCorreo, setTouchedCorreo] = useState(false);
  const mutation = useAsignarProveedor();
  const [mostrarCrear, setMostrarCrear] = useState(false);
  // Providers created from this picker are listed at once, before the catalog query refetches.
  const [creados, setCreados] = useState<Customer[]>([]);
  const { data, isLoading, isError } = useCustomers({ kind: 'provider', limit: 100, sortBy: 'Razonsocial', order: 'asc' }, { enabled: show });

  useEffect(() => {
    if (show) {
      setProveedorId('');
      setCorreo('');
      setTouchedCorreo(false);
      setCreados([]);
    }
  }, [show]);

  const options = useMemo(() => {
    const base = data?.data ?? [];
    const all = [...base, ...creados.filter((c) => !base.some((b) => b._id === c._id))];
    return all.filter((c) => c._id && !assignedIds.includes(c._id));
  }, [data, creados, assignedIds]);

  const selected = options.find((c) => c._id === proveedorId);
  const correoValue = correo.trim() || selected?.Email || '';
  const correoInvalid = correoValue !== '' && !EMAIL_RE.test(correoValue);

  const handleCreated = (provider: Customer) => {
    setMostrarCrear(false);
    setCreados((prev) => [...prev, provider]);
    setProveedorId(provider._id ?? '');
    setCorreo('');
    setTouchedCorreo(false);
  };

  const handleSelect = (value: string) => {
    if (value === CREAR) {
      setMostrarCrear(true);
      return;
    }
    setProveedorId(value);
    setCorreo('');
    setTouchedCorreo(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!proveedorId || correoInvalid || mutation.isLoading) return;
    try {
      await mutation.mutateAsync({
        id: requisicionId,
        data: { proveedorId, ...(correo.trim() ? { correoEnvio: correo.trim() } : {}) },
      });
      toast.success('Proveedor asignado.');
      onHide();
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible asignar el proveedor.'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>Asignar proveedor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isError && <Alert variant="danger">No fue posible cargar el catálogo de proveedores.</Alert>}
          <Form.Group className="mb-3" controlId="asignar-proveedor-select">
            <Form.Label>Proveedor *</Form.Label>
            {isLoading ? (
              <div>
                <Spinner size="sm" animation="border" aria-label="Cargando proveedores" />
              </div>
            ) : (
              <Form.Select value={proveedorId} onChange={(e) => handleSelect(e.target.value)} disabled={mutation.isLoading}>
                <option value="">Selecciona un proveedor</option>
                {options.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.Razonsocial}
                  </option>
                ))}
                <option value={CREAR}>+ Crear proveedor</option>
              </Form.Select>
            )}
            {!isLoading && !isError && options.length === 0 && (
              <Form.Text className="text-muted">No hay proveedores disponibles en el catálogo de terceros.</Form.Text>
            )}
          </Form.Group>
          <Form.Group controlId="asignar-proveedor-correo">
            <Form.Label>Correo de envío</Form.Label>
            <Form.Control
              type="email"
              value={correo}
              placeholder={selected?.Email ?? 'correo@proveedor.com'}
              onChange={(e) => setCorreo(e.target.value)}
              onBlur={() => setTouchedCorreo(true)}
              isInvalid={touchedCorreo && correoInvalid}
              disabled={mutation.isLoading}
            />
            <Form.Control.Feedback type="invalid">Ingresa un correo válido.</Form.Control.Feedback>
            <Form.Text className="text-muted">
              Si lo dejas vacío se usa el correo del proveedor en el catálogo.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={mutation.isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!proveedorId || correoInvalid || mutation.isLoading}>
            {mutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Asignar
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

export default AsignarProveedorModal;
