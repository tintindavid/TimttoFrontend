import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Alert, Button, Card, Col, Container, Row, Spinner, Table } from 'react-bootstrap';
import { useEnviarCotizacionPublica, useGetPublicRequisicion, useResponderInvitacion } from '@/hooks/usePublicRequisicion';
import { LICITACION_ERROR_MESSAGES, type RegistrarCotizacionDto } from '@/types/licitacion.types';
import PublicCotizacionForm from './PublicCotizacionForm';
import PublicOrdenCompra from './PublicOrdenCompra';

interface ApiErrorLike {
  response?: { status?: number; data?: { error?: { code?: string } } };
}

const COURTESY = {
  invalid: 'Este enlace no es válido. Verifica que lo copiaste completo o solicita uno nuevo a quien te invitó.',
  expired: 'Este enlace ya no está disponible. Gracias por tu interés.',
  closed: 'El plazo para cotizar ya terminó. Gracias por tu interés.',
  busy: 'Hay demasiados intentos en este momento. Espera unos minutos e inténtalo de nuevo.',
} as const;

/** Short courtesy message for a load error; deliberately shows no requisition data. */
const loadErrorMessage = (err: unknown): string => {
  const { status, data } = (err as ApiErrorLike)?.response ?? {};
  const code = data?.error?.code;
  if (status === 429) return COURTESY.busy;
  if (code === 'FECHA_LIMITE_VENCIDA') return COURTESY.closed;
  if (status === 403 || code === 'TOKEN_EXPIRADO') return COURTESY.expired;
  return COURTESY.invalid;
};

/** Error of a submit: known code, else a generic text. Never echoes server details. */
const submitErrorMessage = (err: unknown): string => {
  const { status, data } = (err as ApiErrorLike)?.response ?? {};
  const code = data?.error?.code;
  if (status === 429) return COURTESY.busy;
  if (code && LICITACION_ERROR_MESSAGES[code]) return LICITACION_ERROR_MESSAGES[code];
  if (status === 409) return 'Ya no es posible registrar esta respuesta.';
  return 'No fue posible enviar tu respuesta. Inténtalo de nuevo.';
};

const formatDeadline = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return '';
  }
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Container className="py-4">
    <Row className="justify-content-center">
      <Col lg={9}>{children}</Col>
    </Row>
  </Container>
);

const Courtesy: React.FC<{ message: string }> = ({ message }) => (
  <Shell>
    <Alert variant="secondary" role="status" className="text-center py-4 mb-0">
      {message}
    </Alert>
  </Shell>
);

/**
 * Public supplier portal (`/public/requisicion/:token`). No menus, no tenant logo and no authenticated calls:
 * everything goes through the token-only public service. The token is never logged nor stored.
 */
const PublicRequisicionPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const { data, isLoading, error } = useGetPublicRequisicion(token);
  const responder = useResponderInvitacion(token);
  const enviar = useEnviarCotizacionPublica(token);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'danger'; text: string } | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [declined, setDeclined] = useState(false);

  // Keep the token out of the Referer header of any outgoing request made from this page.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'no-referrer';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // After declining the link stops working (the refetch answers 403), so the thank-you is kept locally.
  if (declined) return <Courtesy message="Gracias por avisarnos. Registramos que no participarás en esta cotización." />;

  if (isLoading) {
    return (
      <Shell>
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" aria-label="Cargando" />
        </div>
      </Shell>
    );
  }

  if (error) return <Courtesy message={loadErrorMessage(error)} />;

  const requisicion = data?.data;
  if (!requisicion) return <Courtesy message={COURTESY.invalid} />;
  // The winner sees the purchase order (with its PDF and deliverables) once it was sent.
  if (requisicion.estadoEnvio === 'Ganador' && requisicion.ordenCompra) {
    return (
      <Shell>
        <PublicOrdenCompra
          token={token}
          tenantNombre={requisicion.tenantNombre}
          consecutivo={requisicion.consecutivo}
          titulo={requisicion.titulo}
          orden={requisicion.ordenCompra}
        />
      </Shell>
    );
  }
  if (requisicion.estadoEnvio === 'Ganador') {
    return <Courtesy message="¡Felicitaciones! Tu propuesta fue seleccionada. El equipo de compras se pondrá en contacto contigo." />;
  }
  if (requisicion.estadoEnvio === 'Descartado') return <Courtesy message="Gracias por participar. En esta ocasión se eligió otra propuesta." />;
  if (requisicion.cerrada) return <Courtesy message={COURTESY.closed} />;

  const handleResponder = async (aceptar: boolean) => {
    setFeedback(null);
    setShowDecline(false);
    try {
      await responder.mutateAsync(aceptar);
      if (!aceptar) {
        setDeclined(true);
        return;
      }
      setFeedback({ variant: 'success', text: 'Gracias. Confirmaste tu participación; ya puedes enviar tu cotización.' });
    } catch (err) {
      setFeedback({ variant: 'danger', text: submitErrorMessage(err) });
    }
  };

  const handleCotizacion = async (values: RegistrarCotizacionDto) => {
    setFeedback(null);
    try {
      await enviar.mutateAsync(values);
      setFeedback({ variant: 'success', text: 'Tu cotización fue enviada. Gracias.' });
    } catch (err) {
      setFeedback({ variant: 'danger', text: submitErrorMessage(err) });
    }
  };

  const { estadoEnvio } = requisicion;
  const pendingAnswer = estadoEnvio === 'Pendiente' || estadoEnvio === 'Enviado';
  const rechazado = estadoEnvio === 'Rechazado';
  const canQuote = estadoEnvio === 'Aceptado';

  return (
    <Shell>
      <Card className="mb-3">
        <Card.Body>
          <div className="text-muted small">Invitación a cotizar de {requisicion.tenantNombre}</div>
          <h1 className="h4 mt-1">
            {requisicion.consecutivo} · {requisicion.titulo}
          </h1>
          {requisicion.instrucciones && (
            <div className="mb-3">
              <h2 className="h6">Instrucciones para los proveedores</h2>
              <p className="mb-0">{requisicion.instrucciones}</p>
            </div>
          )}
          <p className="mb-3">
            <strong>Fecha límite para cotizar:</strong> {formatDeadline(requisicion.fechaLimiteCotizacion)}
          </p>
          <div className="table-responsive">
            <Table size="sm" className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th className="text-end">Cantidad</th>
                  <th>Unidad</th>
                  <th>Especificación</th>
                </tr>
              </thead>
              <tbody>
                {requisicion.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.descripcion}</td>
                    <td className="text-end">{item.cantidad}</td>
                    <td>{item.unidad}</td>
                    <td>{item.especificacion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {feedback && (
        <Alert variant={feedback.variant} role="status">
          {feedback.text}
        </Alert>
      )}

      {pendingAnswer && (
        <Card>
          <Card.Body>
            <h2 className="h5">¿Participarás en esta cotización?</h2>
            <div className="d-flex flex-wrap gap-2">
              <Button variant="success" onClick={() => handleResponder(true)} disabled={responder.isLoading}>
                Aceptar participar
              </Button>
              <Button variant="outline-danger" onClick={() => setShowDecline(true)} disabled={responder.isLoading}>
                No participar
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      <ConfirmModal
        show={showDecline}
        title="No participar"
        body="Si no participas, no podrás cotizar después con este enlace. ¿Confirmas que no participarás?"
        confirmLabel="Sí, no participar"
        onConfirm={() => handleResponder(false)}
        onCancel={() => setShowDecline(false)}
      />

      {rechazado && <Alert variant="secondary">Indicaste que no participarás en esta cotización.</Alert>}

      {canQuote && (
        <Card>
          <Card.Body>
            <PublicCotizacionForm isSubmitting={enviar.isLoading} alreadySent={!!requisicion.cotizacion} onSubmit={handleCotizacion} />
          </Card.Body>
        </Card>
      )}
    </Shell>
  );
};

export default PublicRequisicionPage;
