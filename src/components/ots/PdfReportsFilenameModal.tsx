import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Modal, OverlayTrigger, Popover, Spinner } from 'react-bootstrap';
import { FaDownload, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  PDF_FILENAME_DEFAULT_TOKENS,
  PDF_FILENAME_TOKENS,
  PDF_FILENAME_TOKEN_LABELS,
  PdfFilenameToken,
} from '@/constants/pdfReports.constants';
import { generateBulkPDF } from '@/services/descargarPdf.service';
import { useFilenamePreview } from '@/hooks/useFilenamePreview';

interface Props {
  show: boolean;
  onHide: () => void;
  sheetworkId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sampleReport?: any | null;
}

const INFO_COPY =
  'Elige qué campos quieres incluir en el nombre de cada PDF. Haz clic en un chip para agregarlo o quitarlo. Arrastra los chips seleccionados para reordenarlos: el orden en que aparezcan es el orden en el nombre. Verás una vista previa con el primer reporte de la hoja para confirmar cómo quedará.';

const InfoPopover = (
  <Popover id="pdf-filename-info-popover">
    <Popover.Body>{INFO_COPY}</Popover.Body>
  </Popover>
);

const PdfReportsFilenameModal: React.FC<Props> = ({ show, onHide, sheetworkId, sampleReport }) => {
  const [selection, setSelection] = useState<PdfFilenameToken[]>([...PDF_FILENAME_DEFAULT_TOKENS]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    if (show) {
      setSelection([...PDF_FILENAME_DEFAULT_TOKENS]);
      setError(null);
    }
  }, [show]);

  const preview = useFilenamePreview(selection, sampleReport);

  const isSelected = (token: PdfFilenameToken): boolean => selection.includes(token);

  const toggle = (token: PdfFilenameToken): void => {
    setSelection((prev) =>
      prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token]
    );
  };

  const clearAll = (): void => setSelection([]);

  const handleDragStart = (index: number) => (): void => {
    dragIndex.current = index;
  };
  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
  };
  const handleDrop = (targetIndex: number) => (e: React.DragEvent): void => {
    e.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === targetIndex) return;
    setSelection((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const unselected = useMemo(
    () => PDF_FILENAME_TOKENS.filter((t) => !isSelected(t)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selection]
  );

  const handleSubmit = async (): Promise<void> => {
    if (!sheetworkId || selection.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await generateBulkPDF({ sheetworkId, fileNameConfig: { tokens: selection } });
      toast.success('Descarga iniciada.');
      onHide();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No fue posible generar el ZIP.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Nombre de los reportes
          <OverlayTrigger trigger="click" placement="right" overlay={InfoPopover} rootClose>
            <Button variant="link" size="sm" className="p-0 ms-2 align-baseline" aria-label="Información">
              <FaInfoCircle />
            </Button>
          </OverlayTrigger>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small mb-3">
          Cada PDF dentro del ZIP se nombrará con los campos seleccionados, en el orden en que
          aparecen abajo.
        </p>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong className="small">Seleccionados</strong>
            <Button
              size="sm"
              variant="link"
              className="p-0"
              onClick={clearAll}
              disabled={selection.length === 0}
            >
              Deseleccionar todo
            </Button>
          </div>
          <div
            className="d-flex flex-wrap gap-2 p-2 border rounded"
            style={{ minHeight: 48, background: '#fafbfc' }}
            data-testid="pdf-filename-selected-area"
          >
            {selection.length === 0 ? (
              <span className="text-muted small">Selecciona al menos un campo</span>
            ) : (
              selection.map((token, index) => (
                <Badge
                  key={token}
                  bg="primary"
                  className="p-2"
                  draggable
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop(index)}
                  style={{ cursor: 'grab', userSelect: 'none' }}
                >
                  {PDF_FILENAME_TOKEN_LABELS[token]}
                  <FaTimes
                    className="ms-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggle(token)}
                    role="button"
                    aria-label={`Quitar ${PDF_FILENAME_TOKEN_LABELS[token]}`}
                  />
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="mb-3">
          <strong className="small d-block mb-2">Disponibles</strong>
          <div className="d-flex flex-wrap gap-2">
            {unselected.length === 0 ? (
              <span className="text-muted small">Todos los campos están seleccionados</span>
            ) : (
              unselected.map((token) => (
                <Badge
                  key={token}
                  bg="light"
                  text="dark"
                  className="p-2 border"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggle(token)}
                  role="button"
                  aria-label={`Agregar ${PDF_FILENAME_TOKEN_LABELS[token]}`}
                >
                  + {PDF_FILENAME_TOKEN_LABELS[token]}
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="p-2 border rounded" style={{ background: '#f5f7fa' }}>
          <div className="small text-muted mb-1">Vista previa</div>
          {selection.length === 0 ? (
            <em className="small text-muted">
              Selecciona al menos un campo para ver la vista previa
            </em>
          ) : (
            <code data-testid="pdf-filename-preview">{preview}</code>
          )}
        </div>

        {error && (
          <Alert variant="danger" className="mt-3 mb-0">
            {error}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={selection.length === 0 || !sheetworkId || submitting}
        >
          {submitting ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" /> Generando…
            </>
          ) : (
            <>
              <FaDownload className="me-1" /> Descargar
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PdfReportsFilenameModal;
