import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, OverlayTrigger, Popover, Spinner } from 'react-bootstrap';
import { FaInfoCircle, FaPaperPlane } from 'react-icons/fa';
import { SheetWork } from '@/types/reporte.types';
import { useShareSignedSheet } from '@/hooks/useShareSignedSheet';

interface Props {
  show: boolean;
  onHide: () => void;
  sheet: SheetWork | null;
  customerEmail?: string | null;
  correousados?: string[];
  otId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INFO_COPY =
  'El enlace permite hasta 3 descargas de la Hoja de Trabajo durante 3 días. Si habilitas los reportes, el cliente podrá descargar el ZIP hasta 2 veces. Cada envío desde este botón invalida el enlace anterior y reinicia los contadores.';

const InfoPopover = (
  <Popover id="share-signed-sheet-info-popover" style={{ maxWidth: 320 }}>
    <Popover.Body>{INFO_COPY}</Popover.Body>
  </Popover>
);

function formatRelative(iso?: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return '';
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'hace instantes';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `hace ${diffD} d`;
}

/**
 * Shared between WorkSheets (OT detail) and HojasTrabajoTab (Diario).
 * Only renders when `sheet` is populated.
 */
const SendSignedSheetModal: React.FC<Props> = ({
  show,
  onHide,
  sheet,
  customerEmail,
  correousados = [],
  otId,
}) => {
  const [email, setEmail] = useState('');
  const [allowReports, setAllowReports] = useState(false);

  const mutation = useShareSignedSheet(otId);

  useEffect(() => {
    if (show && sheet) {
      const prefill =
        sheet.shareHistory?.lastEmail ||
        customerEmail ||
        (correousados.length > 0 ? correousados[0] : '') ||
        '';
      setEmail(prefill);
      setAllowReports(false);
    }
  }, [show, sheet, customerEmail, correousados]);

  const emailValid = EMAIL_RE.test(email.trim());
  const sendCount = sheet?.shareHistory?.sendCount ?? 0;

  const handleSubmit = async (): Promise<void> => {
    if (!sheet?._id || !emailValid) return;
    try {
      await mutation.mutateAsync({
        sheetId: sheet._id,
        email: email.trim().toLowerCase(),
        allowReports,
      });
      onHide();
    } catch {
      // toast surfaced by the hook
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaPaperPlane className="me-2" />
          Enviar HT {sheet?.numeroHoja || ''}
          <OverlayTrigger trigger="click" placement="right" overlay={InfoPopover} rootClose>
            <Button variant="link" size="sm" className="p-0 ms-2 align-baseline" aria-label="Información">
              <FaInfoCircle />
            </Button>
          </OverlayTrigger>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="mb-3 small">
          Se enviará un enlace de descarga al correo. Vence en 3 días y permite hasta 3 descargas de la HT.
        </Alert>

        {sendCount > 0 && (
          <div className="text-muted small mb-3">
            Ya enviado {sendCount} {sendCount === 1 ? 'vez' : 'veces'}
            {sheet?.shareHistory?.lastEmail ? ` · último a ${sheet.shareHistory.lastEmail}` : ''}
            {sheet?.shareHistory?.lastSentAt ? ` · ${formatRelative(sheet.shareHistory.lastSentAt)}` : ''}.
          </div>
        )}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>
              Correo del destinatario <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              list="share-signed-sheet-emails"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com"
              required
              isInvalid={email.length > 0 && !emailValid}
            />
            {correousados.length > 0 && (
              <datalist id="share-signed-sheet-emails">
                {correousados.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            )}
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Check
              id="share-signed-sheet-allow-reports"
              type="checkbox"
              label="Permitir descargar los reportes (hasta 2 veces)"
              checked={allowReports}
              onChange={(e) => setAllowReports(e.target.checked)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!emailValid || mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" /> Enviando…
            </>
          ) : (
            <>
              <FaPaperPlane className="me-1" /> Enviar
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SendSignedSheetModal;
