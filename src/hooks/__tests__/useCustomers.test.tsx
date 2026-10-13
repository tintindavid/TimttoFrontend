import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getAll = vi.hoisted(() => vi.fn());
vi.mock('@/services/customer.service', () => ({ customerService: { getAll } }));

import { useCustomers } from '../useCustomers';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

beforeEach(() => getAll.mockReset().mockResolvedValue({ data: [] }));

describe('useCustomers', () => {
  it('without kind sends no kind param (backend default = clients only)', async () => {
    const { result } = renderHook(() => useCustomers({ page: 1 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getAll).toHaveBeenCalledWith({ page: 1 });
    expect(getAll.mock.calls[0][0]).not.toHaveProperty('kind');
  });

  it('with no params at all keeps working', async () => {
    const { result } = renderHook(() => useCustomers(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getAll).toHaveBeenCalledWith(undefined);
  });

  it('forwards kind=provider', async () => {
    const { result } = renderHook(() => useCustomers({ kind: 'provider' }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getAll).toHaveBeenCalledWith({ kind: 'provider' });
  });
});
