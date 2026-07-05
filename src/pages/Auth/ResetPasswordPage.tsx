import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Container, Card, Form, Button, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { authService } from '@/services/auth.service';
import PasswordStrengthChecklist from '@/components/forms/PasswordStrengthChecklist';

interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

const schema = yup.object({
  newPassword: yup
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número')
    .matches(/[.*#_/+]/, 'Debe contener al menos un carácter especial (. * # _ / +)')
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
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const token = searchParams.get('token');
  const tenantId = searchParams.get('tenantId');

  useEffect(() => {
    if (!token || !tenantId) {
      navigate('/forgot-password', { replace: true });
      return;
    }
    authService.validateResetToken(token, tenantId).catch((err: unknown) => {
      const code = (err as { response?: { data?: { error?: { code?: string } } } })
        ?.response?.data?.error?.code;
      if (code === 'TOKEN_INVALID_OR_EXPIRED') {
        setTokenExpired(true);
      }
      // Otros errores (red, 500, backend no disponible) → ignorar silenciosamente;
      // el submit revelará el error real si el token está efectivamente inválido.
    });
  }, [token, tenantId, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: yupResolver(schema),
  });

  const newPasswordValue = watch('newPassword') ?? '';
  const confirmPasswordValue = watch('confirmPassword') ?? '';
  const passwordsMatch = newPasswordValue.length > 0 && newPasswordValue === confirmPasswordValue;

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

            <Form.Group className="mb-4 mt-3" controlId="confirmPassword">
              <Form.Label>Confirmar contraseña</Form.Label>
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
