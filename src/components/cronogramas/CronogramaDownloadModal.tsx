import React, { useState } from 'react';
import { Modal, Button, Row, Col, Spinner } from 'react-bootstrap';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';

interface Props {
  show: boolean;
  onHide: () => void;
  onDescargarPDF: () => void | Promise<void>;
  onDescargarExcel: () => void | Promise<void>;
  loadingPDF?: boolean;
  loadingExcel?: boolean;
}

/**
 * Modal compartido para elegir el formato de descarga del cronograma
 * (PDF o Excel). Usado tanto desde `/cronogramas` como desde
 * `CustomerEquiposSection` — la semántica del payload la decide el caller.
 */
export const CronogramaDownloadModal: React.FC<Props> = ({
  show,
  onHide,
  onDescargarPDF,
  onDescargarExcel,
  loadingPDF = false,
  loadingExcel = false,
}) => {
  const [internalLoading, setInternalLoading] = useState<'pdf' | 'excel' | null>(null);

  const isLoadingPDF = loadingPDF || internalLoading === 'pdf';
  const isLoadingExcel = loadingExcel || internalLoading === 'excel';
  const isBusy = isLoadingPDF || isLoadingExcel;

  const handlePDF = async () => {
    setInternalLoading('pdf');
    try {
      await onDescargarPDF();
      onHide();
    } finally {
      setInternalLoading(null);
    }
  };

  const handleExcel = async () => {
    setInternalLoading('excel');
    try {
      await onDescargarExcel();
      onHide();
    } finally {
      setInternalLoading(null);
    }
  };

  return (
    <Modal show={show} onHide={isBusy ? undefined : onHide} centered backdrop={isBusy ? 'static' : true}>
      <Modal.Header closeButton={!isBusy}>
        <Modal.Title>Descargar Cronograma</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-3">
          Descarga solo los equipos actualmente filtrados/visibles en el cronograma.
        </p>
        <Row className="g-3">
          <Col xs={6}>
            <Button
              variant="primary"
              className="w-100 py-4 d-flex flex-column align-items-center gap-2"
              onClick={handlePDF}
              disabled={isBusy}
            >
              {isLoadingPDF ? <Spinner animation="border" size="sm" /> : <FaFilePdf size={28} />}
              <span className="fw-bold">PDF</span>
              <small className="text-white-50">Formato imprimible</small>
            </Button>
          </Col>
          <Col xs={6}>
            <Button
              variant="success"
              className="w-100 py-4 d-flex flex-column align-items-center gap-2"
              onClick={handleExcel}
              disabled={isBusy}
            >
              {isLoadingExcel ? <Spinner animation="border" size="sm" /> : <FaFileExcel size={28} />}
              <span className="fw-bold">Excel</span>
              <small className="text-white-50">Formato editable</small>
            </Button>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default CronogramaDownloadModal;
