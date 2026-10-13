import React, { useEffect, useState } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { Documento, DocumentoPayload } from '@/types/hvEquipo.types';

export const MAX_DOCUMENTO_BYTES = 10 * 1024 * 1024;
export const DOCUMENTO_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx';

interface DocumentoModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (payload: DocumentoPayload) => void | Promise<void>;
  initialValue?: Documento | null;
  isSubmitting?: boolean;
}

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const DocumentoModal: React.FC<DocumentoModalProps> = ({
  show,
  onHide,
  onSubmit,
  initialValue,
  isSubmitting = false,
}) => {
  const [nombre, setNombre] = useState('');
  const [link, setLink] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setNombre(initialValue?.nombre || '');
      setLink(initialValue?.link || '');
      setArchivo(null);
      setFileError(null);
    }
  }, [show, initialValue]);

  const isEdit = !!initialValue?._id;
  const trimmedLink = link.trim();
  const linkError = trimmedLink && !isValidUrl(trimmedLink) ? 'Ingrese una URL válida (http:// o https://)' : null;
  const hasSource = !!trimmedLink || !!archivo || !!initialValue?.archivoUrl;
  const canSubmit = !!nombre.trim() && hasSource && !linkError && !fileError && !isSubmitting;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_DOCUMENTO_BYTES) {
      setArchivo(null);
      setFileError('El archivo supera el tamaño máximo de 10 MB');
      event.target.value = '';
      return;
    }
    setFileError(null);
    setArchivo(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const payload: DocumentoPayload = { nombre: nombre.trim(), link: trimmedLink };
    if (archivo) payload.archivo = archivo;
    onSubmit(payload);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Editar documento' : 'Agregar documento'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="documento-nombre">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              type="text"
              value={nombre}
              maxLength={200}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Manual de usuario"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="documento-link">
            <Form.Label>Enlace (opcional)</Form.Label>
            <Form.Control
              type="text"
              value={link}
              maxLength={2000}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              isInvalid={!!linkError}
            />
            <Form.Control.Feedback type="invalid">{linkError}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-2" controlId="documento-archivo">
            <Form.Label>{isEdit && initialValue?.archivoUrl ? 'Reemplazar archivo' : 'Archivo (opcional)'}</Form.Label>
            <Form.Control
              type="file"
              accept={DOCUMENTO_ACCEPT}
              onChange={handleFileChange}
              isInvalid={!!fileError}
            />
            <Form.Control.Feedback type="invalid">{fileError}</Form.Control.Feedback>
            <Form.Text className="text-muted">
              PDF, JPG, PNG, WebP, DOCX o XLSX. Máximo 10 MB.
            </Form.Text>
          </Form.Group>
          {!hasSource && (
            <Form.Text className="text-danger d-block">
              Debe indicar un enlace o adjuntar un archivo.
            </Form.Text>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={!canSubmit}>
            {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DocumentoModal;
