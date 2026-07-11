import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import { FaLock } from 'react-icons/fa';
import { useValidateAccess } from '@/hooks/usePublicTicket';
import { publicSessionStorage } from '@/services/publicTicket.service';

const PublicTicketLoginPage: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const validateMutation = useValidateAccess();

  // If a sessionToken already exists, go straight to dashboard.
  React.useEffect(() => {
    if (publicSessionStorage.getToken()) {
      navigate(`/public/ticket/${qrToken}/dashboard`, { replace: true });
    }
  }, [navigate, qrToken]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    if (!qrToken) {
      setError('Token de QR no proporcionado en la URL.');
      return;
    }
    if (!password) {
      setError('Ingrese la contraseña del QR.');
      return;
    }
    try {
      await validateMutation.mutateAsync({ qrToken, password });
      navigate(`/public/ticket/${qrToken}/dashboard`, { replace: true });
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      const message =
        status === 429
          ? 'Demasiados intentos. Intente de nuevo en unos minutos.'
          : status === 401
          ? 'Contraseña incorrecta.'
          : (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            'No fue posible validar el acceso.';
      setError(message);
    }
  };

  return (
    <div className="d-flex justify-content-center">
      <Card style={{ maxWidth: 420, width: '100%' }}>
        <Card.Body className="p-4">
          <div className="text-center mb-3">
            <FaLock size={36} className="text-primary mb-2" />
            <h5 className="m-0">Acceso al formulario</h5>
            <div className="small text-muted">
              Ingrese la contraseña del QR del servicio.
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="publicQrPassword">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </Form.Group>
            <div className="d-grid">
              <Button
                type="submit"
                variant="primary"
                disabled={validateMutation.isLoading}
              >
                {validateMutation.isLoading ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Validando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PublicTicketLoginPage;
