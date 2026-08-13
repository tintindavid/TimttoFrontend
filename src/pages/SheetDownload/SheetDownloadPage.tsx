import React from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { FaDownload, FaFileArchive } from 'react-icons/fa';
import { useSheetDownloadData } from '@/hooks/useSheetDownloadData';
import { publicSheetDownloadService } from '@/services/publicSheetDownload.service';
import SheetDownloadExhausted from './SheetDownloadExhausted';
import './SheetDownloadPage.css';

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

const SheetDownloadPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const { data, isLoading, error, refetch } = useSheetDownloadData(token);

  if (isLoading) {
    return (
      <div className="sheet-download-page d-flex justify-content-center align-items-center">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    const status = (error as any)?.response?.status;
    const errKey = (error as any)?.response?.data?.error;
    let reason: 'exhausted' | 'expired' | 'revoked' | 'not_found' = 'exhausted';
    if (status === 404) reason = 'not_found';
    else if (errKey === 'token_expired') reason = 'expired';
    else if (errKey === 'token_revoked') reason = 'revoked';
    else if (errKey === 'download_exhausted') reason = 'exhausted';
    return (
      <div className="sheet-download-page">
        <SheetDownloadExhausted reason={reason} />
      </div>
    );
  }

  const meta = data?.data;
  if (!meta) {
    return (
      <div className="sheet-download-page">
        <SheetDownloadExhausted reason="not_found" />
      </div>
    );
  }

  if (meta.status !== 'active') {
    const reason: 'exhausted' | 'expired' | 'revoked' =
      meta.status === 'expired' ? 'expired' : meta.status === 'revoked' ? 'revoked' : 'exhausted';
    return (
      <div className="sheet-download-page">
        <SheetDownloadExhausted reason={reason} />
      </div>
    );
  }

  const htRemaining = Math.max(0, meta.downloadsAllowed - meta.downloadsUsed);
  const reportsRemaining = Math.max(0, meta.reportDownloadsAllowed - meta.reportDownloadsUsed);
  const htUrl = publicSheetDownloadService.buildHtPdfUrl(token);
  const reportsUrl = publicSheetDownloadService.buildReportsZipUrl(token);

  const onDownloadFinished = () => {
    // Refetch metadata so counters update. Browsers navigate the anchor's
    // href directly, so we rely on window focus event to re-run the query.
    // As a belt-and-suspenders, also trigger an immediate refetch shortly
    // after the click so counters update even if focus never leaves.
    setTimeout(() => {
      refetch();
    }, 1500);
  };

  return (
    <div className="sheet-download-page">
      <div className="sheet-download-header">
        <h1>Hoja de Trabajo {meta.sheetNumero || ''}</h1>
        <small className="text-muted">
          {meta.tenantName || 'TIMTTO'}
          {meta.otConsecutivo ? ` · OT ${meta.otConsecutivo}` : ''}
        </small>
      </div>

      <Alert variant="warning" className="sheet-download-banner">
        <strong>Válido hasta:</strong> {formatExpires(meta.expiresAt)}
      </Alert>

      <div className="sheet-download-card">
        <a href={htUrl} target="_blank" rel="noreferrer" onClick={onDownloadFinished}>
          <Button variant="success" disabled={htRemaining <= 0}>
            <FaDownload className="me-2" /> Descargar Hoja de Trabajo
          </Button>
        </a>
        <div className="counter">
          {htRemaining} descarga{htRemaining === 1 ? '' : 's'} restante{htRemaining === 1 ? '' : 's'} de {meta.downloadsAllowed}
        </div>
      </div>

      {meta.allowReports && (
        <div className="sheet-download-card">
          <a href={reportsUrl} target="_blank" rel="noreferrer" onClick={onDownloadFinished}>
            <Button variant="primary" disabled={reportsRemaining <= 0}>
              <FaFileArchive className="me-2" /> Descargar Reportes (ZIP)
            </Button>
          </a>
          <div className="counter">
            {reportsRemaining} descarga{reportsRemaining === 1 ? '' : 's'} restante{reportsRemaining === 1 ? '' : 's'} de {meta.reportDownloadsAllowed}
          </div>
        </div>
      )}
    </div>
  );
};

export default SheetDownloadPage;
