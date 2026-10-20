import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach, Mock } from 'vitest';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';

const capsMock = vi.hoisted(() => ({ useTenantCapabilities: vi.fn() }));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: capsMock.useTenantCapabilities,
}));

const caps = (executesServices: boolean, organizationCustomerId: string | null = null) => ({
  executesServices,
  registersExternal: !executesServices,
  organizationCustomerId,
  isLoading: false,
  can: (c: 'executesServices' | 'registersExternal') =>
    c === 'executesServices' ? executesServices : !executesServices,
});

beforeEach(() => {
  capsMock.useTenantCapabilities.mockReturnValue(caps(true));
});

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

describe('Sidebar — tenant capabilities', () => {
  beforeEach(() => {
    (useAuth as unknown as Mock).mockReset();
    (useAuth as unknown as Mock).mockReturnValue({
      user: { role: 'admin', email: 'a@x.io' },
      isAuthenticated: true,
    });
  });

  test('provider tenant keeps the current menu', () => {
    renderSidebar();

    expect(screen.getByText('Órdenes de Trabajo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Informes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Diario' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terceros' })).toHaveAttribute('href', '/terceros');
    expect(screen.queryByRole('link', { name: 'Mi información' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Proveedores' })).not.toBeInTheDocument();
  });

  test('client tenant hides OTs, Informes and Diario and shows Mi información and Proveedores', () => {
    capsMock.useTenantCapabilities.mockReturnValue(caps(false, 'org123'));
    renderSidebar();

    expect(screen.queryByText('Órdenes de Trabajo')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Listado OTs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Informes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Diario' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Terceros' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi información' })).toHaveAttribute('href', '/terceros/org123');
    expect(screen.getByRole('link', { name: 'Proveedores' })).toHaveAttribute('href', '/terceros?tab=provider');
    // Common modules stay
    expect(screen.getByRole('link', { name: 'Cronogramas' })).toBeInTheDocument();
  });
});
