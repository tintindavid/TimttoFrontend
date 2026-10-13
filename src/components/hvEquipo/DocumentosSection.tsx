import React, { useState } from 'react';
import { Table, Button, Badge, Alert } from 'react-bootstrap';
import {
  FaPlus, FaTimes, FaSyncAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileAlt, FaLink,
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import DocumentoModal from './DocumentoModal';
import { Documento, DocumentoCategoria, DocumentoPayload } from '@/types/hvEquipo.types';
import {
  useUploadHvDocumento,
  useUpdateHvDocumento,
  useDeleteHvDocumento,
} from '@/hooks/useHVEquipo';

interface DocumentosSectionProps {
  /** Persisted HV id. Without it documents cannot be managed yet. */
  hvId?: string;
  /** All documents of the HV; the section shows only those of its `categoria`. */
  documentos: Documento[];
  isEditing: boolean;
  categoria?: DocumentoCategoria;
  title?: string;
  addLabel?: string;
  emptyText?: string;
}

// Only http(s) URLs are clickable; anything else (javascript:, data:) is shown as plain text.
const isHttpUrl = (value?: string): boolean => !!value && /^https?:\/\//i.test(value.trim());

const formatSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDocDate = (date?: string): string => {
  if (!date) return '';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO');
};

const MimeIcon: React.FC<{ mimetype?: string }> = ({ mimetype }) => {
  if (!mimetype) return <FaFileAlt className="doc-icon" aria-hidden="true" />;
  if (mimetype === 'application/pdf') return <FaFilePdf className="doc-icon doc-icon-pdf" aria-hidden="true" />;
  if (mimetype.startsWith('image/')) return <FaFileImage className="doc-icon doc-icon-image" aria-hidden="true" />;
  if (mimetype.includes('word')) return <FaFileWord className="doc-icon doc-icon-word" aria-hidden="true" />;
  if (mimetype.includes('sheet') || mimetype.includes('excel')) {
    return <FaFileExcel className="doc-icon doc-icon-excel" aria-hidden="true" />;
  }
  return <FaFileAlt className="doc-icon" aria-hidden="true" />;
};

const DocumentosSection: React.FC<DocumentosSectionProps> = ({
  hvId,
  documentos: allDocumentos,
  isEditing,
  categoria = 'general',
  title = 'Documentos',
  addLabel = 'Agregar Documento',
  emptyText = 'No hay documentos. Haz clic en "Agregar Documento" para añadir uno.',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Documento | null>(null);

  const uploadMutation = useUploadHvDocumento();
  const updateMutation = useUpdateHvDocumento();
  const deleteMutation = useDeleteHvDocumento();

  const documentos = allDocumentos.filter((doc) => (doc.categoria ?? 'general') === categoria);

  if (!isEditing && documentos.length === 0) return null;

  const isSubmitting = uploadMutation.isLoading || updateMutation.isLoading;

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (doc: Documento) => {
    setEditing(doc);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const showError = (error: unknown) => {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      'No se pudo completar la operación con el documento';
    Swal.fire({ icon: 'error', title: 'Error', text: message, confirmButtonText: 'Aceptar' });
  };

  const handleSubmit = async (payload: DocumentoPayload) => {
    if (!hvId) return;
    try {
      if (editing?._id) {
        await updateMutation.mutateAsync({ hvId, docId: editing._id, payload });
      } else {
        await uploadMutation.mutateAsync({ hvId, payload: { ...payload, categoria } });
      }
      closeModal();
    } catch (error) {
      showError(error);
    }
  };

  const handleDelete = async (doc: Documento) => {
    if (!hvId || !doc._id) return;
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar documento?',
      text: `Se eliminará "${doc.nombre}" de la hoja de vida`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteMutation.mutateAsync({ hvId, docId: doc._id });
    } catch (error) {
      showError(error);
    }
  };

  return (
    <div className="hv-section" data-testid={categoria === 'guia_rapida' ? 'guia-adjunta-section' : 'documentos-section'}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="section-header mb-0">{title}</h5>
        {isEditing && (
          <Button variant="primary" size="sm" onClick={openCreate} disabled={!hvId}>
            <FaPlus className="me-1" /> {addLabel}
          </Button>
        )}
      </div>

      {isEditing && !hvId && (
        <Alert variant="info" className="py-2">
          Guarde la hoja de vida para poder adjuntar archivos.
        </Alert>
      )}

      {documentos.length > 0 ? (
        <Table striped bordered hover size="sm" className="hv-documentos-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Link</th>
              <th>Archivo</th>
              <th>Fecha</th>
              {isEditing && <th style={{ width: '15%' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {documentos.map((doc, index) => (
              <tr key={doc._id || index}>
                <td><strong>{doc.nombre}</strong></td>
                <td>
                  {doc.link && !isHttpUrl(doc.link) && <span className="doc-link-truncate">{doc.link}</span>}
                  {doc.link && isHttpUrl(doc.link) && (
                    <a
                      href={doc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doc-link-truncate"
                      title={doc.link}
                    >
                      <FaLink className="me-1" aria-hidden="true" />
                      {doc.link}
                    </a>
                  )}
                </td>
                <td>
                  {doc.archivoUrl && isHttpUrl(doc.archivoUrl) && (
                    <a href={doc.archivoUrl} target="_blank" rel="noopener noreferrer">
                      <MimeIcon mimetype={doc.mimetype} /> Descargar
                    </a>
                  )}
                  {doc.archivoUrl && doc.tamanoBytes ? (
                    <Badge bg="light" text="dark" className="ms-2 doc-size-badge">
                      {formatSize(doc.tamanoBytes)}
                    </Badge>
                  ) : null}
                </td>
                <td>{formatDocDate(doc.uploadedAt)}</td>
                {isEditing && (
                  <td className="text-center">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-1"
                      onClick={() => openEdit(doc)}
                      title="Reemplazar archivo"
                      aria-label={`Reemplazar archivo de ${doc.nombre}`}
                    >
                      <FaSyncAlt />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                      title="Eliminar"
                      aria-label={`Eliminar documento ${doc.nombre}`}
                    >
                      <FaTimes />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="text-center text-muted">
          {emptyText}
        </div>
      )}

      <DocumentoModal
        show={showModal}
        onHide={closeModal}
        onSubmit={handleSubmit}
        initialValue={editing}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default DocumentosSection;
