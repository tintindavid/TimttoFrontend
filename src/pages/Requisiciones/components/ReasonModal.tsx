import React, { useEffect, useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import ReqHelp from '../help/ReqHelp';
import type { HelpId } from '../help/requisicionHelp';

interface Props {
  show: boolean;
  title: string;
  /** Label of the text area (e.g. "Motivo", "Observación"). */
  label: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger' | 'success' | 'warning';
  /** When true the confirm button stays disabled until the text is non-empty. */
  required?: boolean;
  isSubmitting?: boolean;
  onConfirm: (text: string) => void;
  onHide: () => void;
  /** Catalog entry explaining the action behind this modal. */
  helpId?: HelpId;
}

/** Modal that asks for a free-text reason / observation before running a state-changing action. */
const ReasonModal: React.FC<Props> = ({
  show,
  title,
  label,
  confirmLabel,
  confirmVariant = 'primary',
  required = true,
  isSubmitting = false,
  onConfirm,
  onHide,
  helpId,
}) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (show) setText('');
  }, [show]);

  const trimmed = text.trim();
  const invalid = required && trimmed.length === 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid || isSubmitting) return;
    onConfirm(trimmed);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {title}
            {helpId && <ReqHelp id={helpId} />}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="reason-modal-text">
            <Form.Label>
              {label}
              {required ? ' *' : ''}
            </Form.Label>
            <ReqHelp id="modal.observacion" />
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              isInvalid={required && text.length > 0 && invalid}
              autoFocus
            />
            {required && <Form.Text className="text-muted">Este campo es obligatorio.</Form.Text>}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={isSubmitting} type="button">
            Cancelar
          </Button>
          <Button variant={confirmVariant} type="submit" disabled={invalid || isSubmitting}>
            {isSubmitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            {confirmLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReasonModal;
