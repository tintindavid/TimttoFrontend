import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DemoBanner from './DemoBanner';
import DownloadInventarioModal from '@/components/customers/DownloadInventarioModal';
import { DemoService } from '@/services/demo.service';
import { getDemoErrorMessage } from '@/utils/demo';

vi.unmock('@/hooks/useDemoStatus');
vi.mock('@/services/demo.service', () => ({ DemoService: { getStatus: vi.fn() } }));

const demo = {
  enabled: true as const,
  limits: { users: 2, customers: 3, equipos: 50, pdfPerDocument: 2 },
  usage: { users: 1, customers: 1, equipos: 15 },
};

const renderWithClient = (ui: React.ReactElement) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {ui}
  </QueryClientProvider>,
);

describe('demo account UI', () => {
  beforeEach(() => {
    localStorage.setItem('tenantId', 'demo-1');
    vi.mocked(DemoService.getStatus).mockReset();
  });

  it('shows limits and usage', async () => {
    vi.mocked(DemoService.getStatus).mockResolvedValue(demo);
    renderWithClient(<DemoBanner />);
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Usuarios 1/2 · Clientes 1/3 · Equipos 15/50'));
  });

  it('renders nothing for a regular tenant', async () => {
    vi.mocked(DemoService.getStatus).mockResolvedValue({ enabled: false });
    renderWithClient(<DemoBanner />);
    await waitFor(() => expect(DemoService.getStatus).toHaveBeenCalled());
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('only allows the PDF inventory in a demo', async () => {
    vi.mocked(DemoService.getStatus).mockResolvedValue(demo);
    renderWithClient(<DownloadInventarioModal show customerId="c1" onHide={() => {}} />);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Excel (.xlsx)' })).toBeDisabled());
    expect(screen.getByRole('radio', { name: 'PDF' })).toBeChecked();
  });

  it('shows the backend message for demo restrictions only', () => {
    const err = (code: string) => ({ response: { data: { message: 'Límite', error: { code } } } });
    expect(getDemoErrorMessage(err('DEMO_PDF_LIMIT_REACHED'), 'x')).toBe('Límite');
    expect(getDemoErrorMessage(err('OTRO'), 'x')).toBe('x');
  });
});
