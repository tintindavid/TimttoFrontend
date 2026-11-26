import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from './DashboardPage';

const authState = {
  user: { role: 'admin' } as { role: string } | null,
  tenantId: 't1' as string | null,
  viewAsTenantId: null as string | null,
};
const capsState = { can: (_c: string) => true };

vi.mock('@/context/AuthContext', () => ({ useAuth: () => authState }));
vi.mock('@/context/TenantCapabilitiesContext', () => ({ useTenantCapabilities: () => capsState }));
vi.mock('react-chartjs-2', () => ({
  Bar: () => <canvas />,
  Line: () => <canvas />,
  Doughnut: () => <canvas />,
}));
vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({ data: { data: [{ _id: 'c1', Razonsocial: 'Clinica Uno' }] } }),
}));
vi.mock('@/hooks/useSedes', () => ({ useSedes: () => ({ data: { data: [] } }) }));
vi.mock('@/hooks/useServicios', () => ({ useServicios: () => ({ data: { data: [] } }) }));
vi.mock('@/hooks/useUsers', () => ({ useUsers: () => ({ data: { data: [] } }) }));

const svc = vi.hoisted(() => ({
  getCumplimiento: vi.fn(),
  getEquiposPeriodo: vi.fn(),
  getMisCifras: vi.fn(),
  getRanking: vi.fn(),
  getItems: vi.fn(),
  getTiempos: vi.fn(),
  getOperativos: vi.fn(),
  getAlertas: vi.fn(),
}));
vi.mock('@/services/dashboard.service', () => ({ dashboardService: svc, default: svc }));

const periodo = { desde: '2026-11-01', hasta: '2026-11-30', etiqueta: 'Noviembre 2026' };
const unavailable = { periodo, disponible: false };

const LocationProbe: React.FC = () => <div data-testid="search">{useLocation().search}</div>;

const renderPage = (initial = '/') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initial]}>
        <DashboardPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  authState.user = { role: 'admin' };
  authState.tenantId = 't1';
  authState.viewAsTenantId = null;
  capsState.can = () => true;
  svc.getCumplimiento.mockResolvedValue({
    periodo,
    programadas: 10,
    realizadas: 8,
    porcentaje: 80,
    noProgramadasRealizadas: 1,
    porCliente: [],
    porTipo: [],
    tendencia: [],
    filtrosNoAplicados: ['tecnicoId'],
  });
  svc.getEquiposPeriodo.mockResolvedValue({
    periodo,
    actual: { programados: 5, realizados: 3, pendientes: 2, vencidos: 1, cancelados: 0 },
    anterior: { iguales: false },
    variacion: {
      programados: { absoluta: 1, porcentaje: 25 },
      realizados: { absoluta: 0, porcentaje: 0 },
      pendientes: { absoluta: 0, porcentaje: 0 },
      vencidos: { absoluta: 0, porcentaje: 0 },
      cancelados: { absoluta: 0, porcentaje: 0 },
    },
  });
  svc.getMisCifras.mockResolvedValue(unavailable);
  svc.getRanking.mockResolvedValue(unavailable);
  svc.getItems.mockResolvedValue(unavailable);
  svc.getTiempos.mockResolvedValue(unavailable);
  svc.getOperativos.mockResolvedValue({
    periodo,
    otsPorEstado: { disponible: true, items: [{ estado: 'Abierta', cantidad: 2 }] },
    preventivoVsCorrectivo: { disponible: true, preventivo: 1, correctivo: 1, otros: 0 },
    equiposPorEstadoOperativo: { disponible: true, items: [] },
    ticketsAbiertos: { disponible: true, cantidad: 4 },
    requisicionesPendientes: { disponible: true, cantidad: 6 },
  });
  svc.getAlertas.mockResolvedValue({
    periodo,
    otsVencidas: { disponible: false, cantidad: 0, items: [] },
    equiposSinMantenimiento: { disponible: false, cantidad: 0, items: [] },
  });
});

describe('DashboardPage', () => {
  it('shows the notice and sends no requests for a superadmin without view-as', () => {
    authState.user = { role: 'superadmin' };
    authState.tenantId = null;
    renderPage();
    expect(screen.getByText('Elige un tenant (ver como) para ver el dashboard')).toBeInTheDocument();
    Object.values(svc).forEach((fn) => expect(fn).not.toHaveBeenCalled());
  });

  it('loads cards with the default period and renders the not-applied filters note', async () => {
    renderPage();
    expect(await screen.findByText('80.0%')).toBeInTheDocument();
    expect(screen.getByText(/Filtros no aplicados a esta tarjeta: tecnicoId/)).toBeInTheDocument();
    expect(svc.getCumplimiento).toHaveBeenCalledWith({ periodo: 'mes_actual' });
  });

  it('reads filters from the URL and writes changes back, refetching with the new filter', async () => {
    renderPage('/?periodo=mes_anterior&clienteId=c1');
    await waitFor(() =>
      expect(svc.getCumplimiento).toHaveBeenCalledWith({ periodo: 'mes_anterior', clienteId: 'c1' })
    );
    fireEvent.change(screen.getByLabelText('Tipo de mantenimiento'), { target: { value: 'Preventivo' } });
    await waitFor(() =>
      expect(svc.getCumplimiento).toHaveBeenCalledWith({
        periodo: 'mes_anterior',
        clienteId: 'c1',
        tipoMtto: 'Preventivo',
      })
    );
    expect(screen.getByTestId('search').textContent).toContain('tipoMtto=Preventivo');
  });

  it('isolates a failing card without breaking the others', async () => {
    svc.getCumplimiento.mockRejectedValue(new Error('boom'));
    renderPage();
    expect(await screen.findByText('No se pudo cargar "Cumplimiento del cronograma".')).toBeInTheDocument();
    expect(await screen.findByText('Equipos del período')).toBeInTheDocument();
    expect(await screen.findByText('Programados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar Cumplimiento del cronograma' })).toBeInTheDocument();
  });

  it('hides cards of disabled modules and does not request them', async () => {
    capsState.can = (c) => c === 'usesQrs';
    renderPage();
    expect(await screen.findByText('Tickets abiertos')).toBeInTheDocument();
    expect(screen.queryByText('Requisiciones pendientes')).not.toBeInTheDocument();
    expect(svc.getMisCifras).not.toHaveBeenCalled();
    expect(svc.getRanking).not.toHaveBeenCalled();
    expect(svc.getItems).not.toHaveBeenCalled();
    expect(svc.getTiempos).not.toHaveBeenCalled();
  });

  it('keeps equipment-based cards for a client tenant (no executesServices)', async () => {
    capsState.can = () => false;
    svc.getCumplimiento.mockResolvedValue({
      periodo,
      programadas: 4,
      realizadas: 2,
      porcentaje: 50,
      noProgramadasRealizadas: 0,
      porCliente: [],
      porTipo: [],
      tendencia: [],
      filtrosNoAplicados: [],
    });
    renderPage();
    expect(await screen.findByText('50.0%')).toBeInTheDocument();
    expect(screen.queryByText('Por tipo de mantenimiento')).not.toBeInTheDocument();
    expect(await screen.findByText('Equipos del período')).toBeInTheDocument();
    await waitFor(() => expect(svc.getAlertas).toHaveBeenCalled());
    expect(svc.getMisCifras).not.toHaveBeenCalled();
  });

  it('does not request anything when the range is inverted', async () => {
    renderPage('/?periodo=rango&desde=2026-11-10&hasta=2026-11-01');
    expect(await screen.findByText(/no puede ser posterior/)).toBeInTheDocument();
    Object.values(svc).forEach((fn) => expect(fn).not.toHaveBeenCalled());
  });

  it('does not reuse the cache of the previous tenant when switching view-as', async () => {
    authState.user = { role: 'superadmin' };
    authState.tenantId = null;
    authState.viewAsTenantId = 'A';
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = (
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    const { rerender } = render(tree);
    await waitFor(() => expect(svc.getCumplimiento).toHaveBeenCalledTimes(1));
    authState.viewAsTenantId = 'B';
    rerender(tree);
    await waitFor(() => expect(svc.getCumplimiento).toHaveBeenCalledTimes(2));
  });

  it('hides a card when the backend reports it as not available', async () => {
    renderPage();
    await screen.findByText('80.0%');
    await waitFor(() => expect(svc.getMisCifras).toHaveBeenCalled());
    expect(screen.queryByText('Mis cifras')).not.toBeInTheDocument();
  });
});
