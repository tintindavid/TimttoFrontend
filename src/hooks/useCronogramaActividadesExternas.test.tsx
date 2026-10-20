import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCronogramaActividadesExternas } from './useCronogramaActividadesExternas';

const getActividadesExternas = vi.fn();
vi.mock('@/services/cronograma.service', () => ({
  getActividadesExternas: (...args: unknown[]) => getActividadesExternas(...args),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  getActividadesExternas.mockReset();
  getActividadesExternas.mockImplementation(async (params: { anio?: number }) => ({ success: true, data: [], truncated: false, anio: params.anio }));
});

describe('useCronogramaActividadesExternas', () => {
  it('refetches when the year changes (the year is part of the cache key)', async () => {
    const { result, rerender } = renderHook(
      ({ anio }) => useCronogramaActividadesExternas({ clienteId: 'c1', anio }),
      { wrapper, initialProps: { anio: 2026 } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getActividadesExternas).toHaveBeenCalledTimes(1);
    expect(getActividadesExternas).toHaveBeenLastCalledWith({ clienteId: 'c1', anio: 2026 });

    rerender({ anio: 2025 });
    await waitFor(() => expect(getActividadesExternas).toHaveBeenCalledTimes(2));
    expect(getActividadesExternas).toHaveBeenLastCalledWith({ clienteId: 'c1', anio: 2025 });
    await waitFor(() => expect((result.current.data as unknown as { anio: number }).anio).toBe(2025));
  });

  it('refetches when the client changes', async () => {
    const { rerender } = renderHook(
      ({ clienteId }) => useCronogramaActividadesExternas({ clienteId, anio: 2026 }),
      { wrapper, initialProps: { clienteId: 'c1' } },
    );
    await waitFor(() => expect(getActividadesExternas).toHaveBeenCalledTimes(1));
    rerender({ clienteId: 'c2' });
    await waitFor(() => expect(getActividadesExternas).toHaveBeenCalledTimes(2));
  });

  it('does not fetch while disabled', () => {
    renderHook(() => useCronogramaActividadesExternas({ clienteId: '', anio: 2026 }, { enabled: false }), { wrapper });
    expect(getActividadesExternas).not.toHaveBeenCalled();
  });
});
