import React, { useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { useCreateCustomer } from '@/hooks/useCustomers';
import type { Customer } from '@/types/customer.types';

interface Props {
  show: boolean;
  onClose: () => void;
  /** Called with the provider just created, so the caller can select it. */
  onCreated: (provider: Customer) => void;
}

const EMPTY = { Razonsocial: '', Nit: '', Ciudad: '', Departamento: '', Email: '', TelContacto: '', Direccion: '' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorMessage = (err: unknown): string => {
  const e = err as { response?: { data?: { message?: string; error?: { code?: string } } }; message?: string };
  const code = e?.response?.data?.error?.code;
  if (code === 'FORBIDDEN') return 'No tienes permiso para crear proveedores.';
  return e?.response?.data?.message || e?.message || 'No se pudo crear el proveedor.';
};

/**
 * Quick creation of a provider third party (Customer kind=provider) from places that need to pick one,
 * such as the external activity form. Same mandatory fields as the Terceros form: razón social, NIT, ciudad,
 * departamento and email. Providers never carry a logo.
 */
const CrearProveedorModal: React.FC<Props> = ({ show, onClose, onCreated }) => {
  const createMutation = useCreateCustomer();
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState<string | null>(null);

  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  const close = () => {
    setForm(EMPTY);
    setErr(null);
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // This dialog is rendered through a portal inside other dialogs: keep the submit from reaching their forms.
    e.stopPropagation();
    const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as typeof EMPTY;
    if (!trimmed.Razonsocial || !trimmed.Nit || !trimmed.Ciudad || !trimmed.Departamento || !trimmed.Email) {
      setErr('Razón social, NIT, ciudad, departamento y correo son obligatorios.');
      return;
    }
    if (!/^\d+$/.test(trimmed.Nit)) {
      setErr('El NIT debe contener solo números (sin dígito de verificación ni guiones).');
      return;
    }
    if (!EMAIL.test(trimmed.Email)) {
      setErr('Ingresa un correo válido.');
      return;
    }

    const fd = new FormData();
    fd.append('kind', 'provider');
    fd.append('Razonsocial', trimmed.Razonsocial);
    fd.append('Nit', trimmed.Nit);
    fd.append('Ciudad', trimmed.Ciudad);
    fd.append('Departamento', trimmed.Departamento);
    fd.append('Email', trimmed.Email);
    if (trimmed.TelContacto) fd.append('TelContacto', trimmed.TelContacto);
    if (trimmed.Direccion) fd.append('Direccion', trimmed.Direccion);

    try {
      const res = await createMutation.mutateAsync(fd);
      const created = res.data as Customer;
      setForm(EMPTY);
      setErr(null);
      onCreated(created);
    } catch (error) {
      setErr(errorMessage(error));
    }
  };

  return (
    <Modal show={show} onHide={close} centered>
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>Crear proveedor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {err && <Alert variant="danger">{err}</Alert>}
          <Form.Group className="mb-3" controlId="prov-razon">
            <Form.Label>Razón social *</Form.Label>
            <Form.Control value={form.Razonsocial} onChange={(e) => set({ Razonsocial: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="prov-nit">
            <Form.Label>NIT *</Form.Label>
            <Form.Control inputMode="numeric" value={form.Nit} onChange={(e) => set({ Nit: e.target.value })} />
          </Form.Group>
          <Row>
            <Col>
              <Form.Group className="mb-3" controlId="prov-ciudad">
                <Form.Label>Ciudad *</Form.Label>
                <Form.Control value={form.Ciudad} onChange={(e) => set({ Ciudad: e.target.value })} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3" controlId="prov-depto">
                <Form.Label>Departamento *</Form.Label>
                <Form.Control value={form.Departamento} onChange={(e) => set({ Departamento: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="prov-email">
            <Form.Label>Correo *</Form.Label>
            <Form.Control type="email" value={form.Email} onChange={(e) => set({ Email: e.target.value })} />
          </Form.Group>
          <Row>
            <Col>
              <Form.Group className="mb-3" controlId="prov-tel">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control value={form.TelContacto} onChange={(e) => set({ TelContacto: e.target.value })} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3" controlId="prov-dir">
                <Form.Label>Dirección</Form.Label>
                <Form.Control value={form.Direccion} onChange={(e) => set({ Direccion: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={close} disabled={createMutation.isLoading}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={createMutation.isLoading}>Crear proveedor</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CrearProveedorModal;
