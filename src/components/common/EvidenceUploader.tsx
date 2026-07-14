import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, Row, Col, Button, Alert, Form, Spinner } from 'react-bootstrap';
import { FaCamera, FaSave, FaTimes, FaPencilAlt, FaCheck } from 'react-icons/fa';
import { Evidencia, EVIDENCE_LIMITS } from '@/types/reporte.types';
import {
  useUploadEvidencias,
  useDeleteEvidencia,
  useUpdateEvidencia,
} from '@/hooks/useReportes';
import ConfirmModal from '@/components/common/ConfirmModal';
import ImageGalleryModal from '@/components/common/ImageGalleryModal';

interface EvidenceUploaderProps {
  reporteId: string;
  evidencias: Evidencia[];
  disabled?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onSaved?: (evidencias: Evidencia[]) => void;
  /**
   * When set to true, opens the native file picker on mount / when it flips
   * from false to true. The uploader immediately calls `onAutoOpenHandled` so
   * the parent can clear the flag (otherwise the picker would open again on
   * every render).
   */
  autoOpenPicker?: boolean;
  onAutoOpenHandled?: () => void;
  /**
   * Fired after the user picked at least one file. Useful for the parent to
   * jump into the evidencias tab so the user can complete the description
   * and hit Save without hunting for the section.
   */
  onFilesAdded?: () => void;
}

interface PendingEvidence {
  id: string;
  file: File;
  previewUrl: string;
  descripcion: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  reporteId,
  evidencias,
  disabled = false,
  onDirtyChange,
  onSaved,
  autoOpenPicker,
  onAutoOpenHandled,
  onFilesAdded,
}) => {
  const [pending, setPending] = useState<PendingEvidence[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; isPending: boolean } | null>(null);
  const [galleryStartIndex, setGalleryStartIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadEvidencias();
  const deleteMutation = useDeleteEvidencia();
  const updateMutation = useUpdateEvidencia();

  const savedCount = evidencias.length;
  const totalCount = savedCount + pending.length;
  const remaining = EVIDENCE_LIMITS.MAX_COUNT - totalCount;
  const atCap = remaining <= 0;
  const isDirty = pending.length > 0;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [pending]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Let a parent open the file picker on demand (used by the camera shortcut
  // in the report header). We clear the flag immediately via onAutoOpenHandled
  // so a re-render doesn't trigger a second dialog.
  useEffect(() => {
    if (!autoOpenPicker || disabled || atCap) return;
    fileInputRef.current?.click();
    onAutoOpenHandled?.();
  }, [autoOpenPicker, disabled, atCap, onAutoOpenHandled]);

  const galleryImages = useMemo(
    () => [
      ...evidencias.map((e) => ({ url: e.url, nombre: e.nombre, descripcion: e.descripcion })),
      ...pending.map((p) => ({
        url: p.previewUrl,
        nombre: p.file.name,
        descripcion: p.descripcion || 'Pending — not saved yet',
      })),
    ],
    [evidencias, pending]
  );

  const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const picked = Array.from(fileList);

    if (picked.length > remaining) {
      setError(`You can attach at most ${EVIDENCE_LIMITS.MAX_COUNT} evidences per report (${remaining} slot${remaining === 1 ? '' : 's'} left).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    for (const f of picked) {
      if (!EVIDENCE_LIMITS.ALLOWED_MIME.includes(f.type as typeof EVIDENCE_LIMITS.ALLOWED_MIME[number])) {
        setError(`"${f.name}" is not a JPEG/PNG image.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (f.size > EVIDENCE_LIMITS.MAX_SIZE_BYTES) {
        setError(`"${f.name}" exceeds the 5 MB limit (size: ${formatBytes(f.size)}).`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    const newPending: PendingEvidence[] = picked.map((file) => ({
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      descripcion: '',
    }));
    setPending((prev) => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (newPending.length > 0) onFilesAdded?.();
  };

  const handlePendingDescChange = (id: string, value: string) => {
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, descripcion: value } : p)));
  };

  const handleSave = async () => {
    if (pending.length === 0) return;
    // Guard against double-tap on mobile: without this, a rapid second click
    // fires a parallel mutateAsync while the first request is still in flight,
    // causing the same files to be uploaded twice and appear duplicated.
    if (uploadMutation.isLoading) return;
    setError(null);
    try {
      const response = await uploadMutation.mutateAsync({
        reporteId,
        files: pending.map((p) => p.file),
        descripciones: pending.map((p) => p.descripcion),
      });
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPending([]);
      onSaved?.(response.data?.evidencias ?? evidencias);
    } catch (err: any) {
      const isTimeout = err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '');
      const message = isTimeout
        ? 'La subida está tardando más de lo esperado. Refrescamos para verificar si las evidencias ya se guardaron; revisa antes de reintentar para evitar duplicados.'
        : err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to upload evidences';
      setError(message);
      // Even on failure, notify the parent so it refetches the report — the
      // backend may have actually persisted the evidences before the client
      // gave up on the request.
      onSaved?.(evidencias);
    }
  };

  const handleRemovePending = useCallback((id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleDeleteSaved = async (evidenciaId: string): Promise<Evidencia[] | null> => {
    setError(null);
    try {
      const response = await deleteMutation.mutateAsync({ reporteId, evidenciaId });
      return response.data?.evidencias ?? null;
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to delete evidence';
      setError(message);
      return null;
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    if (confirmDelete.isPending) {
      handleRemovePending(confirmDelete.id);
    } else {
      const fresh = await handleDeleteSaved(confirmDelete.id);
      if (fresh) onSaved?.(fresh);
    }
    setConfirmDelete(null);
  };

  const startEdit = (evidencia: Evidencia) => {
    if (!evidencia._id) return;
    setEditingId(evidencia._id);
    setEditingDraft(evidencia.descripcion ?? '');
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingDraft('');
  };

  const submitEdit = async () => {
    if (!editingId) return;
    setError(null);
    try {
      const response = await updateMutation.mutateAsync({
        reporteId,
        evidenciaId: editingId,
        descripcion: editingDraft,
      });
      onSaved?.(response.data?.evidencias ?? evidencias);
      cancelEdit();
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to update description';
      setError(message);
    }
  };

  const openGalleryAt = (idx: number) => setGalleryStartIndex(idx);
  const closeGallery = () => setGalleryStartIndex(null);

  const handleUploadButton = () => fileInputRef.current?.click();

  const maxDesc = EVIDENCE_LIMITS.MAX_DESCRIPTION_LENGTH;

  return (
    <>
      <Card className="mt-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Evidencias Fotográficas ({totalCount}/{EVIDENCE_LIMITS.MAX_COUNT})</h6>
          <div className="d-flex gap-2">
            {!disabled && !atCap && (
              <Button variant="primary" size="sm" onClick={handleUploadButton}>
                <FaCamera className="me-1" />
                Subir Foto
              </Button>
            )}
            {isDirty && !disabled && (
              <Button
                variant="success"
                size="sm"
                onClick={handleSave}
                disabled={uploadMutation.isLoading}
              >
                {uploadMutation.isLoading ? (
                  <><Spinner size="sm" animation="border" className="me-1" />Guardando...</>
                ) : (
                  <><FaSave className="me-1" />Guardar evidencias</>
                )}
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <Form.Control
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            type="file"
            accept={EVIDENCE_LIMITS.ALLOWED_ACCEPT}
            multiple
            className="d-none"
            onChange={handleFilesPicked}
            aria-label="Select evidence images"
          />

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
              {error}
            </Alert>
          )}

          {atCap && (
            <Alert variant="info" className="mb-3">
              Maximum of {EVIDENCE_LIMITS.MAX_COUNT} evidences reached.
            </Alert>
          )}

          {totalCount === 0 ? (
            <Alert variant="info" className="text-center mb-0">
              <FaCamera size={32} className="mb-2 text-muted" />
              <div>No hay evidencias registradas</div>
              <small>JPEG/PNG · Max {EVIDENCE_LIMITS.MAX_COUNT} · ≤ 5 MB each</small>
            </Alert>
          ) : (
            <Row>
              {evidencias.map((evidencia, idx) => {
                const isEditing = editingId === evidencia._id;
                return (
                  <Col md={4} sm={6} key={evidencia._id || `saved-${idx}`} className="mb-3">
                    <Card className="position-relative">
                      {!disabled && (
                        <Button
                          variant="danger"
                          size="sm"
                          aria-label={`Delete evidence ${evidencia.nombre}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({ id: evidencia._id || '', isPending: false });
                          }}
                          className="position-absolute top-0 end-0 m-1"
                          style={{ zIndex: 5, padding: '2px 8px' }}
                        >
                          <FaTimes />
                        </Button>
                      )}
                      <Card.Img
                        variant="top"
                        src={evidencia.url}
                        style={{ height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => openGalleryAt(idx)}
                        loading="lazy"
                        alt={evidencia.descripcion || evidencia.nombre}
                      />
                      <Card.Body className="p-2">
                        {isEditing ? (
                          <>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              maxLength={maxDesc}
                              value={editingDraft}
                              onChange={(e) => setEditingDraft(e.target.value)}
                              placeholder="Descripción (opcional)"
                              aria-label="Edit evidence description"
                              autoFocus
                            />
                            <div className="d-flex justify-content-between align-items-center mt-1">
                              <small className="text-muted">{editingDraft.length}/{maxDesc}</small>
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={cancelEdit}
                                  disabled={updateMutation.isLoading}
                                  aria-label="Cancel edit"
                                >
                                  <FaTimes />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={submitEdit}
                                  disabled={updateMutation.isLoading}
                                  aria-label="Save description"
                                >
                                  {updateMutation.isLoading ? (
                                    <Spinner size="sm" animation="border" />
                                  ) : (
                                    <FaCheck />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="d-flex justify-content-between align-items-start gap-2">
                              {evidencia.descripcion ? (
                                <small className="text-dark d-block text-truncate" title={evidencia.descripcion}>
                                  {evidencia.descripcion}
                                </small>
                              ) : (
                                <small className="text-muted fst-italic d-block">Sin descripción</small>
                              )}
                              {!disabled && (
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="p-0 text-muted"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEdit(evidencia);
                                  }}
                                  aria-label={`Edit description for ${evidencia.nombre}`}
                                  title="Editar descripción"
                                >
                                  <FaPencilAlt />
                                </Button>
                              )}
                            </div>
                            <small className="text-muted d-block">
                              {new Date(evidencia.fechaSubida).toLocaleDateString('es-ES')}
                            </small>
                          </>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
              {pending.map((p, pIdx) => (
                <Col md={4} sm={6} key={p.id} className="mb-3">
                  <Card className="position-relative border-warning">
                    <Button
                      variant="danger"
                      size="sm"
                      aria-label={`Remove pending evidence ${p.file.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ id: p.id, isPending: true });
                      }}
                      className="position-absolute top-0 end-0 m-1"
                      style={{ zIndex: 5, padding: '2px 8px' }}
                    >
                      <FaTimes />
                    </Button>
                    <Card.Img
                      variant="top"
                      src={p.previewUrl}
                      style={{ height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => openGalleryAt(evidencias.length + pIdx)}
                      alt={p.file.name}
                    />
                    <Card.Body className="p-2">
                      <small className="text-warning d-block mb-1">Pending — not saved</small>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        maxLength={maxDesc}
                        placeholder="Descripción (opcional)"
                        value={p.descripcion}
                        onChange={(e) => handlePendingDescChange(p.id, e.target.value)}
                        aria-label={`Description for ${p.file.name}`}
                      />
                      <small className="text-muted d-block text-end">
                        {p.descripcion.length}/{maxDesc}
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      <ConfirmModal
        show={confirmDelete !== null}
        title="Eliminar evidencia"
        body={
          confirmDelete?.isPending
            ? '¿Desea descartar esta evidencia antes de guardarla?'
            : '¿Desea eliminar esta evidencia? Esta acción no se puede deshacer.'
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ImageGalleryModal
        show={galleryStartIndex !== null}
        images={galleryImages}
        startIndex={galleryStartIndex ?? 0}
        onClose={closeGallery}
        title="Evidencias"
      />
    </>
  );
};

export default EvidenceUploader;
