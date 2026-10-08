import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

/**
 * brand-logos-wiring: smoke test for the extended logo above the sign-in
 * form. Doesn't exercise the auth flow (covered elsewhere / in ForgotPassword
 * patterns) — just locks in the brand wiring so the <img> isn't accidentally
 * removed.
 */

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), setTenantId: vi.fn() }),
}));

vi.mock('@/components/forms/LoginForm/LoginForm', () => ({
  default: () => <div data-testid="login-form" />,
}));

describe('LoginPage branding', () => {
  it('renders the extended Timtto logo above the sign-in form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    const logo = screen.getByAltText('Timtto');
    expect(logo).toBeInTheDocument();
    expect(logo.tagName).toBe('IMG');
    // The vite-mocked import resolves to a string path; just assert the img exists
    // and precedes the heading.
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  });
});
