import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { api } from '@/services/api';

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const schema = yup.object({
  currentPassword: yup.string().required('La contraseña actual es obligatoria'),
  newPassword: yup
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .required('La nueva contraseña es obligatoria'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Las contraseñas no coinciden')
    .required('Confirma tu nueva contraseña'),
});

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      // If the backend issues a refreshed token, update localStorage
      const newToken: string | undefined = response.data?.data?.token;
      if (newToken) {
        localStorage.setItem('token', newToken);
      }
      toast.success('Contraseña actualizada correctamente');
      navigate('/');
    } catch (err: unknown) {
      // reason: axios error shape is not known at compile time
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al cambiar la contraseña. Verifica tu contraseña actual.';
      toast.error(message);
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '80vh' }}
    >
      <Card style={{ width: '100%', maxWidth: 440 }} className="shadow-sm">
        <Card.Body className="p-4">
          <h4 className="mb-1">Cambiar contraseña</h4>

          <Alert variant="warning" className="mb-4" role="status">
            <strong>Debes cambiar tu contraseña temporal</strong> antes de continuar usando la
            plataforma.
          </Alert>

          <Form noValidate onSubmit={handleSubmit(onSubmit)}>
            {/* Current password */}
            <Form.Group className="mb-3" controlId="currentPassword">
              <Form.Label>Contraseña actual</Form.Label>
              <Form.Control
                type="password"
                autoComplete="current-password"
                isInvalid={!!errors.currentPassword}
                {...register('currentPassword')}
              />
              <Form.Control.Feedback type="invalid">
                {errors.currentPassword?.message}
              </Form.Control.Feedback>
            </Form.Group>

            {/* New password */}
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

            {/* Confirm new password */}
            <Form.Group className="mb-4" controlId="confirmPassword">
              <Form.Label>Confirmar nueva contraseña</Form.Label>
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
              aria-label="Guardar nueva contraseña"
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

export default ChangePasswordPage;
