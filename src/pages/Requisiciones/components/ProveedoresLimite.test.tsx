/** Regresión: el catálogo de terceros acepta como máximo 100 filas por página (limit > 100 responde 400). */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsignarProveedorModal from './AsignarProveedorModal';
import CompraDirectaModal from './CompraDirectaModal';
import type { Requisicion } from '@/types/requisicion.types';

const useCustomers = vi.fn(() => ({ data: { data: [] }, isLoading: false, isError: false }));
vi.mock('@/hooks/useCustomers', () => ({ useCustomers: (...args: unknown[]) => (useCustomers as unknown as (...a: unknown[]) => unknown)(...args) }));
vi.mock('@/components/customers/CrearProveedorModal', () => ({ default: () => null }));
vi.mock('@/hooks/useLicitacion', () => ({
  useAsignarProveedor: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCompraDirecta: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

describe('selector de proveedores', () => {
  beforeEach(() => useCustomers.mockClear());

  it('asignar proveedor pide como máximo 100 terceros de tipo proveedor', () => {
    wrap(<AsignarProveedorModal show onHide={() => {}} requisicionId="r1" assignedIds={[]} />);
    const params = (useCustomers.mock.calls[0] as unknown[])[0] as { kind: string; limit: number };
    expect(params.kind).toBe('provider');
    expect(params.limit).toBeLessThanOrEqual(100);
  });

  it('compra directa pide como máximo 100 terceros de tipo proveedor', () => {
    wrap(<CompraDirectaModal show onHide={() => {}} requisicion={{ _id: 'r1', licitacion: { proveedores: [] } } as unknown as Requisicion} />);
    const params = (useCustomers.mock.calls[0] as unknown[])[0] as { kind: string; limit: number };
    expect(params.kind).toBe('provider');
    expect(params.limit).toBeLessThanOrEqual(100);
  });
});
