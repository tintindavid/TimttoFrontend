import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Container, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { authService } from '@/services/auth.service';

interface ForgotPasswordFormValues {
  email: string;
  tenantId: string;
}

const schema = yup.object({
  email: yup
    .string()
    .email('El email no es válido')
    .required('El email es obligatorio'),
  tenantId: yup.string().required('El Tenant ID es obligatorio'),
});

const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const location = useLocation();
  const state = location.state as { tenantId?: string } | null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      tenantId: state?.tenantId || localStorage.getItem('tenantId') || '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await authService.forgotPassword(values.email, values.tenantId);
    } catch {
      // Intencional: nunca revelar si el email existe o no
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '80vh' }}
      >
        <Card style={{ width: '100%', maxWidth: 440 }} className="shadow-sm">
          <Card.Body className="p-4">
            <Alert variant="success">
              Si el email está registrado, recibirás un link de recuperación en los próximos minutos.
            </Alert>
            <Link to="/login" className="btn btn-outline-secondary w-100">
              ← Volver al login
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
          <h4 className="mb-1">Recuperar contraseña</h4>
          <p className="text-muted mb-4 small">
            Ingresa tu email y recibirás un link para restablecer tu contraseña.
          </p>

          <Form noValidate onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                autoComplete="email"
                isInvalid={!!errors.email}
                {...register('email')}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="tenantId">
              <Form.Label>Tenant ID</Form.Label>
              <Form.Control
                type="text"
                isInvalid={!!errors.tenantId}
                {...register('tenantId')}
              />
              <Form.Control.Feedback type="invalid">
                {errors.tenantId?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100 mb-3"
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
                  Enviando…
                </>
              ) : (
                'Enviar link de recuperación'
              )}
            </Button>

            <Link to="/login" className="btn btn-outline-secondary w-100">
              ← Volver al login
            </Link>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPasswordPage;
