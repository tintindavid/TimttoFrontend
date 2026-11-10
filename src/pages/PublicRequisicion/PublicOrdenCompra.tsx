import React, { useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Spinner, Table } from 'react-bootstrap';
import { useDescargarOrdenCompraPublica, useSubirEntregablesPublicos } from '@/hooks/usePublicRequisicion';
import type { PublicOrdenCompra as PublicOrdenCompraData } from '@/services/publicRequisicion.service';
import { LICITACION_ERROR_MESSAGES } from '@/types/licitacion.types';
import {
  ENTREGA_ESTADO_LABELS,
  ENTREGA_ESTADO_VARIANT,
  ENTREGABLE_ACCEPT,
  ENTREGABLE_MAX_BYTES,
  ENTREGABLE_MAX_FILES,
  ENTREGABLE_TIPOS_MENSAJE,
  ENTREGABLE_TIPOS_PERMITIDOS,
  ORDEN_COMPRA_ERROR_MESSAGES,
} from '@/types/ordenCompra.types';
import { formatDateUtc, formatMoney, isSafeHttpsUrl } from '@/utils/requisicion.utils';
import { saveBlob } from '@/utils/saveBlob';

interface Props {
  token: string;
  tenantNombre: string;
  consecutivo: string;
  titulo: string;
  orden: PublicOrdenCompraData;
}

interface ApiErrorLike {
  response?: { status?: number; data?: { error?: { code?: string } } };
}

/** Message of a failed action; known codes only, never the server details. */
const errorMessage = (err: unknown, fallback: string): string => {
  const { status, data } = (err as ApiErrorLike)?.response ?? {};
  const code = data?.error?.code;
  if (status === 429) return 'Hay demasiados intentos en este momento. Espera unos minutos e inténtalo de nuevo.';
  if (code && ORDEN_COMPRA_ERROR_MESSAGES[code]) return ORDEN_COMPRA_ERROR_MESSAGES[code];
  if (code && LICITACION_ERROR_MESSAGES[code]) return LICITACION_ERROR_MESSAGES[code];
  return fallback;
};

const filesError = (files: File[]): string => {
  if (files.length > ENTREGABLE_MAX_FILES) return `Máximo ${ENTREGABLE_MAX_FILES} archivos por envío.`;
  if (files.some((f) => !ENTREGABLE_TIPOS_PERMITIDOS.includes(f.type))) return ENTREGABLE_TIPOS_MENSAJE;
  if (files.some((f) => f.size > ENTREGABLE_MAX_BYTES)) return 'Cada archivo debe pesar máximo 5 MB.';
  return '';
};

/** Purchase order of the winning supplier: the order, its PDF, the supports uploaded and the last return note. */
const PublicOrdenCompra: React.FC<Props> = ({ token, tenantNombre, consecutivo, titulo, orden }) => {
  const descargar = useDescargarOrdenCompraPublica(token);
  const subir = useSubirEntregablesPublicos(token);
  const [files, setFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'danger'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const entrega = orden.entrega;
  const estadoEntrega = entrega?.estado ?? 'Pendiente';
  const archivos = entrega?.archivos ?? [];
  const canUpload = orden.requiereEntregables && ['Pendiente', 'Recibidos', 'Devolucion'].includes(estadoEntrega);
  const fileError = filesError(files);

  const handlePdf = async () => {
    setFeedback(null);
    try {
      const blob = await descargar.mutateAsync();
      saveBlob(blob, `${orden.numero}.pdf`);
    } catch (err) {
      setFeedback({ variant: 'danger', text: errorMessage(err, 'No fue posible descargar la orden de compra.') });
    }
  };

  const handleSubir = async (event: React.FormEvent) => {
    event.preventDefault();
    if (files.length === 0 || fileError || subir.isLoading) return;
    setFeedback(null);
    try {
      await subir.mutateAsync(files);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
      setFeedback({ variant: 'success', text: 'Recibimos tus soportes. Gracias.' });
    } catch (err) {
      setFeedback({ variant: 'danger', text: errorMessage(err, 'No fue posible enviar tus soportes. Inténtalo de nuevo.') });
    }
  };

  return (
    <>
      <Card className="mb-3" data-testid="public-orden-compra">
        <Card.Body>
          <div className="text-muted small">Orden de compra de {tenantNombre}</div>
          <h1 className="h4 mt-1">
            {orden.numero} <small className="text-muted">· versión {orden.version}</small>
          </h1>
          <p className="text-muted">
            {consecutivo} · {titulo}
          </p>
          <div className="table-responsive">
            <Table size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th className="text-end">Cantidad</th>
                  <th className="text-end">Precio unitario</th>
                  <th className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orden.lineas.map((l, index) => (
                  <tr key={index}>
                    <td>{l.descripcion}</td>
                    <td className="text-end">{l.cantidad}</td>
                    <td className="text-end">{formatMoney(l.precioUnitario, orden.moneda)}</td>
                    <td className="text-end">{formatMoney(l.subtotal, orden.moneda)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={3} className="text-end">
                    Total
                  </th>
                  <th className="text-end">{formatMoney(orden.total, orden.moneda)}</th>
                </tr>
              </tfoot>
            </Table>
          </div>
          <p className="mb-1">
            <strong>Fecha de entrega:</strong> {formatDateUtc(orden.fechaEntrega)}
          </p>
          {orden.condiciones && (
            <p className="mb-3">
              <strong>Condiciones:</strong> {orden.condiciones}
            </p>
          )}
          <Button variant="outline-primary" onClick={handlePdf} disabled={descargar.isLoading}>
            {descargar.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Descargar PDF
          </Button>
        </Card.Body>
      </Card>

      {feedback && (
        <Alert variant={feedback.variant} role="status">
          {feedback.text}
        </Alert>
      )}

      {orden.requiereEntregables && (
        <Card>
          <Card.Body>
            <h2 className="h5">
              Entregables{' '}
              <Badge bg={ENTREGA_ESTADO_VARIANT[estadoEntrega] ?? 'secondary'}>{ENTREGA_ESTADO_LABELS[estadoEntrega] ?? estadoEntrega}</Badge>
            </h2>
            {estadoEntrega === 'Devolucion' && entrega?.ultimaObservacion && (
              <Alert variant="danger" data-testid="public-oc-observacion">
                <strong>Observación de la devolución:</strong> {entrega.ultimaObservacion}
              </Alert>
            )}
            {estadoEntrega === 'Aceptados' && <Alert variant="success">Tus entregables fueron aceptados. Gracias.</Alert>}
            {estadoEntrega === 'En_Revision' && <Alert variant="info">Estamos revisando tus soportes.</Alert>}
            {archivos.length > 0 && (
              <ul className="small">
                {archivos.map((a, index) => (
                  <li key={`${a.url}-${index}`}>
                    {isSafeHttpsUrl(a.url) ? (
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        {a.nombre || 'Archivo'}
                      </a>
                    ) : (
                      a.nombre || 'Archivo'
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canUpload && (
              <Form onSubmit={handleSubir} noValidate aria-label="Formulario de soportes">
                <Form.Group className="mb-3" controlId="pub-oc-archivos">
                  <Form.Label>
                    {estadoEntrega === 'Devolucion' ? 'Volver a enviar tus soportes' : 'Subir soportes'} (PDF o imágenes JPG, PNG, WEBP; máx. 5 MB cada uno)
                  </Form.Label>
                  <Form.Control
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ENTREGABLE_ACCEPT}
                    isInvalid={!!fileError}
                    onChange={(e) => setFiles(Array.from((e.target as HTMLInputElement).files ?? []))}
                  />
                  <Form.Control.Feedback type="invalid">{fileError}</Form.Control.Feedback>
                </Form.Group>
                <Button type="submit" disabled={files.length === 0 || !!fileError || subir.isLoading}>
                  {subir.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
                  Enviar soportes
                </Button>
              </Form>
            )}
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default PublicOrdenCompra;
