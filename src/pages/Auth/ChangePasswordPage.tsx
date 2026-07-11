import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { api } from '@/services/api';
import PasswordStrengthChecklist from '@/components/forms/PasswordStrengthChecklist';

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const schema = yup.object({
  currentPassword: yup.string().required('La contraseña actual es obligatoria'),
  newPassword: yup
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número')
    .matches(/[.*#_/+]/, 'Debe contener al menos un carácter especial (. * # _ / +)')
    .required('La nueva contraseña es obligatoria'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Las contraseñas no coinciden')
    .required('Confirma tu nueva contraseña'),
});

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: yupResolver(schema),
  });

  const newPasswordValue = watch('newPassword') ?? '';
  const confirmPasswordValue = watch('confirmPassword') ?? '';
  const passwordsMatch = newPasswordValue.length > 0 && newPasswordValue === confirmPasswordValue;

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
              <InputGroup hasValidation>
                <Form.Control
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  isInvalid={!!errors.currentPassword}
                  {...register('currentPassword')}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowCurrent((v) => !v)}
                  tabIndex={-1}
                  aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showCurrent ? <FaEyeSlash /> : <FaEye />}
                </Button>
                <Form.Control.Feedback type="invalid">
                  {errors.currentPassword?.message}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>

            {/* New password */}
            <Form.Group className="mb-1" controlId="newPassword">
              <Form.Label>Nueva contraseña</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  isInvalid={!!errors.newPassword}
                  {...register('newPassword')}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowNew((v) => !v)}
                  tabIndex={-1}
                  aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showNew ? <FaEyeSlash /> : <FaEye />}
                </Button>
                <Form.Control.Feedback type="invalid">
                  {errors.newPassword?.message}
                </Form.Control.Feedback>
              </InputGroup>
              <PasswordStrengthChecklist password={newPasswordValue} />
            </Form.Group>

            {/* Confirm new password */}
            <Form.Group className="mb-4 mt-3" controlId="confirmPassword">
              <Form.Label>Confirmar nueva contraseña</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  isInvalid={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </Button>
                <Form.Control.Feedback type="invalid">
                  {errors.confirmPassword?.message}
                </Form.Control.Feedback>
              </InputGroup>
              {confirmPasswordValue && (
                <small className={passwordsMatch ? 'text-success' : 'text-danger'}>
                  {passwordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                </small>
              )}
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={isSubmitting || !passwordsMatch}
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
