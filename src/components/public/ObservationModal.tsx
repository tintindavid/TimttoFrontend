import React from 'react';
import { Button, Modal } from 'react-bootstrap';

interface ObservationModalProps {
  show: boolean;
  onHide: () => void;
  observacion: string | null | undefined;
}

/**
 * Centered modal showing the final-state observation of a maintenance
 * history card. Dismiss via the X button or tapping outside (Modal's
 * default backdrop click behavior) per spec scenario "History card opens
 * observation modal".
 */
const ObservationModal: React.FC<ObservationModalProps> = ({ show, onHide, observacion }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Observación</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0 text-break">{observacion || 'Sin observación registrada.'}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ObservationModal;
