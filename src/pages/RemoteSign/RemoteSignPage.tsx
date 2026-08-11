import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { FaDownload, FaSignature } from 'react-icons/fa';
import SignatureInput, { SignatureInputHandle } from '@/components/common/SignatureInput';
import { useRemoteSignData } from '@/hooks/useRemoteSignData';
import { useSubmitRemoteSign } from '@/hooks/useSubmitRemoteSign';
import RemoteSignExpired from './RemoteSignExpired';
import './RemoteSignPage.css';

const formatExpires = (iso?: string): string => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(
      new Date(iso)
    );
  } catch {
    return '';
  }
};

const RemoteSignPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const { data, isLoading, error, refetch } = useRemoteSignData(token);
  const submit = useSubmitRemoteSign(token);

  const sigRef = useRef<SignatureInputHandle>(null);
  const [recibe, setRecibe] = useState('');
  const [cargo, setCargo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);

  const handleSignatureChange = () => {
    const hasSig = !(sigRef.current?.isEmpty() ?? true);
    setCanSubmit(hasSig && recibe.trim().length > 0 && cargo.trim().length > 0);
  };

  const recomputeCanSubmit = (nextRecibe: string, nextCargo: string) => {
    const hasSig = !(sigRef.current?.isEmpty() ?? true);
    setCanSubmit(hasSig && nextRecibe.trim().length > 0 && nextCargo.trim().length > 0);
  };

  if (isLoading) {
    return (
      <div className="remote-sign-page d-flex justify-content-center align-items-center">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    const status = (error as any)?.response?.status;
    const reason: 'expired' | 'not_found' | 'revoked' | 'superseded' =
      status === 410
        ? ((error as any)?.response?.data?.error?.replace('token_', '') as any) || 'expired'
        : status === 404
        ? 'not_found'
        : 'expired';
    return (
      <div className="remote-sign-page">
        <RemoteSignExpired reason={reason} />
      </div>
    );
  }

  const payload = data?.data;
  if (!payload) {
    return (
      <div className="remote-sign-page">
        <RemoteSignExpired reason="not_found" />
      </div>
    );
  }

  const { status, sheet, tenant, previewHtml, pdfUrl, pdfStatus, expiresAt } = payload;

  if (status === 'expired' || status === 'revoked' || status === 'superseded') {
    return (
      <div className="remote-sign-page">
        <RemoteSignExpired reason={status} />
      </div>
    );
  }

  const handleSubmit = async () => {
    const imagePng = sigRef.current?.getPngBase64();
    if (!imagePng) return;
    try {
      await submit.mutateAsync({
        signature: {
          imagePng,
          signerName: recibe.trim(),
          cargo: cargo.trim() || undefined,
          observaciones: observaciones.trim() || undefined,
        },
      });
      await refetch();
    } catch {
      // toast/alert surfaced by mutation error state below
    }
  };

  return (
    <div className="remote-sign-page">
      <div className="remote-sign-header">
        {tenant.logoUrl && <img src={tenant.logoUrl} alt={tenant.name || 'Tenant'} />}
        <div>
          <h1>Hoja de Trabajo {sheet.numeroHoja || ''}</h1>
          <small>
            {tenant.name || 'TIMTTO'} · {sheet.clienteNombre || 'Cliente'}
          </small>
        </div>
      </div>

      {status === 'signed' ? (
        <div className="remote-sign-card">
          <Alert variant="success">
            Firmaste esta hoja de trabajo. Puedes descargarla hasta el{' '}
            <strong>{formatExpires(expiresAt)}</strong>.
          </Alert>
          {pdfStatus === 'ready' && pdfUrl ? (
            <div className="remote-sign-download">
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                <Button variant="success">
                  <FaDownload className="me-2" /> Descargar PDF firmado
                </Button>
              </a>
            </div>
          ) : (
            <div className="remote-sign-download">
              <Spinner animation="border" className="me-2" /> Generando PDF firmado…
            </div>
          )}
          {pdfStatus === 'ready' && pdfUrl && (
            <div className="remote-sign-preview-wrap mt-3">
              <iframe src={pdfUrl} title="Hoja firmada" />
            </div>
          )}
        </div>
      ) : (
        <>
          {previewHtml && (
            <div className="remote-sign-preview-wrap">
              <iframe srcDoc={previewHtml} title="Hoja de trabajo — vista previa" />
            </div>
          )}
          <div className="remote-sign-card">
            <h2>Firmar hoja de trabajo</h2>
            <Alert variant="info">
              Complete sus datos y firme para confirmar la recepción del servicio.
              El enlace vence el <strong>{formatExpires(expiresAt)}</strong>.
            </Alert>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>
                  Nombre completo <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={recibe}
                  onChange={(e) => {
                    setRecibe(e.target.value);
                    recomputeCanSubmit(e.target.value, cargo);
                  }}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Cargo <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={cargo}
                  onChange={(e) => {
                    setCargo(e.target.value);
                    recomputeCanSubmit(recibe, e.target.value);
                  }}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Observaciones (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  maxLength={2000}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Firma <span className="text-danger">*</span>
                </Form.Label>
                <SignatureInput ref={sigRef} onChange={handleSignatureChange} />
              </Form.Group>
            </Form>

            {submit.isError && (
              <Alert variant="danger">
                {(submit.error as any)?.response?.data?.message ||
                  'No fue posible enviar la firma. Intenta nuevamente.'}
              </Alert>
            )}

            <div className="text-end">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit || submit.isPending}
              >
                {submit.isPending ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" /> Enviando…
                  </>
                ) : (
                  <>
                    <FaSignature className="me-2" /> Firmar y enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RemoteSignPage;
