import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap';

interface Props {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  forgotPasswordHref?: string;
}

export const LoginForm: React.FC<Props> = ({ onSubmit, forgotPasswordHref = '/forgot-password' }) => {
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" {...register('email')} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Contraseña</Form.Label>
        <Form.Control type="password" {...register('password')} />
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
