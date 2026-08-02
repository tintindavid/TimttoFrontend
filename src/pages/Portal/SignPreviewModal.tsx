import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, Spinner } from 'react-bootstrap';
import { AxiosError } from 'axios';
import { publicPortalService } from '@/services/publicPortal.service';

interface SignPreviewModalProps {
  show: boolean;
  onHide: () => void;
  token: string | undefined;
  /**
   * Body to preview — identical shape to the real `/sign` payload. `imagePng`
   * may be empty; the backend renders the layout with a blank cliente-firma
   * spot so the client can preview before drawing.
   */
  payload: {
    reportIds: string[];
    signature: {
      imagePng?: string;
      signerName?: string;
      cargo?: string;
      observaciones?: string;
    };
  } | null;
}

/**
 * Nested modal opened from the SignatureModal's "Ver cómo quedará la hoja
 * de trabajo" link. Fetches the preview HTML from `POST /sign-preview` and
 * renders it inside an iframe via `srcDoc` — no network round-trip after
 * the initial POST, and the iframe stays isolated from the portal's CSS.
 *
 * Two OT groups → the preview HTML concatenates both with a page break, so
 * the iframe just scrolls through them naturally.
 */
const SignPreviewModal: React.FC<SignPreviewModalProps> = ({ show, onHide, token, payload }) => {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!show || !token || !payload) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    publicPortalService
      .previewSign(token, payload)
      .then((res) => {
        if (!cancelled) setHtml(res);
      })
      .catch((err: AxiosError) => {
        if (cancelled) return;
        const status = err.response?.status;
        setError(
          status === 409
            ? 'Ese acceso ya no puede firmar HTs. Solicite un nuevo acceso al administrador.'
            : 'No fue posible generar la vista previa. Intenta de nuevo.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [show, token, payload]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>Vista previa de la firma</Modal.Title>
      </Modal.Header>
      <Modal.Body
        className="p-0 d-flex flex-column"
        style={{ height: '80vh', backgroundColor: '#f5f6fa' }}
      >
        <div className="bg-white border-bottom px-3 py-2 small text-muted">
          Este es el formato exacto que recibirás firmado. Cierra la vista previa cuando termines de
          revisar y firma para confirmar.
        </div>
        <div style={{ flex: '1 1 auto', minHeight: 0, position: 'relative' }}>
          {loading && (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', zIndex: 1 }}
            >
              <Spinner animation="border" aria-label="Cargando vista previa" />
            </div>
          )}
          {error && (
            <Alert variant="danger" className="m-3">
              {error}
            </Alert>
          )}
          {!loading && !error && html && (
            <iframe
              title="Vista previa de la hoja de trabajo firmada"
              srcDoc={html}
              style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#fff' }}
            />
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar vista previa
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SignPreviewModal;
