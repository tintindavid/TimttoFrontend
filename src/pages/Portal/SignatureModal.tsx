import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SignatureCanvas from 'react-signature-canvas';
import { useSign } from '@/hooks/portal/useSign';
import { AxiosError } from 'axios';
import SignPreviewModal from './SignPreviewModal';

export interface SignatureModalReportGroup {
  otId: string;
  otConsecutivo: string;
  reports: Array<{ _id: string; consecutivo: string }>;
}

interface SignatureModalProps {
  show: boolean;
  onHide: () => void;
  token: string | undefined;
  reviewedReports: SignatureModalReportGroup[];
}

interface BackendErrorBody {
  error?: {
    code?: string;
    details?: { reportIds?: string[]; consecutivos?: string[] };
  };
  message?: string;
}

const NAME_MIN = 3;
const NAME_MAX = 100;
const CARGO_MAX = 100;
const OBSERVACIONES_MAX = 2000;

/**
 * Opened from `PortalHome`'s "Firmar N reportes" button. Captures the
 * manuscript signature (canvas), signer name + cargo + observaciones, and
 * fires `POST /sign` via `useSign`.
 *
 * Cédula was removed from the UI (2026-08-02): the backend never persisted
 * it, only length-validated it — so it was dead audit noise for the client.
 * Observaciones was added: text goes into the generated `SheetWork.observaciones`
 * and prints on the HT PDF under "Observaciones".
 *
 * Canvas offset fix: `react-signature-canvas`'s internal canvas has a
 * fixed pixel resolution while the parent stretches to 100% width, which
 * misaligns the pointer trace on desktop. `useEffect` below syncs the
 * canvas internal `width`/`height` (and the 2D context transform for
 * HiDPI) with the container's actual bounding rect on mount and on resize.
 */
const SignatureModal: React.FC<SignatureModalProps> = ({
  show,
  onHide,
  token,
  reviewedReports,
}) => {
  const navigate = useNavigate();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const canvasWrapper = useRef<HTMLDivElement>(null);

  const [signerName, setSignerName] = useState('');
  const [cargo, setCargo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [canvasEmpty, setCanvasEmpty] = useState(true);
  const [invalidSignatureError, setInvalidSignatureError] = useState<string | null>(null);
  const [creatorInvalidError, setCreatorInvalidError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<{
    reportIds: string[];
    signature: {
      imagePng?: string;
      signerName?: string;
      cargo?: string;
      observaciones?: string;
    };
  } | null>(null);

  const signMutation = useSign(token);

  const isNameValid = signerName.trim().length >= NAME_MIN && signerName.trim().length <= NAME_MAX;
  const isCargoValid = cargo.trim().length <= CARGO_MAX;
  const isObservacionesValid = observaciones.length <= OBSERVACIONES_MAX;

  const touchedName = signerName.length > 0;

  const canSubmit =
    !canvasEmpty &&
    isNameValid &&
    isCargoValid &&
    isObservacionesValid &&
    !creatorInvalidError &&
    !signMutation.isLoading;

  // Sync the canvas internal resolution with its rendered size + device
  // pixel ratio so mouse/touch coordinates land where the user actually
  // clicks. Runs when the modal opens and whenever the viewport resizes.
  useEffect(() => {
    if (!show) return;
    const resize = () => {
      const wrapper = canvasWrapper.current;
      const canvas = sigCanvas.current?.getCanvas();
      if (!wrapper || !canvas) return;
      const rect = wrapper.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      // Save existing strokes so a resize doesn't erase them; react-signature-canvas
      // exposes toData/fromData for exactly this.
      const data = sigCanvas.current?.toData();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (data && data.length > 0) {
        sigCanvas.current?.fromData(data);
      }
    };
    // Delay one frame so the modal's transition has laid out the wrapper.
    const raf = requestAnimationFrame(resize);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [show]);

  const resetForm = () => {
    sigCanvas.current?.clear();
    setCanvasEmpty(true);
    setSignerName('');
    setCargo('');
    setObservaciones('');
    setInvalidSignatureError(null);
    setCreatorInvalidError(null);
    setPreviewOpen(false);
    setPreviewPayload(null);
  };

  const handleHide = () => {
    if (signMutation.isLoading) return;
    resetForm();
    onHide();
  };

  const handleClearSignature = () => {
    sigCanvas.current?.clear();
    setCanvasEmpty(true);
  };

  const totalReports = useMemo(
    () => reviewedReports.reduce((n, g) => n + g.reports.length, 0),
    [reviewedReports]
  );
  const otsCount = reviewedReports.length;

  const handleOpenPreview = () => {
    const reportIds = reviewedReports.flatMap((g) => g.reports.map((r) => r._id));
    // If the client already drew a signature, ship it into the preview so
    // they can see how it'll look on the sheet. Otherwise the preview
    // renders with an empty firma-cliente slot — still useful for layout.
    const imagePng =
      sigCanvas.current && !sigCanvas.current.isEmpty()
        ? sigCanvas.current.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
        : undefined;
    setPreviewPayload({
      reportIds,
      signature: {
        imagePng,
        signerName: signerName.trim() || undefined,
        cargo: cargo.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      },
    });
    setPreviewOpen(true);
  };

  const handleEnd = () => {
    setCanvasEmpty(Boolean(sigCanvas.current?.isEmpty()));
  };

  const handleSubmit = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty() || !token) return;

    setInvalidSignatureError(null);

    const dataUrl = sigCanvas.current.toDataURL('image/png');
    const imagePng = dataUrl.replace(/^data:image\/png;base64,/, '');
    const reportIds = reviewedReports.flatMap((group) => group.reports.map((r) => r._id));

    signMutation.mutate(
      {
        reportIds,
        signature: {
          imagePng,
          signerName: signerName.trim(),
          cargo: cargo.trim() || undefined,
          observaciones: observaciones.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          resetForm();
          onHide();
          navigate(`/portal/${token}/historial`);
        },
        onError: (error: AxiosError) => {
          const status = error.response?.status;
          const body = error.response?.data as BackendErrorBody | undefined;
          const code = body?.error?.code;

          if (status === 400 && code === 'SIGN_REQUIRES_REVIEW') {
            const offending = body?.error?.details?.consecutivos || body?.error?.details?.reportIds || [];
            toast.error(
              offending.length > 0
                ? `Estos reportes aún necesitan revisión: ${offending.join(', ')}`
                : 'Algunos reportes seleccionados aún no han sido revisados.'
            );
            return;
          }

          if (status === 400 && code === 'INVALID_SIGNATURE_IMAGE') {
            setInvalidSignatureError('La firma no es válida. Vuelve a firmar.');
            return;
          }

          if (status === 409 && code === 'TOKEN_CREATOR_INVALID') {
            setCreatorInvalidError(
              body?.message || 'Ese acceso ya no puede firmar HTs. Solicite un nuevo acceso al administrador.'
            );
            return;
          }

          toast.error('No fue posible firmar. Intenta de nuevo.');
        },
      }
    );
  };

  return (
    <Modal show={show} onHide={handleHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Firmar recepción de reportes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {creatorInvalidError && <Alert variant="danger">{creatorInvalidError}</Alert>}

        <Alert variant="light" className="border">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              Se van a firmar <strong>{totalReports} reportes</strong> marcados
              {otsCount > 1 && (
                <>
                  {' '}
                  en <strong>{otsCount} órdenes de trabajo</strong>
                </>
              )}
              .
              <div className="small text-muted mt-1">
                Se generará una hoja de trabajo por cada OT firmada.
              </div>
            </div>
            <Button
              variant="link"
              className="p-0 text-decoration-none"
              onClick={handleOpenPreview}
              disabled={totalReports === 0}
            >
              <FaEye className="me-1" />
              Ver cómo quedará la hoja de trabajo
            </Button>
          </div>
        </Alert>

        <div
          ref={canvasWrapper}
          className="border rounded mb-2"
          style={{ touchAction: 'none', height: 200, width: '100%' }}
        >
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            onEnd={handleEnd}
            // No className/style on the canvas here — the internal size is
            // set by the useEffect above based on the wrapper's bounding
            // rect, so pointer coordinates and drawn pixels stay aligned.
            canvasProps={{ 'aria-label': 'Área de firma' }}
          />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="link" className="p-0" onClick={handleClearSignature}>
            Limpiar firma
          </Button>
          <small className="text-muted">{canvasEmpty ? 'Canvas vacío' : 'Firma capturada'}</small>
        </div>
        {invalidSignatureError && (
          <div className="text-danger small mb-3">{invalidSignatureError}</div>
        )}

        <Form>
          <Form.Group className="mb-3" controlId="signerName">
            <Form.Label>Nombre completo</Form.Label>
            <Form.Control
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              isInvalid={touchedName && !isNameValid}
            />
            {touchedName && !isNameValid && (
              <Form.Text className="text-danger">
                El nombre debe tener entre {NAME_MIN} y {NAME_MAX} caracteres.
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3" controlId="cargo">
            <Form.Label>Cargo (opcional)</Form.Label>
            <Form.Control
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              isInvalid={!isCargoValid}
            />
            {!isCargoValid && (
              <Form.Text className="text-danger">Máximo {CARGO_MAX} caracteres.</Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-2" controlId="observaciones">
            <Form.Label>Observaciones (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              maxLength={OBSERVACIONES_MAX}
              placeholder="Comentarios generales sobre la recepción; se imprimirán en la sección Observaciones de la hoja de trabajo."
            />
            <Form.Text className="text-muted">
              {observaciones.length}/{OBSERVACIONES_MAX}
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleHide} disabled={signMutation.isLoading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {signMutation.isLoading && (
            <Spinner animation="border" size="sm" className="me-2" aria-label="Firmando" />
          )}
          Firmar
        </Button>
      </Modal.Footer>

      <SignPreviewModal
        show={previewOpen}
        onHide={() => setPreviewOpen(false)}
        token={token}
        payload={previewPayload}
      />
    </Modal>
  );
};

export default SignatureModal;
