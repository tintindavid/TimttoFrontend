import React, { useRef, useState } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import SignatureCanvas from 'react-signature-canvas';
import { useUpdateSignature } from '@/hooks/useUsers';
import { toast } from 'react-toastify';
import './SignatureModal.css';

interface SignatureModalProps {
  show: boolean;
  onHide: () => void;
  userId: string;
  currentSignature?: string;
  onSuccess: () => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  show,
  onHide,
  userId,
  currentSignature,
  onSuccess,
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const { mutate: updateSignature, isLoading } = useUpdateSignature();

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  const handleSave = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error('Por favor, dibuje su firma antes de guardar');
      return;
    }

    const signatureData = sigCanvas.current.toDataURL('image/png');

    updateSignature(
      {
        id: userId,
        signatureData,
      },
      {
        onSuccess: () => {
          toast.success('Firma actualizada correctamente');
          onSuccess();
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Error al guardar la firma');
        },
      }
    );
  };

  const handleModalHide = () => {
    if (!isLoading) {
      clearSignature();
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleModalHide} size="lg" centered backdrop={isLoading ? 'static' : true}>
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>
          {currentSignature ? 'Actualizar Firma Digital' : 'Agregar Firma Digital'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {currentSignature && (
          <Alert variant="info" className="mb-3">
            <strong>Firma actual:</strong> Ya tienes una firma registrada. Al guardar, se reemplazará con la nueva.
          </Alert>
        )}

        <div className="signature-instructions mb-3">
          <p className="text-muted mb-2">
            <strong>Instrucciones:</strong> Dibuje su firma en el recuadro usando el mouse o su dedo (en dispositivos táctiles).
          </p>
        </div>

        <div className="signature-canvas-wrapper">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              className: 'signature-canvas',
            }}
            onEnd={handleEnd}
          />
        </div>

        <div className="signature-actions mt-3 d-flex justify-content-between">
          <Button variant="outline-danger" onClick={clearSignature} size="sm" disabled={isLoading || isEmpty}>
            Limpiar
          </Button>
          <small className="text-muted align-self-center">
            {isEmpty ? 'Canvas vacío' : 'Firma capturada'}
          </small>
        </div>

        {currentSignature && (
          <div className="current-signature-preview mt-4">
            <p className="text-muted mb-2">
              <strong>Vista previa de firma actual:</strong>
            </p>
            <div className="signature-preview-box">
              <img src={currentSignature} alt="Firma actual" className="img-fluid" />
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleModalHide} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isLoading || isEmpty}>
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Guardando...
            </>
          ) : (
            'Guardar Firma'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SignatureModal;
