import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useUpdateTenantCapabilities } from '@/hooks/usePlatformTenants';
import {
  TENANT_TYPE_PRESETS,
  getTenantType,
  type OrganizationCustomerCandidate,
  type PlatformTenant,
  type TenantType,
  type UpdateTenantCapabilitiesInput,
} from '@/types';

interface TenantCapabilitiesPanelProps {
  tenant: PlatformTenant;
}

interface Flags {
  executesServices: boolean;
  registersExternal: boolean;
}

const DEFAULT_FLAGS: Flags = { executesServices: true, registersExternal: false };
const TYPE_ORDER: TenantType[] = ['provider', 'client', 'hybrid'];

interface ApiErrorLike {
  response?: {
    status?: number;
    data?: { message?: string; error?: { code?: string; details?: unknown } };
  };
}

/**
 * Pulls the candidate clients out of the 409 payload. The backend contract does not fix
 * the exact key, so the usual shapes are accepted; an empty list falls back to a manual id.
 */
const extractCandidates = (err: ApiErrorLike): OrganizationCustomerCandidate[] => {
  const details = err.response?.data?.error?.details as
    | { customers?: unknown; candidates?: unknown; clients?: unknown }
    | unknown[]
    | undefined;
  const list = Array.isArray(details)
    ? details
    : (details?.customers ?? details?.candidates ?? details?.clients);
  if (!Array.isArray(list)) return [];
  return list.filter(
    (c): c is OrganizationCustomerCandidate =>
      !!c && typeof c === 'object' && typeof (c as { _id?: unknown })._id === 'string'
  );
};

const TenantCapabilitiesPanel: React.FC<TenantCapabilitiesPanelProps> = ({ tenant }) => {
  const current: Flags = tenant.capabilities ?? DEFAULT_FLAGS;
  const currentType = getTenantType(current);

  const [flags, setFlags] = useState<Flags>(current);
  const [showConfirm, setShowConfirm] = useState(false);
  const [candidates, setCandidates] = useState<OrganizationCustomerCandidate[] | null>(null);
  const [chosenId, setChosenId] = useState('');
  const mutation = useUpdateTenantCapabilities();

  // Re-sync the form when the saved capabilities change (after a successful save).
  const savedExecutes = current.executesServices;
  const savedRegisters = current.registersExternal;
  useEffect(() => {
    setFlags({ executesServices: savedExecutes, registersExternal: savedRegisters });
  }, [savedExecutes, savedRegisters]);

  const nextType = getTenantType(flags);
  const invalid = !flags.executesServices && !flags.registersExternal;
  const unchanged =
    flags.executesServices === current.executesServices &&
    flags.registersExternal === current.registersExternal;

  const submit = (organizationCustomerId?: string) => {
    const input: UpdateTenantCapabilitiesInput = { ...flags };
    if (organizationCustomerId) input.organizationCustomerId = organizationCustomerId;
    mutation.mutate(
      { id: tenant._id, input },
      {
        onSuccess: () => {
          setShowConfirm(false);
          setCandidates(null);
          setChosenId('');
        },
        onError: (err: unknown) => {
          const apiErr = err as ApiErrorLike;
          if (
            apiErr.response?.status === 409 &&
            apiErr.response.data?.error?.code === 'ORGANIZATION_CUSTOMER_REQUIRED'
          ) {
            setShowConfirm(false);
            setCandidates(extractCandidates(apiErr));
            return;
          }
          toast.error(apiErr.response?.data?.message || 'Error al actualizar las capacidades');
        },
      }
    );
  };

  return (
    <>
      <Card className="mt-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Capacidades de la organización</span>
          <Badge bg="primary" data-testid="current-type">
            {TENANT_TYPE_PRESETS[currentType].label}
          </Badge>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-2 flex-wrap mb-3" role="group" aria-label="Presets de tipo">
            {TYPE_ORDER.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={nextType === type ? 'primary' : 'outline-primary'}
                onClick={() =>
                  setFlags({
                    executesServices: TENANT_TYPE_PRESETS[type].executesServices,
                    registersExternal: TENANT_TYPE_PRESETS[type].registersExternal,
                  })
                }
              >
                {TENANT_TYPE_PRESETS[type].label}
              </Button>
            ))}
          </div>

          <Form.Check
            type="switch"
            id="cap-executes"
            label="Ejecuta servicios (órdenes de trabajo, informes, diario)"
            checked={flags.executesServices}
            onChange={(e) => setFlags((f) => ({ ...f, executesServices: e.target.checked }))}
          />
          <Form.Check
            type="switch"
            id="cap-registers"
            className="mt-2"
            label="Registra mantenimiento de terceros"
            checked={flags.registersExternal}
            onChange={(e) => setFlags((f) => ({ ...f, registersExternal: e.target.checked }))}
          />
          <Form.Text muted className="d-block mt-2">
            El registro de mantenimiento de terceros estará disponible en una versión posterior.
          </Form.Text>

          {invalid && (
            <Alert variant="danger" className="mt-3 mb-0">
              Debe quedar activa al menos una capacidad.
            </Alert>
          )}

          <div className="mt-3">
            <Button
              variant="primary"
              disabled={invalid || unchanged || mutation.isLoading}
              onClick={() => setShowConfirm(true)}
            >
              Guardar capacidades
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Confirmation */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar cambio de capacidades</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>{tenant.name}</strong> pasará de{' '}
            <strong>{TENANT_TYPE_PRESETS[currentType].label}</strong> a{' '}
            <strong>{TENANT_TYPE_PRESETS[nextType].label}</strong>.
          </p>
          {!flags.executesServices && (
            <Alert variant="warning" className="mb-0">
              Se ocultarán órdenes de trabajo, informes y diario, y se bloquearán las operaciones
              de escritura en esos módulos. El historial se conserva y no se elimina ningún dato.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => submit()} disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Guardando…' : 'Confirmar cambio'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 409 ORGANIZATION_CUSTOMER_REQUIRED: pick which client becomes the organization client */}
      <Modal show={candidates !== null} onHide={() => setCandidates(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Elegir el cliente de la organización</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Este tenant tiene varios clientes. Elige cuál será su cliente único (Mi información).
            Los demás clientes no se eliminan ni se reasignan.
          </p>
          {candidates && candidates.length > 0 ? (
            <Form.Group>
              <Form.Label>Cliente</Form.Label>
              <Form.Select
                aria-label="Cliente de la organización"
                value={chosenId}
                onChange={(e) => setChosenId(e.target.value)}
              >
                <option value="">Selecciona un cliente…</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.Razonsocial || c._id}
                    {c.Nit ? ` (NIT ${c.Nit})` : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          ) : (
            <Form.Group>
              <Form.Label>ID del cliente</Form.Label>
              <Form.Control
                aria-label="ID del cliente de la organización"
                value={chosenId}
                onChange={(e) => setChosenId(e.target.value.trim())}
                placeholder="ID del cliente"
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCandidates(null)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!chosenId || mutation.isLoading}
            onClick={() => submit(chosenId)}
          >
            {mutation.isLoading ? 'Guardando…' : 'Aplicar con este cliente'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TenantCapabilitiesPanel;
