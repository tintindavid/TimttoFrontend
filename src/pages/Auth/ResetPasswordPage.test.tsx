import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';
import { authService } from '@/services/auth.service';

vi.mock('@/services/auth.service', () => ({
  authService: {
    resetPassword: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const VALID_TOKEN = 'a'.repeat(64);
const TENANT = 'acme';

const renderPage = (search = `?token=${VALID_TOKEN}&tenantId=${TENANT}`) =>
  render(
    <MemoryRouter initialEntries={[`/reset-password${search}`]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  );

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza formulario cuando token y tenantId están presentes', () => {
    renderPage();
    expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar contraseña/i })).toBeInTheDocument();
  });

  it('muestra error de validación si las contraseñas no coinciden', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar/i), {
      target: { value: 'different456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/contraseñas no coinciden/i)).toBeInTheDocument();
    });
  });

  it('muestra Alert rojo cuando el backend responde TOKEN_INVALID_OR_EXPIRED', async () => {
    (authService.resetPassword as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      response: { data: { error: { code: 'TOKEN_INVALID_OR_EXPIRED' } } },
    });

    renderPage();

    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: 'NuevaPass123' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar/i), {
      target: { value: 'NuevaPass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/link expiró o ya fue usado/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /solicitar nuevo link/i })).toBeInTheDocument();
    });
  });

  it('llama a authService.resetPassword con los valores correctos en submit exitoso', async () => {
    (authService.resetPassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ success: true });

    renderPage();

    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: 'NuevaPass123' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar/i), {
      target: { value: 'NuevaPass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith(VALID_TOKEN, TENANT, 'NuevaPass123');
    });
  });
});
