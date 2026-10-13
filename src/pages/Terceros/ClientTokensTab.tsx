import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaPlus } from 'react-icons/fa';
import { useClientTokensList, useDeleteClientToken } from '@/hooks/clientAccessToken/useClientTokens';
import { ClientAccessToken } from '@/types/clientAccessToken.types';
import TokenList from '@/components/ClientAccessTokens/TokenList';
import CreateTokenModal from '@/components/ClientAccessTokens/CreateTokenModal';
import RevokeConfirmModal from '@/components/ClientAccessTokens/RevokeConfirmModal';
import AddOtsToTokenModal from '@/components/ClientAccessTokens/AddOtsToTokenModal';
import SendTokenLinkModal from '@/components/ClientAccessTokens/SendTokenLinkModal';
import { customerService } from '@/services/customer.service';

interface ClientTokensTabProps {
  customerId: string;
}

/**
 * "Accesos cliente" tab mounted inside `CustomerDetailPage` — per
 * Requirement "Admin panel — client access tokens tab".
 */
const ClientTokensTab: React.FC<ClientTokensTabProps> = ({ customerId }) => {
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [revokeTarget, setRevokeTarget] = useState<ClientAccessToken | null>(null);
  const [addOtsTarget, setAddOtsTarget] = useState<ClientAccessToken | null>(null);
  const [sendTarget, setSendTarget] = useState<ClientAccessToken | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [correousados, setCorreousados] = useState<string[]>([]);

  const tokensQuery = useClientTokensList(customerId);
  const deleteMutation = useDeleteClientToken();

  const tokens: ClientAccessToken[] = (tokensQuery.data?.data ?? []) as ClientAccessToken[];

  // Load customer once so SendTokenLinkModal can prefill and offer correousados.
  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    customerService
      .getById(customerId)
      .then((res: any) => {
        if (cancelled) return;
        const doc = res?.data || res;
        setCustomerEmail(doc?.Email || '');
        setCorreousados(doc?.correousados || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const handleDelete = async (tokenDoc: ClientAccessToken): Promise<void> => {
    if (!window.confirm('¿Eliminar este acceso revocado? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(tokenDoc._id);
      toast.success('Acceso eliminado.');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'No fue posible eliminar el acceso.';
      toast.error(message);
    }
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h6 className="m-0">Accesos cliente</h6>
          <small className="text-muted">
            Links de solo lectura para que el cliente consulte el avance de sus OT y reportes.
          </small>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <FaPlus className="me-2" />
          Crear acceso
        </Button>
      </div>

      <TokenList
        tokens={tokens}
        isLoading={tokensQuery.isLoading}
        isError={tokensQuery.isError}
        errorMessage={tokensQuery.error?.message}
        onRevoke={setRevokeTarget}
        onDelete={handleDelete}
        onAddOts={setAddOtsTarget}
        onSendLink={setSendTarget}
      />

      <CreateTokenModal
        show={showCreate}
        onHide={() => setShowCreate(false)}
        clienteId={customerId}
      />
      <RevokeConfirmModal token={revokeTarget} onHide={() => setRevokeTarget(null)} />
      <AddOtsToTokenModal
        show={Boolean(addOtsTarget)}
        onHide={() => setAddOtsTarget(null)}
        token={addOtsTarget}
      />
      <SendTokenLinkModal
        show={Boolean(sendTarget)}
        onHide={() => setSendTarget(null)}
        token={sendTarget}
        customerEmail={customerEmail}
        correousados={correousados}
      />
    </div>
  );
};

export default ClientTokensTab;
