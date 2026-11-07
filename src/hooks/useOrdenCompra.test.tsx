import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({ list: vi.fn(), aprobar: vi.fn(), pdf: vi.fn() }));

vi.mock('@/services/requisicion.service', () => ({ requisicionService: { list: mocks.list } }));
vi.mock('@/services/ordenCompra.service', () => ({
  ordenCompraService: { aprobar: mocks.aprobar, descargarPdf: mocks.pdf },
}));

import { useAprobarOrdenCompra, useDescargarOrdenCompraPdf, useOcPorAprobarCount } from './useOrdenCompra';

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
};

describe('useOrdenCompra hooks', () => {
  beforeEach(() => {
    mocks.list.mockReset();
    mocks.aprobar.mockReset().mockResolvedValue({ data: {} });
    mocks.pdf.mockReset().mockResolvedValue(new Blob(['pdf']));
  });

  it('counts the OC por aprobar tray from the pagination total with a one-row request', async () => {
    mocks.list.mockResolvedValue({ data: [{}], pagination: { total: 7 } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useOcPorAprobarCount(), { wrapper });
    await waitFor(() => expect(result.current.data).toBe(7));
    expect(mocks.list).toHaveBeenCalledWith({ vista: 'oc-por-aprobar', page: 1, limit: 1 });
  });

  it('does not query when disabled', () => {
    const { wrapper } = setup();
    renderHook(() => useOcPorAprobarCount(false), { wrapper });
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('invalidates the requisiciones cache (detail and trays) after a write', async () => {
    const { client, wrapper } = setup();
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useAprobarOrdenCompra(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'r1', data: { version: 2 } });
    });
    expect(mocks.aprobar).toHaveBeenCalledWith('r1', { version: 2 });
    expect(spy).toHaveBeenCalledWith(['requisiciones']);
  });

  it('reloads the requisicion when the decision was stale (VERSION_DESACTUALIZADA)', async () => {
    mocks.aprobar.mockRejectedValue({ response: { data: { error: { code: 'VERSION_DESACTUALIZADA' } } } });
    const { client, wrapper } = setup();
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useAprobarOrdenCompra(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'r1', data: { version: 1 } }).catch(() => undefined);
    });
    expect(spy).toHaveBeenCalledWith(['requisiciones']);
  });

  it('does not reload on other errors', async () => {
    mocks.aprobar.mockRejectedValue({ response: { data: { error: { code: 'SEPARACION_DE_FUNCIONES' } } } });
    const { client, wrapper } = setup();
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useAprobarOrdenCompra(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'r1', data: { version: 1 } }).catch(() => undefined);
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('downloads the PDF without touching the cache', async () => {
    const { client, wrapper } = setup();
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useDescargarOrdenCompraPdf(), { wrapper });
    let blob: Blob | undefined;
    await act(async () => {
      blob = await result.current.mutateAsync('r1');
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(spy).not.toHaveBeenCalled();
  });
});
