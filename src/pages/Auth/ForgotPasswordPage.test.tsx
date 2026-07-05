import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';
import { authService } from '@/services/auth.service';

vi.mock('@/services/auth.service', () => ({
  authService: {
    forgotPassword: vi.fn(),
  },
}));

const renderPage = (initialEntries = ['/forgot-password']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renderiza el formulario con campo email y tenantId', () => {
    renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tenant/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar link/i })).toBeInTheDocument();
  });

  it('muestra mensaje de confirmación tras submit exitoso', async () => {
    (authService.forgotPassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ success: true });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@acme.com' } });
    fireEvent.change(screen.getByLabelText(/tenant/i), { target: { value: 'acme' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    await waitFor(() => {
      expect(screen.getByText(/Si el email está registrado/i)).toBeInTheDocument();
    });
  });

  it('muestra mensaje de confirmación incluso si el servicio lanza error (anti-enumeration)', async () => {
    (authService.forgotPassword as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error'),
    );

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@acme.com' } });
    fireEvent.change(screen.getByLabelText(/tenant/i), { target: { value: 'acme' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    await waitFor(() => {
      expect(screen.getByText(/Si el email está registrado/i)).toBeInTheDocument();
    });
  });

  it('muestra error de validación si el email tiene formato inválido', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'no-es-email' } });
    fireEvent.change(screen.getByLabelText(/tenant/i), { target: { value: 'acme' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    await waitFor(() => {
      expect(screen.getByText(/email no es válido/i)).toBeInTheDocument();
    });
  });

  it('pre-pobla tenantId desde localStorage', () => {
    localStorage.setItem('tenantId', 'pre-loaded-tenant');
    renderPage();
    const input = screen.getByLabelText(/tenant/i) as HTMLInputElement;
    expect(input.value).toBe('pre-loaded-tenant');
  });
});
