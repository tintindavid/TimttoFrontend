import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useCustomers } from '@/hooks/useCustomers';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { useCreateServiceQr } from '@/hooks/useServiceQrs';
import {
  QR_PASSWORD_MAX,
  QR_PASSWORD_MIN,
  QR_PASSWORD_RULES,
} from '@/constants/ticket.constants';
import { Customer } from '@/types/customer.types';
import { Sede } from '@/types/sede.types';
import { Servicio } from '@/types/servicio.types';

interface CreateServiceQrModalProps {
  show: boolean;
  onHide: () => void;
  /**
   * When provided, the cliente selector is pre-filled and locked.
   * Used from `CustomerDetailPage > QRs tab` where the cliente is fixed.
   */
  defaultClienteId?: string;
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

const CreateServiceQrModal: React.FC<CreateServiceQrModalProps> = ({ show, onHide, defaultClienteId }) => {
  const [clienteId, setClienteId] = useState<string>(defaultClienteId ?? '');
  const [sedeId, setSedeId] = useState<string>('');
  const [servicioId, setServicioId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  // Re-sync the locked cliente when the parent changes context (or re-opens).
  useEffect(() => {
    if (defaultClienteId) setClienteId(defaultClienteId);
  }, [defaultClienteId, show]);

  const createMutation = useCreateServiceQr();
  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const customers: Customer[] = (customersData?.data ?? []) as Customer[];

  const { data: sedesData, isLoading: loadingSedes } = useSedesByCustomer(
    clienteId,
    {},
    { enabled: !!clienteId },
  );
  const sedes: Sede[] = (sedesData?.data ?? []) as Sede[];

  const { data: serviciosData, isLoading: loadingServicios } = useServiciosByCustomer(
    clienteId,
    {},
    { enabled: !!clienteId },
  );
  const servicios: Servicio[] = (serviciosData?.data ?? []) as Servicio[];

  useEffect(() => {
    setSedeId('');
    setServicioId('');
  }, [clienteId]);

  const policy = useMemo(() => evaluatePolicy(password), [password]);
  const policyOk = isPolicyOk(policy);
  const passwordsMatch = password === confirm && password.length > 0;

  const handleClose = (): void => {
    setClienteId(defaultClienteId ?? '');
    setSedeId('');
    setServicioId('');
    setPassword('');
    setConfirm('');
    setSubmitError('');
    onHide();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');

    if (!clienteId || !sedeId || !servicioId) {
      setSubmitError('Seleccione cliente, sede y servicio.');
      return;
    }
    if (!policyOk) {
      setSubmitError('La contraseña no cumple la política.');
      return;
    }
    if (!passwordsMatch) {
      setSubmitError('Las contraseñas no coinciden.');
      return;
    }

    try {
      await createMutation.mutateAsync({ ClienteId: clienteId, sedeId, servicioId, password });
      toast.success('QR creado correctamente.');
      handleClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string; code?: string } } }).response?.data?.message;
      const code = (err as { response?: { data?: { code?: string } } }).response?.data?.code;
      setSubmitError(
        code === 'QR_ALREADY_EXISTS'
          ? 'Ya existe un QR activo para esa combinación de cliente, sede y servicio.'
          : message || 'No fue posible crear el QR.',
      );
    }
  };

  const PolicyRule: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
    <div className={`small ${ok ? 'text-success' : 'text-muted'}`}>
      {ok ? '✓' : '○'} {label}
    </div>
  );

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Crear QR de Servicio</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Form.Group className="mb-3" controlId="qrCliente">
            <Form.Label>Cliente</Form.Label>
            {loadingCustomers ? (
              <Spinner size="sm" animation="border" />
            ) : (
              <Form.Select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
                disabled={!!defaultClienteId}
              >
                <option value="">Seleccionar...</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.Razonsocial || 'Sin nombre'}</option>
                ))}
              </Form.Select>
            )}
            {defaultClienteId && (
              <Form.Text className="text-muted">Cliente fijado por el contexto.</Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3" controlId="qrSede">
            <Form.Label>Sede</Form.Label>
            <Form.Select
              value={sedeId}
              onChange={(e) => setSedeId(e.target.value)}
              disabled={!clienteId || loadingSedes}
              required
            >
              <option value="">{loadingSedes ? 'Cargando...' : 'Seleccionar...'}</option>
              {sedes.map((s) => (
                <option key={s._id} value={s._id}>{s.nombreSede || 'Sin nombre'}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="qrServicio">
            <Form.Label>Servicio</Form.Label>
            <Form.Select
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
              disabled={!clienteId || loadingServicios}
              required
            >
              <option value="">{loadingServicios ? 'Cargando...' : 'Seleccionar...'}</option>
              {servicios.map((s) => (
                <option key={s._id} value={s._id}>{s.nombre || 'Sin nombre'}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="qrPassword">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <Form.Group className="mb-3" controlId="qrPasswordConfirm">
            <Form.Label>Confirmar contraseña</Form.Label>
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
            variant="primary"
            disabled={!policyOk || !passwordsMatch || createMutation.isLoading}
          >
            {createMutation.isLoading ? 'Creando...' : 'Crear QR'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateServiceQrModal;
