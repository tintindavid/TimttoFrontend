import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/forms/LoginForm/LoginForm';
import logoExtended from '@/img/logo-extended.png';

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
      {/* brand-logos-wiring v2: wrap the form in a white card so the
          logo's own white backdrop blends with the surface instead of
          floating on the page's grey tone (--tt-bg). Standard login-card
          look — focuses the eye on the form and keeps the brand mark
          clean. */}
      <div
        style={{
          width: 400,
          background: '#fff',
          padding: '32px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* brand-logos-wiring (design D7): extended logo centered above
            the form. 280px matches the navbar's rail (260px) at close
            visual weight; `maxWidth: 100%` prevents overflow on narrow
            phones. */}
        <div className="text-center mb-4">
          <img
            src={logoExtended}
            alt="Timtto"
            style={{ width: '280px', maxWidth: '100%', height: 'auto' }}
          />
        </div>
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
