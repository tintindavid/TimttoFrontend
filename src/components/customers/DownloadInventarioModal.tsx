import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { customerService } from '@/services/customer.service';

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
      await customerService.downloadInventario(customerId, formato);
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
              checked={formato === 'excel'}
              onChange={() => setFormato('excel')}
              disabled={loading}
            />
            <Form.Check
              type="radio"
              id="radio-pdf"
              label="PDF"
              value="pdf"
              checked={formato === 'pdf'}
              onChange={() => setFormato('pdf')}
              disabled={loading}
            />
          </div>
        </Form>
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
