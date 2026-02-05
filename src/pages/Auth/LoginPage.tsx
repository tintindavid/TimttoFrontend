import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/forms/LoginForm/LoginForm';

export const LoginPage: React.FC = () => {
  const { login, setTenantId } = useAuth();
  const navigate = useNavigate();

  const [tenantId, setLocalTenantId] = useState<string>(localStorage.getItem('tenantId') || '');

  const onSubmit = async (data: any) => {
    try {
      if (tenantId) setTenantId(tenantId);
      await login(data.email, data.password, tenantId || undefined);
      navigate('/');
    } catch (e: any) {
      console.error('Login error', e?.response?.data || e);
      const message = e?.response?.data?.message || 'Error al iniciar sesión';
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
