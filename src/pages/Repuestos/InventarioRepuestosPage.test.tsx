import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InventarioRepuestosPage from './InventarioRepuestosPage';

vi.mock('@/hooks/useInventarioRepuestos', () => ({
  useInventarioList: () => ({ data: { data: [] } }),
  useCreateInventarioRepuesto: () => ({ mutateAsync: vi.fn() }),
  useUpdateInventarioRepuesto: () => ({ mutateAsync: vi.fn() }),
  useDeleteInventarioRepuesto: () => ({ mutateAsync: vi.fn() }),
}));

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <InventarioRepuestosPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('InventarioRepuestosPage', () => {
  it('shows access warning when tenant plan does not include inventario', () => {
    localStorage.setItem('tenantPlan', 'free');

    renderPage();

    expect(screen.getByText(/no incluye la funcionalidad de inventario/i)).toBeInTheDocument();
  });

  it('renders inventory title when plan includes inventario', () => {
    localStorage.setItem('tenantPlan', 'premium-inventario');

    renderPage();

    expect(screen.getByText('Inventario de repuestos')).toBeInTheDocument();
  });
});
