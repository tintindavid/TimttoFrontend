import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ClientAccessToken } from '@/types/clientAccessToken.types';
import { useRevokeClientToken } from '@/hooks/clientAccessToken/useClientTokens';

interface RevokeConfirmModalProps {
  token: ClientAccessToken | null;
  onHide: () => void;
}

/** Extracts the backend envelope message, falling back to a generic Spanish copy. */
const extractErrorMessage = (err: unknown): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  'No fue posible revocar el acceso.';

const RevokeConfirmModal: React.FC<RevokeConfirmModalProps> = ({ token, onHide }) => {
  const revokeMutation = useRevokeClientToken();

  const handleConfirm = async (): Promise<void> => {
    if (!token) return;
    try {
      await revokeMutation.mutateAsync(token._id);
      toast.success('Acceso revocado.');
      onHide();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <Modal show={!!token} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Revocar acceso</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        ¿Está seguro de revocar este acceso? El cliente dejará de poder consultar sus
        OTs y reportes con este link de inmediato. Esta acción no se puede deshacer.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={revokeMutation.isLoading}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={revokeMutation.isLoading}>
          {revokeMutation.isLoading ? 'Revocando...' : 'Revocar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RevokeConfirmModal;
