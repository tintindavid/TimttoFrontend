import React, { useRef, useState } from 'react';
import { Alert, Button, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

import SignatureInput, { SignatureInputHandle } from '@/components/common/SignatureInput';
import { useAuth } from '@/context/AuthContext';
import { useUpdateSignature } from '@/hooks/useUsers';

export interface SignatureRequiredModalProps {
  show: boolean;
  /** Cancel — silent abort, no error toast (informes-firma-autor spec). */
  onHide: () => void;
  /** Fired after the signature was persisted and the auth cache refreshed. */
  onSaved: () => void;
}

/**
 * Gates informe generation on the requesting user having a stored signature
 * (`User.fileFirma`). Delegates the drawing surface to the shared
 * `SignatureInput` component — this modal only wires save + auth refresh.
 */
export const SignatureRequiredModal: React.FC<SignatureRequiredModalProps> = ({ show, onHide, onSaved }) => {
  const { user, refreshUser } = useAuth();
  const signatureRef = useRef<SignatureInputHandle>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const { mutateAsync, isLoading } = useUpdateSignature();

  const handleSignatureChange = () => {
    setIsEmpty(signatureRef.current?.isEmpty() ?? true);
  };

  const handleCancel = () => {
    if (isLoading) return;
    signatureRef.current?.clear();
    onHide();
  };

  const handleSave = async () => {
    const base64 = signatureRef.current?.getPngBase64();
    if (!base64 || !user?._id) {
      toast.error('Por favor dibuje o cargue una firma antes de guardar.');
      return;
    }
    try {
      await mutateAsync({ id: user._id, signatureData: `data:image/png;base64,${base64}` });
      await refreshUser();
      toast.success('Firma guardada correctamente.');
      onSaved();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar la firma.';
      toast.error(msg);
    }
  };

  return (
    <Modal show={show} onHide={handleCancel} centered backdrop={isLoading ? 'static' : true}>
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>Firma requerida</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info">
          Para generar el informe debe registrar su firma digital. Se guardará en su perfil y se reutilizará
          automáticamente en los próximos informes.
        </Alert>
        <SignatureInput ref={signatureRef} onChange={handleSignatureChange} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isLoading || isEmpty}>
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Guardando...
            </>
          ) : (
            'Guardar firma y continuar'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SignatureRequiredModal;
