import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Modal, Pagination, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaCopy, FaEye } from 'react-icons/fa';
import { useOTsByCustomer } from '@/hooks/useOTs';
import { useCreateClientToken } from '@/hooks/clientAccessToken/useClientTokens';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/context/AuthContext';
import { OT } from '@/types/ot.types';
import { User } from '@/types/user.types';
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

const formatOtDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return '—';
  }
};

// Client-side page size — the list is short (one client's OTs) but can grow
// enough to feel unwieldy inside a modal; 10 keeps the checkbox column at a
// stable height without needing a virtualized list.
const OTS_PER_PAGE = 10;

/**
 * Modal used from `ClientTokensTab` to create a `ClientAccessToken`.
 * Two steps: (1) select OTs of the client, (2) show the resulting public
 * URL with a "Copiar" button — per "Admin creates a token from the tab" scenario.
 */
const CreateTokenModal: React.FC<CreateTokenModalProps> = ({ show, onHide, clienteId }) => {
  const [selectedOtIds, setSelectedOtIds] = useState<string[]>([]);
  const [includeCerradas, setIncludeCerradas] = useState<boolean>(false);
  const [attributionUserId, setAttributionUserId] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [createdToken, setCreatedToken] = useState<ClientAccessTokenCreateResponse | null>(null);

  const { user: currentUser } = useAuth();

  // `useOTsByCustomer` has its own `enabled: !!customerId` guard; the modal
  // is only ever mounted with a valid `clienteId` from `ClientTokensTab`.
  const { data: otsData, isLoading: loadingOts } = useOTsByCustomer(clienteId, {});
  const allOts: OT[] = (otsData?.data ?? []) as OT[];

  // Only users with fileFirma can be attributed as técnico signer (2026-08-03).
  // limit:100 is a safety cap — the modal is a Select, not a picker, so most
  // tenants land well under this. If we ever hit tenants with more signers,
  // switch to a react-select async pattern.
  const { data: usersData, isLoading: loadingUsers } = useUsers({ hasFirma: true, limit: 100 });
  const usersWithFirma: User[] = (usersData?.data ?? []) as User[];

  const availableOts = useMemo(
    () =>
      allOts.filter(
        (ot) => !ot.isDeleted && (includeCerradas || ot.EstadoOt !== 'Cerrada')
      ),
    [allOts, includeCerradas]
  );

  const [page, setPage] = useState<number>(1);
  const totalPages = Math.max(1, Math.ceil(availableOts.length / OTS_PER_PAGE));
  // Snap back to page 1 whenever the underlying list shrinks past the
  // current page (e.g. toggling "Incluir Cerradas" while on page 3).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const pagedOts = useMemo(() => {
    const start = (page - 1) * OTS_PER_PAGE;
    return availableOts.slice(start, start + OTS_PER_PAGE);
  }, [availableOts, page]);

  const createMutation = useCreateClientToken();

  const resetState = (): void => {
    setSelectedOtIds([]);
    setIncludeCerradas(false);
    setAttributionUserId('');
    setSubmitError('');
    setCreatedToken(null);
    setPage(1);
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
      const res = await createMutation.mutateAsync({
        clienteId,
        otIds: selectedOtIds,
        // Only send when the user picked someone other than themselves — the
        // backend defaults to caller when the field is absent.
        ...(attributionUserId && attributionUserId !== currentUser?._id
          ? { attributionUserId }
          : {}),
      });
      setCreatedToken(res.data);
      toast.success('Acceso creado correctamente.');
    } catch (err) {
      const { message, code } = extractError(err);
      const friendly =
        code === 'USER_SIGNATURE_MISSING'
          ? 'El técnico seleccionado no tiene firma cargada. Elige otro o pídele que la suba.'
          : code === 'ATTRIBUTION_USER_NOT_FOUND'
          ? 'El técnico seleccionado no existe o no pertenece a este tenant.'
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

            <Form.Group className="mb-3" controlId="createTokenAttributionUser">
              <Form.Label>Técnico que firmará las HTs</Form.Label>
              {loadingUsers ? (
                <div className="text-muted small">
                  <Spinner size="sm" animation="border" className="me-2" aria-label="Cargando técnicos" />
                  Cargando técnicos con firma...
                </div>
              ) : usersWithFirma.length === 0 ? (
                <Alert variant="warning" className="mb-0 py-2 small">
                  Ningún usuario tiene firma cargada. Pide a un técnico que suba su firma antes de emitir accesos.
                </Alert>
              ) : (
                <>
                  <Form.Select
                    value={attributionUserId}
                    onChange={(e) => setAttributionUserId(e.target.value)}
                  >
                    <option value="">
                      {currentUser
                        ? `Yo (${currentUser.fullName || currentUser.firstName || currentUser.email})`
                        : 'Yo (creador del acceso)'}
                    </option>
                    {usersWithFirma
                      .filter((u) => u._id && u._id !== currentUser?._id)
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                        </option>
                      ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Esta atribución no se puede cambiar después de crear el acceso.
                  </Form.Text>
                </>
              )}
            </Form.Group>

            <Form.Check
              type="checkbox"
              id="createTokenIncludeCerradas"
              label="Incluir OT cerradas"
              checked={includeCerradas}
              onChange={(e) => setIncludeCerradas(e.target.checked)}
              className="mb-3"
            />

            <div className="d-flex justify-content-between align-items-end mb-1">
              <Form.Label className="mb-0">Seleccione las OT a compartir</Form.Label>
              {availableOts.length > 0 && (
                <span className="small text-muted">
                  {selectedOtIds.length} seleccionada{selectedOtIds.length === 1 ? '' : 's'} ·{' '}
                  {availableOts.length} total
                </span>
              )}
            </div>
            {loadingOts ? (
              <div className="text-center py-3">
                <Spinner size="sm" animation="border" aria-label="Cargando OTs" />
              </div>
            ) : availableOts.length === 0 ? (
              <Alert variant="info" className="mb-0">
                Este cliente no tiene OT disponibles para compartir.
              </Alert>
            ) : (
              <>
                <div className="border rounded" style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {pagedOts.map((ot) => (
                    <div
                      key={ot._id}
                      className="d-flex align-items-center justify-content-between gap-2 px-2 py-2 border-bottom"
                    >
                      <Form.Check
                        type="checkbox"
                        id={`create-token-ot-${ot._id}`}
                        label={otLabel(ot)}
                        checked={!!ot._id && selectedOtIds.includes(ot._id)}
                        onChange={() => ot._id && toggleOt(ot._id)}
                        className="flex-grow-1"
                      />
                      <span className="small text-muted text-nowrap">
                        {formatOtDate(ot.FechaCreacion || ot.createdAt)}
                      </span>
                      {/* Eye button abre el detalle de la OT en otra pestaña
                          para no romper el flujo del modal de creación. */}
                      <a
                        href={ot._id ? `/ots/${ot._id}` : undefined}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="btn btn-sm btn-outline-secondary"
                        title="Ver detalle de la OT en nueva pestaña"
                        aria-label={`Ver detalle de ${ot.Consecutivo || 'OT'}`}
                      >
                        <FaEye />
                      </a>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-2">
                    <Pagination size="sm" className="mb-0">
                      <Pagination.Prev
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      />
                      <Pagination.Item active>
                        {page} / {totalPages}
                      </Pagination.Item>
                      <Pagination.Next
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
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
