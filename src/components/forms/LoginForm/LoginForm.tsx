import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface Props {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  forgotPasswordHref?: string;
}

export const LoginForm: React.FC<Props> = ({ onSubmit, forgotPasswordHref = '/forgot-password' }) => {
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" {...register('email')} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Contraseña</Form.Label>
        <InputGroup>
          <Form.Control type={showPassword ? 'text' : 'password'} {...register('password')} />
          <Button
            variant="outline-secondary"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </Button>
        </InputGroup>
      </Form.Group>

      <div className="d-flex gap-2">
        <Button type="submit" variant="primary">Entrar</Button>
      </div>

      <div className="text-end mt-2">
        <Link to={forgotPasswordHref} className="text-decoration-none small">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </Form>
  );
};

export default LoginForm;
