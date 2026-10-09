import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCadenasVigentesPorTipo } from '../useActividadesExternas';
import { actividadExternaService } from '@/services/actividadExterna.service';

vi.mock('@/services/actividadExterna.service', () => ({
  actividadExternaService: {
    getCadenasVigentesPorTipo: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe('useCadenasVigentesPorTipo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('esta deshabilitado por default (enabled=false)', () => {
    renderHook(() => useCadenasVigentesPorTipo('eq1', 'calibracion'), { wrapper });
    expect(actividadExternaService.getCadenasVigentesPorTipo).not.toHaveBeenCalled();
  });

  it('ejecuta la query cuando enabled=true', async () => {
    renderHook(
      () => useCadenasVigentesPorTipo('eq1', 'calibracion', undefined, { enabled: true }),
      { wrapper },
    );
    await waitFor(() =>
      expect(actividadExternaService.getCadenasVigentesPorTipo).toHaveBeenCalledWith('eq1', 'calibracion', undefined),
    );
  });
});
