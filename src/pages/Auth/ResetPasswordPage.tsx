import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Container, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { authService } from '@/services/auth.service';

interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

const schema = yup.object({
  newPassword: yup
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .required('La contraseña es obligatoria'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Las contraseñas no coinciden')
    .required('Confirma tu nueva contraseña'),
});

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tokenExpired, setTokenExpired] = useState(false);

  const token = searchParams.get('token');
  const tenantId = searchParams.get('tenantId');

  useEffect(() => {
    if (!token || !tenantId) {
      navigate('/forgot-password', { replace: true });
    }
  }, [token, tenantId, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await authService.resetPassword(token!, tenantId!, values.newPassword);
      toast.success('Contraseña actualizada. Inicia sesión.');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const code = (
        err as { response?: { data?: { error?: { code?: string } } } }
      )?.response?.data?.error?.code;
      if (code === 'TOKEN_INVALID_OR_EXPIRED') {
        setTokenExpired(true);
      } else {
        toast.error('Error al restablecer la contraseña. Intenta nuevamente.');
      }
    }
  };

  if (tokenExpired) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '80vh' }}
      >
        <Card style={{ width: '100%', maxWidth: 440 }} className="shadow-sm">
          <Card.Body className="p-4">
            <Alert variant="danger">
              El link expiró o ya fue usado. Solicita uno nuevo.
            </Alert>
            <Link to="/forgot-password" className="btn btn-primary w-100">
              Solicitar nuevo link
            </Link>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '80vh' }}
    >
      <Card style={{ width: '100%', maxWidth: 440 }} className="shadow-sm">
        <Card.Body className="p-4">
          <h4 className="mb-4">Nueva contraseña</h4>

          <Form noValidate onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3" controlId="newPassword">
              <Form.Label>Nueva contraseña</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                isInvalid={!!errors.newPassword}
                {...register('newPassword')}
              />
              <Form.Control.Feedback type="invalid">
                {errors.newPassword?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="confirmPassword">
              <Form.Label>Confirmar contraseña</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                isInvalid={!!errors.confirmPassword}
                {...register('confirmPassword')}
              />
              <Form.Control.Feedback type="invalid">
                {errors.confirmPassword?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Guardando…
                </>
              ) : (
                'Guardar contraseña'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResetPasswordPage;
