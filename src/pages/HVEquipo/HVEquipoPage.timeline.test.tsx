import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HVEquipoPage from './HVEquipoPage';

const equipoInfoMock = {
  _id: 'equipo-1',
  ClienteId: { _id: 'cli-1', Razonsocial: 'Cliente Uno' },
  ItemId: { _id: 'item-1', Nombre: 'Monitor de signos vitales' },
  Marca: 'Philips',
  Modelo: 'MX40',
  Serie: 'S-1',
  mesesMtto: ['ene'],
  estadoOperativoHistory: [
    {
      _id: 'hist-1',
      from: 'Operativo',
      to: 'En Reparacion',
      motivo: 'Falla intermitente',
      changedBy: 'user-1',
      changedByName: 'M. Duran',
      source: 'manual',
      reportId: null,
      at: '2026-08-21T10:00:00.000Z',
    },
  ],
};

const reportesMock = [
  {
    _id: 'rep-1',
    consecutivo: 'C1',
    tipoMtto: 'Preventivo',
    fechaProcesado: '2026-08-20T00:00:00.000Z',
    equipoSnapshot: {
      Sede: 'Sede A',
      Servicio: 'Servicio A',
      Ubicacion: 'Piso 1',
      Marca: 'Philips',
      Modelo: 'MX40',
      Serie: 'S-1',
      Inventario: 'INV-1',
    },
  },
  {
    _id: 'rep-2',
    consecutivo: 'C2',
    tipoMtto: 'Correctivo',
    fechaProcesado: '2026-08-22T00:00:00.000Z',
    equipoSnapshot: {
      Sede: 'Sede B',
      Servicio: 'Servicio A',
      Ubicacion: 'Piso 1',
      Marca: 'Philips',
      Modelo: 'MX40',
      Serie: 'S-1',
      Inventario: 'INV-1',
    },
  },
];

vi.mock('@/context/userContext', () => ({
  useCurrentUserData: () => ({ _id: 'user-1', firstName: 'Test', lastName: 'User' }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'user-1' } }),
}));

vi.mock('@/hooks/useHVEquipo', () => ({
  useHVEquipoByEquipoId: () => ({ data: { data: null }, isLoading: false, refetch: vi.fn() }),
  useHVEquiposByMarcaModelo: () => ({ data: { data: [] }, isLoading: false }),
  useCreateHVEquipo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateHVEquipo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
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
    <MemoryRouter>
      <HVEquipoPage />
    </MemoryRouter>
  );

describe('HVEquipoPage — timeline tab (diff events + estadoOperativoHistory)', () => {
  it('merges diff-derived events with EstadoOperativo history, sorted by date descending', () => {
    renderPage();

    fireEvent.click(screen.getByTitle('Historial de Cambios'));

    const items = document.querySelectorAll('.timeline-item .timeline-date');
    const dates = Array.from(items).map((el) => el.textContent);

    // Descending: 2026-08-22 (diff) → 2026-08-21 (estado-operativo) → 2026-08-20 (initial diff)
    // Formatted with the exact same source strings/format fn the component uses,
    // so the comparison is immune to the local timezone of the test runner.
    const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-CO');
    expect(dates).toEqual([
      fmt('2026-08-22T00:00:00.000Z'),
      fmt('2026-08-21T10:00:00.000Z'),
      fmt('2026-08-20T00:00:00.000Z'),
    ]);
  });

  it('renders the estado-operativo event with source badge, transition, responsable and motivo', () => {
    renderPage();
    fireEvent.click(screen.getByTitle('Historial de Cambios'));

    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText(/Operativo → En Reparacion/)).toBeInTheDocument();
    expect(screen.getByText(/M\. Duran/)).toBeInTheDocument();
    expect(screen.getByText('Falla intermitente')).toBeInTheDocument();
  });

  it('applies the .estado dot class to the estado-operativo timeline entry', () => {
    renderPage();
    fireEvent.click(screen.getByTitle('Historial de Cambios'));

    expect(document.querySelector('.timeline-dot.estado')).toBeTruthy();
  });
});
