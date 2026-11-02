import React, { useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { COTIZACION_MAX_BYTES, COTIZACION_TIPOS_PERMITIDOS, type RegistrarCotizacionDto } from '@/types/licitacion.types';

interface Props {
  isSubmitting: boolean;
  alreadySent: boolean;
  onSubmit: (data: RegistrarCotizacionDto) => void;
}

const isHttps = (value: string): boolean => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

/** Quotation form of the supplier portal: a file, an https link or a note is enough; amounts are optional. */
const PublicCotizacionForm: React.FC<Props> = ({ isSubmitting, alreadySent, onSubmit }) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [observacion, setObservacion] = useState('');
  const [valor, setValor] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [dias, setDias] = useState('');

  const fileError = archivo
    ? !COTIZACION_TIPOS_PERMITIDOS.includes(archivo.type)
      ? 'Solo se admiten PDF o imágenes (JPG, PNG, WEBP).'
      : archivo.size > COTIZACION_MAX_BYTES
        ? 'El archivo supera los 5 MB.'
        : ''
    : '';
  const linkError = link.trim() && !isHttps(link.trim()) ? 'El enlace debe comenzar con https://' : '';
  const valorNum = valor.trim() === '' ? undefined : Number(valor);
  const valorError = valorNum !== undefined && (!Number.isFinite(valorNum) || valorNum < 0) ? 'Ingresa un valor válido.' : '';
  const diasNum = dias.trim() === '' ? undefined : Number(dias);
  const diasError = diasNum !== undefined && (!Number.isInteger(diasNum) || diasNum < 0) ? 'Ingresa un número entero de días.' : '';
  const empty = !archivo && !link.trim() && !observacion.trim();
  const invalid = empty || !!fileError || !!linkError || !!valorError || !!diasError;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid || isSubmitting) return;
    onSubmit({
      archivo,
      linkPropuesta: link.trim() || undefined,
      observacion: observacion.trim() || undefined,
      valorTotal: valorNum,
      moneda: valorNum !== undefined ? moneda.trim().toUpperCase() || undefined : undefined,
      tiempoEntregaDias: diasNum,
    });
  };

  return (
    <Form onSubmit={handleSubmit} noValidate aria-label="Formulario de cotización">
      <h2 className="h5">{alreadySent ? 'Actualizar tu cotización' : 'Enviar tu cotización'}</h2>
      {alreadySent && (
        <Alert variant="info" className="small">
          Ya enviaste una cotización. Si envías otra mientras el plazo siga abierto, la última reemplaza a la anterior.
        </Alert>
      )}
      <p className="text-muted small">Adjunta un archivo, un enlace o escribe una observación. Los valores son opcionales.</p>
      <Form.Group className="mb-3" controlId="pub-cot-archivo">
        <Form.Label>Archivo (PDF o imagen, máx. 5 MB)</Form.Label>
        <Form.Control
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          isInvalid={!!fileError}
          onChange={(e) => setArchivo((e.target as HTMLInputElement).files?.[0] ?? null)}
        />
        <Form.Control.Feedback type="invalid">{fileError}</Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3" controlId="pub-cot-link">
        <Form.Label>Enlace a la propuesta</Form.Label>
        <Form.Control type="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} isInvalid={!!linkError} />
        <Form.Control.Feedback type="invalid">{linkError}</Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3" controlId="pub-cot-observacion">
        <Form.Label>Observación</Form.Label>
        <Form.Control as="textarea" rows={3} maxLength={2000} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
      </Form.Group>
      <Row className="g-2 mb-3">
        <Col sm={5}>
          <Form.Group controlId="pub-cot-valor">
            <Form.Label>Valor total</Form.Label>
            <Form.Control type="number" min={0} step="any" value={valor} onChange={(e) => setValor(e.target.value)} isInvalid={!!valorError} />
            <Form.Control.Feedback type="invalid">{valorError}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col sm={3}>
          <Form.Group controlId="pub-cot-moneda">
            <Form.Label>Moneda</Form.Label>
            <Form.Control maxLength={3} value={moneda} onChange={(e) => setMoneda(e.target.value)} />
          </Form.Group>
        </Col>
        <Col sm={4}>
          <Form.Group controlId="pub-cot-dias">
            <Form.Label>Entrega (días)</Form.Label>
            <Form.Control type="number" min={0} step={1} value={dias} onChange={(e) => setDias(e.target.value)} isInvalid={!!diasError} />
            <Form.Control.Feedback type="invalid">{diasError}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Button type="submit" disabled={invalid || isSubmitting}>
        {isSubmitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
        {alreadySent ? 'Reenviar cotización' : 'Enviar cotización'}
      </Button>
    </Form>
  );
};

export default PublicCotizacionForm;
