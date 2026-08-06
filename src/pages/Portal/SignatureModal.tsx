import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useSign } from '@/hooks/portal/useSign';
import { useSignExistingSheet } from '@/hooks/portal/useSignExistingSheet';
import { portalKeys } from '@/hooks/portal/usePortalData';
import { AxiosError } from 'axios';
import SignatureInput, { SignatureInputHandle } from '@/components/common/SignatureInput';
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
  /**
   * `'initial'` (default) creates N `SheetWork` via `POST /sign` from the
   * reviewed-reports selection. `'late'` attaches a signature to a single
   * already-existing `SheetWork` whose `firmaFile` is empty, via
   * `POST /sheets/:sheetId/sign` (`portal-signature-flow` D3/D7) — opened
   * from `PortalSheetsHistory`'s "Firmar hoja" icon.
   */
  mode?: 'initial' | 'late';
  /** Required when `mode === 'late'`. */
  sheetId?: string;
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
 * Opened from `PortalHome`'s "Firmar N reportes" button (`mode: 'initial'`,
 * default) or from `PortalSheetsHistory`'s "Firmar hoja" icon
 * (`mode: 'late'`). Captures the manuscript signature (via the shared
 * `SignatureInput` — canvas or uploaded image), signer name + cargo +
 * observaciones, and fires the matching mutation.
 *
 * Cédula was removed from the UI (2026-08-02): the backend never persisted
 * it, only length-validated it — so it was dead audit noise for the client.
 * Observaciones was added: text goes into the generated `SheetWork.observaciones`
 * and prints on the HT PDF under "Observaciones".
 *
 * The canvas-offset/HiDPI resize logic and the draw/upload toggle live in
 * `SignatureInput` (`portal-signature-flow` D5/D8) — this component only
 * reads its imperative handle (`getPngBase64`/`isEmpty`) at submit time.
 */
const SignatureModal: React.FC<SignatureModalProps> = ({
  show,
  onHide,
  token,
  reviewedReports,
  mode = 'initial',
  sheetId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signatureRef = useRef<SignatureInputHandle>(null);

  const [signerName, setSignerName] = useState('');
  const [cargo, setCargo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
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
  const lateSignMutation = useSignExistingSheet(token, sheetId);
  const activeMutation = mode === 'late' ? lateSignMutation : signMutation;

  const isNameValid = signerName.trim().length >= NAME_MIN && signerName.trim().length <= NAME_MAX;
  const isCargoValid = cargo.trim().length <= CARGO_MAX;
  const isObservacionesValid = observaciones.length <= OBSERVACIONES_MAX;

  const touchedName = signerName.length > 0;

  const canSubmit =
    hasSignature &&
    isNameValid &&
    isCargoValid &&
    isObservacionesValid &&
    !creatorInvalidError &&
    !activeMutation.isLoading;

  const handleSignatureChange = () => {
    setHasSignature(!(signatureRef.current?.isEmpty() ?? true));
  };

  const resetForm = () => {
    signatureRef.current?.clear();
    setHasSignature(false);
    setSignerName('');
    setCargo('');
    setObservaciones('');
    setInvalidSignatureError(null);
    setCreatorInvalidError(null);
    setPreviewOpen(false);
    setPreviewPayload(null);
  };

  const handleHide = () => {
    if (activeMutation.isLoading) return;
    resetForm();
    onHide();
  };

  const totalReports = useMemo(
    () => reviewedReports.reduce((n, g) => n + g.reports.length, 0),
    [reviewedReports]
  );
  const otsCount = reviewedReports.length;

  const handleOpenPreview = () => {
    const reportIds = reviewedReports.flatMap((g) => g.reports.map((r) => r._id));
    // If the client already captured a signature, ship it into the preview
    // so they can see how it'll look on the sheet. Otherwise the preview
    // renders with an empty firma-cliente slot — still useful for layout.
    const imagePng = signatureRef.current && !signatureRef.current.isEmpty()
      ? signatureRef.current.getPngBase64() ?? undefined
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

  const handleSubmit = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty() || !token) return;
    if (mode === 'late' && !sheetId) return;

    setInvalidSignatureError(null);

    const imagePng = signatureRef.current.getPngBase64();
    if (!imagePng) return;

    const signature = {
      imagePng,
      signerName: signerName.trim(),
      cargo: cargo.trim() || undefined,
      observaciones: observaciones.trim() || undefined,
    };

    if (mode === 'late') {
      lateSignMutation.mutate(
        { signature },
        {
          onSuccess: () => {
            resetForm();
            onHide();
          },
          onError: (error: AxiosError) => {
            const status = error.response?.status;
            const body = error.response?.data as BackendErrorBody | undefined;
            const code = body?.error?.code;

            if (status === 400 && code === 'INVALID_SIGNATURE_IMAGE') {
              setInvalidSignatureError(
                'La firma no es válida. Vuelve a firmar o carga una imagen con más contenido.'
              );
              return;
            }

            if (status === 409 && code === 'SHEET_ALREADY_SIGNED') {
              toast.info('Esta hoja ya tiene firma.');
              if (token) queryClient.invalidateQueries({ queryKey: portalKeys.sheets(token) });
              resetForm();
              onHide();
              return;
            }

            if (status === 404 && code === 'SHEET_NOT_FOUND') {
              toast.error('La hoja no está disponible con este acceso.');
              resetForm();
              onHide();
              return;
            }

            toast.error('No fue posible firmar. Intenta de nuevo.');
          },
        }
      );
      return;
    }

    const reportIds = reviewedReports.flatMap((group) => group.reports.map((r) => r._id));

    signMutation.mutate(
      { reportIds, signature },
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
            setInvalidSignatureError(
              'La firma no es válida. Vuelve a firmar o carga una imagen con más contenido.'
            );
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
        <Modal.Title>
          {mode === 'late' ? 'Firmar hoja de trabajo' : 'Firmar recepción de reportes'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {creatorInvalidError && <Alert variant="danger">{creatorInvalidError}</Alert>}

        {mode === 'initial' && (
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
        )}

        <SignatureInput ref={signatureRef} onChange={handleSignatureChange} />
        {invalidSignatureError && (
          <div className="text-danger small mb-3 mt-2">{invalidSignatureError}</div>
        )}

        <Form>
          <Form.Group className="mb-3 mt-3" controlId="signerName">
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
        <Button variant="secondary" onClick={handleHide} disabled={activeMutation.isLoading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {activeMutation.isLoading && (
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
