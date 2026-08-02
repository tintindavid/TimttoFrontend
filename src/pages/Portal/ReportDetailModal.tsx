import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Alert, Badge, Button, Form, Modal, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { FaInfoCircle } from 'react-icons/fa';
import { useReportDetail } from '@/hooks/portal/useReportDetail';
import {
  useMarkReviewed,
  useUnmarkReviewed,
  useUpdateClientNote,
} from '@/hooks/portal/useMarkReviewed';
import { publicPortalService } from '@/services/publicPortal.service';
import { PortalReportEstado } from '@/types/publicPortal.types';

const CLIENT_NOTE_MAX = 1000;

interface ReportDetailModalProps {
  token: string | undefined;
  /** `null` means "no report selected" — the modal stays hidden. */
  reportId: string | null;
  onHide: () => void;
}

// Only `Procesado` reports are reviewable (backend gate tightened
// 2026-08-02). `Cerrado` and `Pendiente` show up on their own portal tabs
// for visibility but can't be marked reviewed — admin must promote them.
const REVIEWABLE_ESTADOS: PortalReportEstado[] = ['Procesado'];

/**
 * Renders the report exactly as it will appear on the final PDF the client
 * receives at handover — via an `<iframe>` fed by the public
 * `/pdf-view` endpoint, which shares the same HTML template the admin
 * `POST /pdf-reports/single` endpoint uses. Product decision (2026-08-02):
 * showing an admin-style React re-implementation created a "this doesn't
 * look like the real report" gap; the iframe closes it.
 *
 * Review action stays in the footer (unchanged wire-up), gated by a small
 * confirmation modal that spells out what "marcar como revisado" implies
 * before the mutation fires — matches the legal weight of the follow-up
 * signature flow. A (!) tooltip surfaces the same explanation as a
 * lightweight affordance for users who hover instead of clicking.
 */
const REVIEW_CONFIRM_TEXT =
  'Al aceptar indicas que el reporte fue revisado y se recibe a satisfacción. La firma final se realizará al terminar de revisar todos los reportes seleccionados.';

const REVIEW_HELP_TEXT =
  'Marcar el reporte como revisado indica que lo recibes a satisfacción. Podrás firmar la recepción de todos los reportes revisados desde la pantalla principal del portal.';

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ token, reportId, onHide }) => {
  const show = Boolean(reportId);
  const { data, isLoading, isError, error } = useReportDetail(token, reportId ?? undefined);
  const report = data?.data;
  const status = (error as AxiosError | undefined)?.response?.status;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteDirty, setNoteDirty] = useState(false);

  const markReviewed = useMarkReviewed(token);
  const unmarkReviewed = useUnmarkReviewed(token);
  const updateNote = useUpdateClientNote(token);

  const isReviewed = Boolean(report?.clientReview?.reviewedAt);
  const isSheeted = Boolean(report?.isSheeted);
  const isEstadoReviewable = report ? REVIEWABLE_ESTADOS.includes(report.estado) : false;
  const isReviewToggleDisabled = isSheeted || !isEstadoReviewable;
  const isReviewMutationPending = markReviewed.isLoading || unmarkReviewed.isLoading;
  const disabledReason = isSheeted
    ? 'Este reporte ya fue firmado y no se puede modificar'
    : 'Solo reportes en estado Procesado pueden marcarse como revisados';

  // Reset the iframe-loading overlay whenever the iframe key changes (i.e.
  // reportId flips or isReviewed toggles — both bump the `key` and force a
  // fresh reload of the pdf-view HTML). Without this, the spinner stays
  // hidden from the previous load and the user sees stale content flash.
  useEffect(() => {
    setIframeLoading(true);
  }, [reportId, isReviewed]);

  // Seed the note draft from the fetched report the first time the modal
  // opens on a given reportId. Reset the dirty flag so the "Guardar" button
  // stays disabled until the client actually types something.
  useEffect(() => {
    setNoteDraft(report?.clientNote?.text ?? '');
    setNoteDirty(false);
  }, [reportId, report?.clientNote?.text]);

  const pdfViewUrl =
    token && reportId ? publicPortalService.getReportPdfViewUrl(token, reportId) : undefined;

  const handleToggleClick = () => {
    if (!report) return;
    if (isReviewed) {
      // Unmark doesn't need a legal confirmation — the mark is what carries
      // the "recibido a satisfacción" weight.
      unmarkReviewed.mutate(report._id);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmMark = () => {
    if (!report) return;
    markReviewed.mutate(report._id, {
      onSuccess: () => {
        // Auto-close both the confirmation modal AND the detail modal so the
        // client returns to the "Para revisar" tab and immediately sees the
        // counter update (2026-08-02 UX ask). If the mutation errored, keep
        // the confirm modal open so the client can retry.
        setConfirmOpen(false);
        onHide();
      },
      onError: () => setConfirmOpen(false),
    });
  };

  const closeAll = () => {
    setConfirmOpen(false);
    setIframeLoading(true);
    onHide();
  };

  const handleSaveNote = () => {
    if (!report) return;
    updateNote.mutate(
      { reportId: report._id, text: noteDraft },
      { onSuccess: () => setNoteDirty(false) }
    );
  };

  const reviewButtonLabel = isReviewed ? 'Quitar revisión' : 'Marcar como revisado';
  const reviewButtonVariant = isReviewed ? 'outline-secondary' : 'primary';

  const reviewButton = (
    <Button
      variant={reviewButtonVariant}
      onClick={handleToggleClick}
      disabled={isReviewToggleDisabled || isReviewMutationPending || !report}
    >
      {isReviewMutationPending && (
        <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
      )}
      {reviewButtonLabel}
    </Button>
  );

  return (
    <>
      <Modal show={show} onHide={closeAll} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalle del reporte</Modal.Title>
          {isReviewed && (
            <Badge bg="success" className="ms-2">
              Revisado
            </Badge>
          )}
        </Modal.Header>
        {/* Flex column so the sticky "Firma del cliente" bar is always
            visible: iframe takes the remaining vertical space, action bar
            stays pinned at the bottom of the body. Fixes the earlier issue
            where a 70vh iframe pushed the action bar below the viewport
            and the iframe's inner scroll swallowed wheel events, so the
            user couldn't reach the button. */}
        <Modal.Body
          className="p-0 d-flex flex-column"
          style={{ height: '80vh' }}
        >
          {isLoading && (
            <div className="text-center py-4 flex-grow-1">
              <Spinner animation="border" aria-label="Cargando detalle" />
            </div>
          )}

          {!isLoading && isError && (
            <Alert variant="danger" className="m-3">
              {status === 404
                ? 'No fue posible encontrar este reporte.'
                : 'No fue posible cargar el detalle del reporte.'}
            </Alert>
          )}

          {!isLoading && !isError && pdfViewUrl && (
            <>
              <div
                style={{
                  position: 'relative',
                  flex: '1 1 auto',
                  minHeight: 0, // required for flex children with overflow to shrink
                }}
              >
                {iframeLoading && (
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(255,255,255,0.85)',
                      zIndex: 1,
                    }}
                  >
                    <Spinner animation="border" aria-label="Cargando reporte" />
                  </div>
                )}
                <iframe
                  // The iframe key forces a reload when the review state
                  // flips, so the injected firma slot in the HTML reflects
                  // "Recibido a satisfacción" after mark (or the pending
                  // placeholder after unmark).
                  key={`${reportId}-${isReviewed ? 'reviewed' : 'pending'}`}
                  src={pdfViewUrl}
                  title="Reporte"
                  onLoad={() => setIframeLoading(false)}
                  style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                />
              </div>

              {/* Sección de firma del cliente — sticky at the bottom of the
                  modal body via flex-shrink:0, visually continuing the
                  report's firma area. Always visible; no scrolling needed.
                  Also carries the free-form client note above the review
                  action so the client can flag discrepancies (e.g. "este
                  equipo está fuera de servicio aunque el reporte lo marca
                  operativo") before signing. */}
              <div
                className="border-top bg-light px-3 py-3"
                aria-label="Sección de firma del cliente"
                style={{ flexShrink: 0 }}
              >
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label
                      htmlFor="client-note-textarea"
                      className="fw-semibold text-uppercase small text-muted mb-0"
                    >
                      Nota del cliente (opcional)
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted">
                        {noteDraft.length}/{CLIENT_NOTE_MAX}
                      </span>
                      {updateNote.isError && (
                        <span className="small text-danger">No se pudo guardar</span>
                      )}
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={handleSaveNote}
                        disabled={!noteDirty || updateNote.isLoading || noteDraft.length > CLIENT_NOTE_MAX}
                      >
                        {updateNote.isLoading && (
                          <Spinner as="span" animation="border" size="sm" className="me-1" />
                        )}
                        {noteDraft.trim() === '' && report?.clientNote ? 'Eliminar nota' : 'Guardar nota'}
                      </Button>
                    </div>
                  </div>
                  <Form.Control
                    id="client-note-textarea"
                    as="textarea"
                    rows={2}
                    maxLength={CLIENT_NOTE_MAX}
                    placeholder="Agrega observaciones sobre este reporte (p. ej. si el equipo está fuera de servicio en la práctica)"
                    value={noteDraft}
                    onChange={(e) => {
                      setNoteDraft(e.target.value);
                      setNoteDirty(true);
                    }}
                  />
                </div>

                <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                  <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                    <div className="fw-semibold text-uppercase small text-muted">
                      Firma del cliente
                    </div>
                    <div className="small text-muted">
                      {isReviewed
                        ? 'Ya marcaste este reporte como recibido a satisfacción. La firma manuscrita se recolecta al terminar de revisar todos los reportes.'
                        : 'Al marcar como revisado indicas que recibes el reporte a satisfacción. La firma manuscrita final se recolecta al terminar de revisar todos los reportes.'}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip id="review-help-tooltip">{REVIEW_HELP_TEXT}</Tooltip>}
                    >
                      <Button
                        variant="link"
                        className="p-1 text-secondary"
                        aria-label="Ayuda sobre la revisión"
                        tabIndex={0}
                      >
                        <FaInfoCircle size={20} />
                      </Button>
                    </OverlayTrigger>
                    {isReviewToggleDisabled ? (
                      <OverlayTrigger
                        overlay={<Tooltip id="review-disabled-tooltip">{disabledReason}</Tooltip>}
                      >
                        <span className="d-inline-block">{reviewButton}</span>
                      </OverlayTrigger>
                    ) : (
                      reviewButton
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAll}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={confirmOpen} onHide={() => setConfirmOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar recepción</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">{REVIEW_CONFIRM_TEXT}</p>
          {markReviewed.isError && (
            <Alert variant="danger" className="mt-3 mb-0">
              No fue posible marcar el reporte. Intenta de nuevo.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setConfirmOpen(false)}
            disabled={markReviewed.isLoading}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirmMark} disabled={markReviewed.isLoading}>
            {markReviewed.isLoading && (
              <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
            )}
            Sí, marcar como revisado
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ReportDetailModal;
