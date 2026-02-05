import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface Props {
  show: boolean;
  title?: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<Props> = ({ show, title = 'Confirmar', body = '¿Desea continuar?', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
