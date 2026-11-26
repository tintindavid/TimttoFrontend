import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { customerService } from '@/services/customer.service';
import { useDemoStatus } from '@/hooks/useDemoStatus';
import { DEMO_BLOCKED_TEXT } from '@/utils/demo';

interface DownloadInventarioModalProps {
  show: boolean;
  customerId: string;
  onHide: () => void;
}

const DownloadInventarioModal: React.FC<DownloadInventarioModalProps> = ({
  show,
  customerId,
  onHide,
}) => {
  const [formato, setFormato] = useState<'excel' | 'pdf'>('excel');
  const [loading, setLoading] = useState(false);
  const { isDemo } = useDemoStatus();
  // Demo accounts only download PDF.
  const selected = isDemo ? 'pdf' : formato;

  // Reset state whenever the modal opens
  useEffect(() => {
    if (show) {
      setFormato('excel');
      setLoading(false);
    }
  }, [show]);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await customerService.downloadInventario(customerId, selected);
      toast.success('Inventario descargado correctamente');
      onHide();
    } catch (err: any) {
      toast.error(err.message || 'Error al generar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleHide = () => {
    if (!loading) onHide();
  };

  return (
    <Modal show={show} onHide={handleHide} centered backdrop={loading ? 'static' : true}>
      <Modal.Header closeButton={!loading}>
        <Modal.Title>Descargar Inventario</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Label className="fw-semibold">Formato de descarga</Form.Label>
          <div className="d-flex gap-4 mt-1">
            <Form.Check
              type="radio"
              id="radio-excel"
              label="Excel (.xlsx)"
              value="excel"
              checked={selected === 'excel'}
              onChange={() => setFormato('excel')}
              disabled={loading || isDemo}
              title={isDemo ? DEMO_BLOCKED_TEXT : undefined}
            />
            <Form.Check
              type="radio"
              id="radio-pdf"
              label="PDF"
              value="pdf"
              checked={selected === 'pdf'}
              onChange={() => setFormato('pdf')}
              disabled={loading}
            />
          </div>
        </Form>
        {isDemo && <p className="text-muted small mt-2 mb-0">Excel: {DEMO_BLOCKED_TEXT.toLowerCase()}.</p>}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleHide} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleDownload} disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Generando...
            </>
          ) : (
            'Descargar'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DownloadInventarioModal;
