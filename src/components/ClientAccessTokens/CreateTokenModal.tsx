import React, { useMemo, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaCopy } from 'react-icons/fa';
import { useOTsByCustomer } from '@/hooks/useOTs';
import { useCreateClientToken } from '@/hooks/clientAccessToken/useClientTokens';
import { OT } from '@/types/ot.types';
import { ClientAccessTokenCreateResponse } from '@/types/clientAccessToken.types';

interface CreateTokenModalProps {
  show: boolean;
  onHide: () => void;
  clienteId: string;
}

/** Extracts backend message/code from the `{ success:false, message, error:{code} }` envelope. */
const extractError = (
  err: unknown
): { message?: string; code?: string } => {
  const response = (
    err as { response?: { data?: { message?: string; error?: { code?: string } } } }
  ).response;
  return { message: response?.data?.message, code: response?.data?.error?.code };
};

const otLabel = (ot: OT): string =>
  `${ot.Consecutivo || ot._id} — ${ot.EstadoOt || 'Sin estado'}`;

/**
 * Modal used from `ClientTokensTab` to create a `ClientAccessToken`.
 * Two steps: (1) select OTs of the client, (2) show the resulting public
 * URL with a "Copiar" button — per "Admin creates a token from the tab" scenario.
 */
const CreateTokenModal: React.FC<CreateTokenModalProps> = ({ show, onHide, clienteId }) => {
  const [selectedOtIds, setSelectedOtIds] = useState<string[]>([]);
  const [includeCerradas, setIncludeCerradas] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [createdToken, setCreatedToken] = useState<ClientAccessTokenCreateResponse | null>(null);

  // `useOTsByCustomer` has its own `enabled: !!customerId` guard; the modal
  // is only ever mounted with a valid `clienteId` from `ClientTokensTab`.
  const { data: otsData, isLoading: loadingOts } = useOTsByCustomer(clienteId, {});
  const allOts: OT[] = (otsData?.data ?? []) as OT[];

  const availableOts = useMemo(
    () =>
      allOts.filter(
        (ot) => !ot.isDeleted && (includeCerradas || ot.EstadoOt !== 'Cerrada')
      ),
    [allOts, includeCerradas]
  );

  const createMutation = useCreateClientToken();

  const resetState = (): void => {
    setSelectedOtIds([]);
    setIncludeCerradas(false);
    setSubmitError('');
    setCreatedToken(null);
  };

  const handleClose = (): void => {
    resetState();
    onHide();
  };

  const toggleOt = (otId: string): void => {
    setSelectedOtIds((prev) =>
      prev.includes(otId) ? prev.filter((id) => id !== otId) : [...prev, otId]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');

    if (selectedOtIds.length === 0) {
      setSubmitError('Seleccione al menos una OT.');
      return;
    }

    try {
      const res = await createMutation.mutateAsync({ clienteId, otIds: selectedOtIds });
      setCreatedToken(res.data);
      toast.success('Acceso creado correctamente.');
    } catch (err) {
      const { message, code } = extractError(err);
      const friendly =
        code === 'USER_SIGNATURE_MISSING'
          ? 'Tu perfil no tiene firma cargada. Súbela desde tu perfil antes de emitir accesos cliente.'
          : code === 'OT_CLIENT_MISMATCH'
          ? 'Alguna de las OT seleccionadas no pertenece a este cliente.'
          : code === 'OT_NOT_AVAILABLE'
          ? 'Alguna de las OT seleccionadas ya no está disponible.'
          : message || 'No fue posible crear el acceso.';
      setSubmitError(friendly);
      toast.error(friendly);
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken.url);
      toast.success('Link copiado');
    } catch {
      toast.error('No fue posible copiar el link.');
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Crear acceso cliente</Modal.Title>
      </Modal.Header>

      {createdToken ? (
        <>
          <Modal.Body>
            <Alert variant="success" className="mb-3">
              Acceso creado. Comparta el siguiente link con el cliente.
            </Alert>
            <div className="small text-muted">URL pública</div>
            <div className="d-flex align-items-center gap-2">
              <code className="flex-grow-1 small text-break">{createdToken.url}</code>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={handleCopy}
                title="Copiar"
                aria-label="Copiar link"
              >
                <FaCopy className="me-1" />
                Copiar
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleClose}>
              Cerrar
            </Button>
          </Modal.Footer>
        </>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {submitError && <Alert variant="danger">{submitError}</Alert>}

            <Form.Check
              type="checkbox"
              id="createTokenIncludeCerradas"
              label="Incluir OT cerradas"
              checked={includeCerradas}
              onChange={(e) => setIncludeCerradas(e.target.checked)}
              className="mb-3"
            />

            <Form.Label>Seleccione las OT a compartir</Form.Label>
            {loadingOts ? (
              <div className="text-center py-3">
                <Spinner size="sm" animation="border" aria-label="Cargando OTs" />
              </div>
            ) : availableOts.length === 0 ? (
              <Alert variant="info" className="mb-0">
                Este cliente no tiene OT disponibles para compartir.
              </Alert>
            ) : (
              <div className="border rounded p-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
                {availableOts.map((ot) => (
                  <Form.Check
                    key={ot._id}
                    type="checkbox"
                    id={`create-token-ot-${ot._id}`}
                    label={otLabel(ot)}
                    checked={!!ot._id && selectedOtIds.includes(ot._id)}
                    onChange={() => ot._id && toggleOt(ot._id)}
                  />
                ))}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={selectedOtIds.length === 0 || createMutation.isLoading}
            >
              {createMutation.isLoading ? 'Creando...' : 'Crear acceso'}
            </Button>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  );
};

export default CreateTokenModal;
