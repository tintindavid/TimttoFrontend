import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useRegistrarCotizacion } from '@/hooks/useLicitacion';
import {
  COTIZACION_MAX_BYTES,
  COTIZACION_TIPOS_PERMITIDOS,
  type ProveedorLicitacion,
  type RegistrarCotizacionDto,
} from '@/types/licitacion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { isHttpsUrl } from '@/utils/requisicion.utils';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicionId: string;
  proveedor: ProveedorLicitacion | null;
  defaultMoneda?: string;
}

/** Registers, on behalf of a supplier, a quotation received outside the portal (file, link or note). */
const CotizacionInternaModal: React.FC<Props> = ({ show, onHide, requisicionId, proveedor, defaultMoneda = 'COP' }) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [observacion, setObservacion] = useState('');
  const [valor, setValor] = useState('');
  const [moneda, setMoneda] = useState(defaultMoneda);
  const [dias, setDias] = useState('');
  const mutation = useRegistrarCotizacion();

  useEffect(() => {
    if (show) {
      setArchivo(null);
      setLink('');
      setObservacion('');
      setValor('');
      setMoneda(defaultMoneda);
      setDias('');
    }
  }, [show, defaultMoneda]);

  const fileError = archivo
    ? !COTIZACION_TIPOS_PERMITIDOS.includes(archivo.type)
      ? 'Solo se admiten PDF o imágenes (JPG, PNG, WEBP).'
      : archivo.size > COTIZACION_MAX_BYTES
        ? 'El archivo supera los 5 MB.'
        : ''
    : '';
  const linkError = link.trim() && !isHttpsUrl(link.trim()) ? 'El enlace debe comenzar con https://' : '';
  const valorNum = valor.trim() === '' ? undefined : Number(valor);
  const valorError = valorNum !== undefined && (!Number.isFinite(valorNum) || valorNum < 0) ? 'Ingresa un valor válido.' : '';
  const diasNum = dias.trim() === '' ? undefined : Number(dias);
  const diasError = diasNum !== undefined && (!Number.isInteger(diasNum) || diasNum < 0) ? 'Ingresa días enteros.' : '';
  const empty = !archivo && !link.trim() && !observacion.trim();
  const invalid = empty || !!fileError || !!linkError || !!valorError || !!diasError;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!proveedor || invalid || mutation.isLoading) return;
    const data: RegistrarCotizacionDto = {
      archivo,
      linkPropuesta: link.trim() || undefined,
      observacion: observacion.trim() || undefined,
      valorTotal: valorNum,
      moneda: valorNum !== undefined ? moneda.trim().toUpperCase() || undefined : undefined,
      tiempoEntregaDias: diasNum,
    };
    try {
      await mutation.mutateAsync({ id: requisicionId, paId: proveedor._id, data });
      toast.success('Cotización registrada.');
      onHide();
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible registrar la cotización.'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>Registrar cotización</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Proveedor: <strong>{proveedor?.nombre}</strong>
          </p>
          <Alert variant="info" className="small">
            Incluye al menos un archivo, un enlace o una observación.
          </Alert>
          <Form.Group className="mb-3" controlId="cotizacion-archivo">
            <Form.Label>Archivo (PDF o imagen, máx. 5 MB)</Form.Label>
            <Form.Control
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              isInvalid={!!fileError}
              onChange={(e) => setArchivo((e.target as HTMLInputElement).files?.[0] ?? null)}
            />
            <Form.Control.Feedback type="invalid">{fileError}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="cotizacion-link">
            <Form.Label>Enlace a la propuesta</Form.Label>
            <Form.Control type="url" value={link} onChange={(e) => setLink(e.target.value)} isInvalid={!!linkError} placeholder="https://" />
            <Form.Control.Feedback type="invalid">{linkError}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="cotizacion-observacion">
            <Form.Label>Observación</Form.Label>
            <Form.Control as="textarea" rows={2} maxLength={2000} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
          </Form.Group>
          <Row className="g-2">
            <Col sm={5}>
              <Form.Group controlId="cotizacion-valor">
                <Form.Label>Valor total</Form.Label>
                <Form.Control type="number" min={0} step="any" value={valor} onChange={(e) => setValor(e.target.value)} isInvalid={!!valorError} />
                <Form.Control.Feedback type="invalid">{valorError}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col sm={3}>
              <Form.Group controlId="cotizacion-moneda">
                <Form.Label>Moneda</Form.Label>
                <Form.Control maxLength={3} value={moneda} onChange={(e) => setMoneda(e.target.value)} />
              </Form.Group>
            </Col>
            <Col sm={4}>
              <Form.Group controlId="cotizacion-dias">
                <Form.Label>Entrega (días)</Form.Label>
                <Form.Control type="number" min={0} step={1} value={dias} onChange={(e) => setDias(e.target.value)} isInvalid={!!diasError} />
                <Form.Control.Feedback type="invalid">{diasError}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={mutation.isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={invalid || mutation.isLoading}>
            {mutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Registrar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CotizacionInternaModal;
