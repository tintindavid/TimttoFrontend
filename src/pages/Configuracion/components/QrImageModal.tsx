import React from 'react';
import { Alert, Button, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaCopy, FaFilePdf } from 'react-icons/fa';
import jsPDF from 'jspdf';
import { ServiceQr } from '@/types/serviceQr.types';

interface QrImageModalProps {
  show: boolean;
  onHide: () => void;
  qr: ServiceQr | null;
}

const resolveServicioName = (
  servicioId: ServiceQr['servicioId'],
): string => {
  if (!servicioId) return '';
  if (typeof servicioId === 'string') return servicioId;
  return servicioId.nombre || '';
};

const buildPdfFilename = (qr: ServiceQr): string => {
  const servicio = resolveServicioName(qr.servicioId) || 'servicio';
  const safe = servicio.replace(/[^a-zA-Z0-9-_]+/g, '_').toLowerCase();
  return `qr-${safe}-${qr.qrToken.slice(0, 8)}.pdf`;
};

const downloadQrPdf = (qr: ServiceQr): void => {
  if (!qr.qrImageDataUri) {
    toast.error('La imagen del QR no está disponible para descargar.');
    return;
  }

  const servicio = resolveServicioName(qr.servicioId) || 'XXX';
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // A4 dimensions in mm: 210 x 297. Half page = 148.5mm tall.
  const pageWidth = doc.internal.pageSize.getWidth();
  const halfHeight = doc.internal.pageSize.getHeight() / 2;

  // QR image: square, centered horizontally, occupying most of the half page.
  // Leave room for the footer text below.
  const qrSize = 120; // mm — large and easily scannable
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = 20; // top margin inside the half page

  doc.addImage(qr.qrImageDataUri, 'PNG', qrX, qrY, qrSize, qrSize);

  // Footer text below the QR, within the same half-page region.
  const footerY = qrY + qrSize + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Reportar Fallas Equipos Biomédicos', pageWidth / 2, footerY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(`Servicio: ${servicio}`, pageWidth / 2, footerY + 8, { align: 'center' });

  // Subtle separator marking the half-page boundary (helps when printing
  // to cut the page in half for posting).
  doc.setDrawColor(200);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(10, halfHeight, pageWidth - 10, halfHeight);

  doc.save(buildPdfFilename(qr));
  toast.success('PDF descargado.');
};

const QrImageModal: React.FC<QrImageModalProps> = ({ show, onHide, qr }) => {
  if (!qr) return null;

  const publicUrl = `${window.location.origin}/public/ticket/${qr.qrToken}`;
  const servicio = resolveServicioName(qr.servicioId);

  const handleCopy = async (text: string, label: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiada al portapapeles.`);
    } catch {
      toast.error('No fue posible copiar.');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>QR de Servicio</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {qr.qrImageDataUri ? (
          <img
            src={qr.qrImageDataUri}
            alt={`QR del servicio ${servicio || ''}`.trim()}
            style={{ maxWidth: 280, height: 'auto' }}
            className="border p-2 bg-white mb-3"
          />
        ) : (
          <Alert variant="warning" className="mb-3">
            La imagen del QR no se generó. Comparta la URL directamente o
            intente recrear el QR.
          </Alert>
        )}

        <div className="d-grid mb-3">
          <Button
            variant="primary"
            onClick={() => downloadQrPdf(qr)}
            disabled={!qr.qrImageDataUri}
          >
            <FaFilePdf className="me-2" />
            Descargar PDF (media página)
          </Button>
        </div>

        <div className="mb-3 text-start">
          <div className="small text-muted">URL pública</div>
          <div className="d-flex align-items-center gap-2">
            <code className="flex-grow-1 small text-break">{publicUrl}</code>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => handleCopy(publicUrl, 'URL')}
              title="Copiar URL"
            >
              <FaCopy />
            </Button>
          </div>
        </div>

        <div className="text-start">
          <div className="small text-muted">qrToken</div>
          <div className="d-flex align-items-center gap-2">
            <code className="flex-grow-1 small text-break">{qr.qrToken}</code>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => handleCopy(qr.qrToken, 'qrToken')}
              title="Copiar qrToken"
            >
              <FaCopy />
            </Button>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QrImageModal;
