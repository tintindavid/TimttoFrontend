import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  useTenantCapabilities: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: mocks.useTenantCapabilities,
}));
vi.mock('react-toastify', () => ({ toast: { info: mocks.toastInfo } }));

import RequireCapability from './RequireCapability';

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={['/maintenance-orders']}>
      <Routes>
        <Route path="/" element={<div>Inicio</div>} />
        <Route
          path="/maintenance-orders"
          element={
            <RequireCapability capability="executesServices">
              <div>Listado OTs</div>
            </RequireCapability>
          }
        />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  mocks.toastInfo.mockReset();
});

describe('RequireCapability', () => {
  it('renders children when the capability is enabled', () => {
    mocks.useTenantCapabilities.mockReturnValue({ can: () => true, isLoading: false });
    renderAt();
    expect(screen.getByText('Listado OTs')).toBeTruthy();
    expect(mocks.toastInfo).not.toHaveBeenCalled();
  });

  it('renders children while loading (defaults to enabled)', () => {
    mocks.useTenantCapabilities.mockReturnValue({ can: () => false, isLoading: true });
    renderAt();
    expect(screen.getByText('Listado OTs')).toBeTruthy();
  });

  it('redirects home with a Spanish notice when the capability is disabled', () => {
    mocks.useTenantCapabilities.mockReturnValue({ can: () => false, isLoading: false });
    renderAt();
    expect(screen.getByText('Inicio')).toBeTruthy();
    expect(screen.queryByText('Listado OTs')).toBeNull();
    expect(mocks.toastInfo).toHaveBeenCalledWith(
      'Este módulo no está disponible para tu organización.',
      expect.anything()
    );
  });
});
