import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach, Mock } from 'vitest';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const renderSidebar = () =>
  render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>
  );

describe('Sidebar — admin-only rollout gate for Tickets and QR de Servicios', () => {
  beforeEach(() => {
    (useAuth as unknown as Mock).mockReset();
  });

  test('admin sees both Tickets and QR de Servicios entries', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      user: { role: 'admin', email: 'a@x.io' },
      isAuthenticated: true,
    });

    renderSidebar();

    expect(screen.getByRole('link', { name: 'Tickets' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'QR de Servicios' })).toBeInTheDocument();
  });

  test('technician does NOT see Tickets or QR de Servicios entries', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      user: { role: 'technician', email: 't@x.io' },
      isAuthenticated: true,
    });

    renderSidebar();

    expect(screen.queryByRole('link', { name: 'Tickets' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'QR de Servicios' })).not.toBeInTheDocument();
  });

  test('user role does NOT see Tickets or QR de Servicios entries', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      user: { role: 'user', email: 'u@x.io' },
      isAuthenticated: true,
    });

    renderSidebar();

    expect(screen.queryByRole('link', { name: 'Tickets' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'QR de Servicios' })).not.toBeInTheDocument();
  });
});
