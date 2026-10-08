import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FaFilePdf } from 'react-icons/fa';
import { EquipmentQr } from '@/types/equipmentQr.types';

/** A QR + the inventario of its equipo (the dynamic third sticker line). */
export interface EquipmentQrPreviewItem {
  qr: EquipmentQr;
  inventario?: string | null;
}

interface EquipmentQrPreviewModalProps {
  show: boolean;
  onHide: () => void;
  items: EquipmentQrPreviewItem[];
  /** When provided, shows a confirm button that triggers the PDF export. */
  onConfirmExport?: () => void;
  isExporting?: boolean;
}

/**
 * Preview of the sticker layout before printing — QR square on the left,
 * three stacked lines on the right: "Mantenimiento", "Información", and the
 * equipo's `Inventario` as the dynamic third line. Mirrors the PDF layout
 * produced by `equipmentQrPdf.service.js`. Used both as the per-row "Ver QR"
 * modal and as the confirm step before a bulk export.
 */
const EquipmentQrPreviewModal: React.FC<EquipmentQrPreviewModalProps> = ({
  show,
  onHide,
  items,
  onConfirmExport,
  isExporting,
}) => {
  return (
    <Modal show={show} onHide={onHide} centered size={items.length > 1 ? 'lg' : undefined}>
      <Modal.Header closeButton>
        <Modal.Title>
          {items.length > 1 ? `Vista previa — ${items.length} stickers` : 'Vista previa del QR'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {items.length === 0 ? (
          <p className="text-muted text-center mb-0">No hay QRs para mostrar.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {items.map(({ qr, inventario }) => (
              <div
                key={qr._id}
                className="d-flex align-items-center gap-3 border rounded p-2"
              >
                <div className="flex-shrink-0 bg-white border p-1">
                  {qr.qrImageDataUri ? (
                    <img
                      src={qr.qrImageDataUri}
                      alt={`QR del equipo ${qr.equipoId}`}
                      style={{ width: 128, height: 128 }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center text-muted small text-center"
                      style={{ width: 128, height: 128 }}
                    >
                      QR aún no generado
                    </div>
                  )}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">Mantenimiento</div>
                  <div className="fw-semibold">Información</div>
                  <div className="fw-semibold">{inventario || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cerrar</Button>
        {onConfirmExport && (
          <Button variant="primary" onClick={onConfirmExport} disabled={isExporting}>
            <FaFilePdf className="me-2" />
            {isExporting ? 'Exportando...' : 'Confirmar y exportar'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default EquipmentQrPreviewModal;
