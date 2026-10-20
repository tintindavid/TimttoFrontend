import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HVEquipoPage from './HVEquipoPage';

const equipoInfoMock = {
  _id: 'equipo-1',
  ClienteId: { _id: 'cli-1', Razonsocial: 'Cliente Uno' },
  ItemId: { _id: 'item-1', Nombre: 'Monitor de signos vitales' },
  Marca: 'Philips', Modelo: 'MX40', Serie: 'S-1', mesesMtto: ['mar'], EstadoOperativo: 'Operativo',
  estadoOperativoHistory: [],
};

const snapshot = { Sede: 'Sede A', Servicio: 'Servicio A', Ubicacion: 'Piso 1', Marca: 'Philips', Modelo: 'MX40', Serie: 'S-1', Inventario: 'INV-1' };
const reportesMock = [
  { _id: 'rep-int', consecutivo: 'R000001', tipoMtto: 'Preventivo', estado: 'Cerrado', origen: 'interno', fechaProcesado: '2026-02-20T00:00:00.000Z',
    ResponsableMtto: { firstName: 'Ana', lastName: 'Perez' }, equipoSnapshot: snapshot, actividadesRealizadas: [] },
  { _id: 'rep-ext', consecutivo: 'R000123', tipoMtto: 'Preventivo', estado: 'Cerrado', origen: 'externo', fechaProcesado: '2026-03-12T00:00:00.000Z',
    externo: { proveedor: 'Metrologia Andina SAS', enlace: 'https://cert.example/123' }, equipoSnapshot: snapshot, actividadesRealizadas: [] },
  { _id: 'rep-mc-int', consecutivo: 'R000002', tipoMtto: 'Correctivo', estado: 'Cerrado', origen: 'interno', fechaProcesado: '2026-04-01T00:00:00.000Z',
    ResponsableMtto: { firstName: 'Luis', lastName: 'Gomez' }, equipoSnapshot: snapshot },
  { _id: 'rep-mc-ext', consecutivo: 'R000124', tipoMtto: 'Correctivo', estado: 'Cerrado', origen: 'externo', fechaProcesado: '2026-04-05T00:00:00.000Z',
    externo: { proveedor: 'Taller Libre', documento: { url: 'https://storage.example/mc.pdf', nombreOriginal: 'mc.pdf' } }, equipoSnapshot: snapshot },
];

let caps: { registersExternal: boolean };
let permisos: string[];
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({ ...caps, can: (c: string) => (c === 'registersExternal' ? caps.registersExternal : true) }),
}));
vi.mock('@/hooks/usePermission', () => ({ useHasPermission: (p: string) => permisos.includes(p) }));
vi.mock('@/hooks/useReporteExterno', () => ({ useRemoveReporteExterno: () => ({ mutateAsync: vi.fn(), isLoading: false }) }));
vi.mock('@/components/hvEquipo/ReporteExternoModal', () => ({
  default: (props: { tipoMtto: string; estadoActual?: string; mesesMtto?: string[] }) => (
    <div data-testid="modal-externo" data-tipo={props.tipoMtto} data-estado={props.estadoActual} data-meses={(props.mesesMtto ?? []).join(',')} />
  ),
}));
vi.mock('@/components/hvEquipo/VerificationTrendsTab', () => ({ default: () => <div data-testid="vp-tab" /> }));

vi.mock('@/context/userContext', () => ({ useCurrentUserData: () => ({ _id: 'user-1', firstName: 'Test', lastName: 'User' }) }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { _id: 'user-1' } }) }));
vi.mock('@/hooks/useHVEquipo', () => ({
  useHVEquipoByEquipoId: () => ({ data: { data: null }, isLoading: false, refetch: vi.fn() }),
  useHVEquiposByMarcaModelo: () => ({ data: { data: [] }, isLoading: false }),
  useCreateHVEquipo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateHVEquipo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUploadHvDocumento: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateHvDocumento: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeleteHvDocumento: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/useEquipoItems', () => ({
  useEquipoItem: () => ({ data: { data: equipoInfoMock }, isLoading: false }),
  useEquipoItemPopulated: () => ({ data: { data: equipoInfoMock }, isLoading: false }),
}));
vi.mock('@/hooks/useReportes', () => ({
  useReportesByEquipo: () => ({ data: { data: reportesMock }, isLoading: false }),
  useRepuestosByEquipo: () => ({ data: { data: [] }, isLoading: false }),
  useRepuestosByEquipoAll: () => ({ data: { data: [] }, isLoading: false }),
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/hv-equipo/equipo-1']}>
      <Routes><Route path="/hv-equipo/:equipoId" element={<HVEquipoPage />} /></Routes>
    </MemoryRouter>,
  );

const openTab = (title: string) => fireEvent.click(screen.getByTitle(title));
// All tabs stay mounted, so rows are looked up inside the pane of the tab under test
const pane = (key: 'preventivos' | 'correctivos') => document.querySelector(`[role="tabpanel"][id$="tabpane-${key}"]`) as HTMLElement;
const rowOf = (key: 'preventivos' | 'correctivos', text: string) => within(pane(key)).getByText(text).closest('tr') as HTMLElement;

beforeEach(() => {
  caps = { registersExternal: true };
  permisos = ['reports:create', 'reports:delete'];
});

describe('HVEquipoPage - MP tab with external services', () => {
  it('offers "Adicionar actividad" for preventive services with the equipment current state', () => {
    renderPage();
    openTab('Mantenimientos Preventivos');
    fireEvent.click(within(pane('preventivos')).getByTestId('adicionar-actividad'));
    const modal = screen.getByTestId('modal-externo');
    expect(modal.getAttribute('data-tipo')).toBe('Preventivo');
    expect(modal.getAttribute('data-estado')).toBe('Operativo');
  });

  it('marks external rows with the Externo badge and the provider, and leaves internal rows as before', () => {
    renderPage();
    openTab('Mantenimientos Preventivos');
    const ext = rowOf('preventivos', 'R000123');
    expect(within(ext).getByTestId('insignia-externo')).toBeInTheDocument();
    expect(within(ext).getByText('Metrologia Andina SAS')).toBeInTheDocument();
    const interno = rowOf('preventivos', 'R000001');
    expect(within(interno).queryByTestId('insignia-externo')).toBeNull();
    expect(within(interno).getByText(/Ana\s+Perez/)).toBeInTheDocument();
  });

  it('shows the date of an external service as stored (UTC calendar day), not the day before', () => {
    renderPage();
    openTab('Mantenimientos Preventivos');
    expect(within(rowOf('preventivos', 'R000123')).getByText('12/3/2026')).toBeInTheDocument();
    openTab('Correctivos y otros mantenimientos');
    expect(within(rowOf('correctivos', 'R000124')).getByText('5/4/2026')).toBeInTheDocument();
  });

  it('the "Actividades externas" tab exists with the module and disappears without it', () => {
    const { unmount } = renderPage();
    expect(screen.getByRole('tab', { name: /Actividades externas/ })).toBeInTheDocument();
    unmount();
    caps = { registersExternal: false };
    renderPage();
    expect(screen.queryByRole('tab', { name: /Actividades externas/ })).toBeNull();
    expect(screen.getByTitle('Mantenimientos Preventivos')).toBeInTheDocument();
  });

  it('without the module the existing external history stays visible read-only (badge and "Ver"), with no add or delete', () => {
    caps = { registersExternal: false };
    renderPage();
    openTab('Mantenimientos Preventivos');
    const ext = rowOf('preventivos', 'R000123');
    expect(within(ext).getByTestId('insignia-externo')).toBeInTheDocument();
    expect(within(ext).getByRole('button', { name: 'Ver' })).toBeInTheDocument();
    expect(within(ext).queryByRole('button', { name: /Eliminar servicio externo/ })).toBeNull();
    expect(screen.queryByTestId('adicionar-actividad')).toBeNull();
  });

  it('the external tab waits for the capabilities to load', () => {
    caps = { registersExternal: true, isLoading: true } as typeof caps;
    renderPage();
    expect(screen.queryByRole('tab', { name: /Actividades externas/ })).toBeNull();
  });

  it('only external rows get the delete action', () => {
    renderPage();
    openTab('Mantenimientos Preventivos');
    expect(within(rowOf('preventivos', 'R000123')).getByRole('button', { name: /Eliminar servicio externo/ })).toBeInTheDocument();
    expect(within(rowOf('preventivos', 'R000001')).queryByRole('button', { name: /Eliminar servicio externo/ })).toBeNull();
  });

  it('is hidden for a tenant without registersExternal and for users without reports:create', () => {
    caps = { registersExternal: false };
    const { unmount } = renderPage();
    openTab('Mantenimientos Preventivos');
    expect(screen.queryAllByTestId('adicionar-actividad')).toHaveLength(0);
    expect(within(rowOf('preventivos', 'R000123')).queryByRole('button', { name: /Eliminar servicio externo/ })).toBeNull();
    unmount();
    caps = { registersExternal: true };
    permisos = [];
    renderPage();
    openTab('Mantenimientos Preventivos');
    expect(screen.queryAllByTestId('adicionar-actividad')).toHaveLength(0);
  });
});

describe('HVEquipoPage - MC tab with external services', () => {
  it('offers "Adicionar actividad" for corrective services', () => {
    renderPage();
    openTab('Correctivos y otros mantenimientos');
    fireEvent.click(within(pane('correctivos')).getByTestId('adicionar-actividad'));
    expect(screen.getByTestId('modal-externo').getAttribute('data-tipo')).toBe('Correctivo');
  });

  it('marks external rows and offers delete only for them', () => {
    renderPage();
    openTab('Correctivos y otros mantenimientos');
    const ext = rowOf('correctivos', 'R000124');
    expect(within(ext).getByTestId('insignia-externo')).toBeInTheDocument();
    expect(within(ext).getByText('Taller Libre')).toBeInTheDocument();
    expect(within(ext).getByRole('button', { name: /Eliminar servicio externo/ })).toBeInTheDocument();
    const interno = rowOf('correctivos', 'R000002');
    expect(within(interno).queryByTestId('insignia-externo')).toBeNull();
    expect(within(interno).queryByRole('button', { name: /Eliminar servicio externo/ })).toBeNull();
  });

  it('keeps counting both origins in the tab badges', () => {
    renderPage();
    const mp = screen.getByTitle('Mantenimientos Preventivos');
    const mc = screen.getByTitle('Correctivos y otros mantenimientos');
    expect(mp.textContent).toMatch(/MP\s*2/);
    expect(mc.textContent).toMatch(/MC\s*2/);
  });
});

describe('HVEquipoPage - "Ver" of external services', () => {
  const open = vi.fn();
  beforeEach(() => { open.mockReset(); vi.stubGlobal('open', open); });

  it('MP: an external service opens its link, an internal one still opens the report', () => {
    renderPage();
    openTab('Mantenimientos Preventivos');
    fireEvent.click(within(rowOf('preventivos', 'R000123')).getByRole('button', { name: 'Ver' }));
    expect(open).toHaveBeenLastCalledWith('https://cert.example/123', '_blank', 'noopener,noreferrer');
    fireEvent.click(within(rowOf('preventivos', 'R000001')).getByRole('button', { name: 'Ver' }));
    expect(open).toHaveBeenLastCalledWith('/reports/rep-int/view', '_blank');
  });

  it('MC: an external service opens its attached document', () => {
    renderPage();
    openTab('Correctivos y otros mantenimientos');
    fireEvent.click(within(rowOf('correctivos', 'R000124')).getByRole('button', { name: 'Ver' }));
    expect(open).toHaveBeenLastCalledWith('https://storage.example/mc.pdf', '_blank', 'noopener,noreferrer');
    expect(open).not.toHaveBeenCalledWith('/reports/rep-mc-ext/view', '_blank');
  });

  it('gives the preventive form the scheduled months of the equipment', () => {
    renderPage();
    openTab('Mantenimientos Preventivos');
    fireEvent.click(within(pane('preventivos')).getByTestId('adicionar-actividad'));
    expect(screen.getByTestId('modal-externo').getAttribute('data-meses')).toBe('mar');
  });
});
