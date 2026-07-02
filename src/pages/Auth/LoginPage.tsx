import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/forms/LoginForm/LoginForm';

export const LoginPage: React.FC = () => {
  const { login, setTenantId } = useAuth();
  const navigate = useNavigate();

  const [tenantId, setLocalTenantId] = useState<string>(localStorage.getItem('tenantId') || '');

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      if (tenantId) setTenantId(tenantId);
      const result = await login(data.email, data.password, tenantId || undefined);
      // If the user must change their temporary password, redirect before anything else
      if (result?.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } catch (e: unknown) {
      console.error('Login error', (e as { response?: { data?: unknown } })?.response?.data || e);
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al iniciar sesión';
      alert(message);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
      <div style={{ width: 400 }}>
        <h3 className="mb-3">Iniciar sesión</h3>
        <div className="mb-3">
          <label>Tenant ID</label>
          <input
            name="tenantId"
            className="form-control"
            value={tenantId}
            onChange={(e) => setLocalTenantId(e.target.value)}
          />
        </div>
        <LoginForm onSubmit={onSubmit} />
      </div>
    </Container>
  );
};

export default LoginPage;
