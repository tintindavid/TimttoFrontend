import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Spinner, Table } from 'react-bootstrap';
import { FaSignature } from 'react-icons/fa';
import { useSheetsHistory } from '@/hooks/portal/useSheetsHistory';
import { publicPortalService } from '@/services/publicPortal.service';
import { PortalSheet } from '@/types/publicPortal.types';
import SignatureModal from './SignatureModal';

const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
};

/**
 * `/portal/:token/historial` — lists `SheetWork` generated from the current
 * token (D12). Polls every 3s while any sheet is `pdfStatus: 'pending'`
 * via `useSheetsHistory`, stops once every sheet is `ready`/`error`.
 */
const PortalSheetsHistory: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = useSheetsHistory(token);
  const sheets: PortalSheet[] = data?.data?.sheets ?? [];

  // Sheet targeted by the "Firmar hoja" icon (`portal-signature-flow` D3/D7)
  // — only rendered for sheets created without a signature (`firmaFile`
  // empty). Opens `SignatureModal` in `mode="late"`.
  const [signLateSheet, setSignLateSheet] = useState<PortalSheet | null>(null);

  return (
    <>
      <div className="mb-3">
        <Link to={`/portal/${token}`}>&larr; Volver al listado</Link>
      </div>
      <h4 className="mb-3">Historial de firmas</h4>

      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" aria-label="Cargando historial" />
        </div>
      )}

      {!isLoading && isError && (
        <Alert variant="danger">No fue posible cargar el historial.</Alert>
      )}

      {!isLoading && !isError && sheets.length === 0 && (
        <p className="text-muted">
          Aún no has firmado ninguna hoja de trabajo desde este acceso.
        </p>
      )}

      {!isLoading && !isError && sheets.length > 0 && (
        <Table striped bordered responsive>
          <thead>
            <tr>
              <th># Hoja</th>
              <th>OT</th>
              <th>Firmada el</th>
              <th>Hoja de trabajo</th>
              <th>Reportes</th>
            </tr>
          </thead>
          <tbody>
            {sheets.map((sheet) => (
              <tr key={sheet._id}>
                <td>{sheet.numeroHoja}</td>
                <td>{sheet.otConsecutivo}</td>
                <td>{formatDate(sheet.signedAt)}</td>
                <td>
                  {sheet.pdfStatus === 'ready' && (
                    <a href={publicPortalService.getSheetPdfUrl(token as string, sheet._id)} download>
                      <Button variant="outline-primary" size="sm">
                        Descargar HT
                      </Button>
                    </a>
                  )}
                  {sheet.pdfStatus === 'pending' && (
                    <span className="text-muted">
                      <Spinner animation="border" size="sm" className="me-2" aria-label="Generando PDF" />
                      Generando PDF...
                    </span>
                  )}
                  {sheet.pdfStatus === 'error' && (
                    <span className="text-danger">No se pudo generar el PDF</span>
                  )}
                </td>
                <td>
                  {/* ZIP with one PDF per report of the sheet — same content
                      the admin gets from Hojas de trabajo > Reportes PDF.
                      Requires the sheet PDF to be ready because the reports
                      only exist as a signed batch once the sheet flow
                      finished; while pending we hide the button to avoid
                      a half-signed download. */}
                  {sheet.pdfStatus === 'ready' ? (
                    <a
                      href={publicPortalService.getSheetReportsZipUrl(token as string, sheet._id)}
                      download
                    >
                      <Button variant="outline-secondary" size="sm">
                        Descargar reportes (ZIP)
                      </Button>
                    </a>
                  ) : (
                    <span className="text-muted small">—</span>
                  )}
                  {!sheet.firmaFile && (
                    <Button
                      variant="link"
                      size="sm"
                      className="ms-2"
                      title="Firmar hoja"
                      onClick={() => setSignLateSheet(sheet)}
                    >
                      <FaSignature />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <SignatureModal
        show={!!signLateSheet}
        onHide={() => setSignLateSheet(null)}
        token={token}
        reviewedReports={[]}
        mode="late"
        sheetId={signLateSheet?._id}
      />
    </>
  );
};

export default PortalSheetsHistory;
