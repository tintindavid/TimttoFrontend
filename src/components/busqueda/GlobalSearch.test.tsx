import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GlobalSearch from './GlobalSearch';
import { BusquedaEquipoService } from '@/services/busquedaEquipo.service';
import type { EquipoEncontrado } from '@/types/busquedaEquipo.types';

let auth: { tenantId: string | null; viewAsTenantId: string | null; user: { role: string; permissions: string[] } };
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth }));

let escritorio = true;
vi.mock('@/hooks/useEsEscritorio', () => ({ useEsEscritorio: () => escritorio }));

vi.mock('@/services/busquedaEquipo.service', () => ({
  BusquedaEquipoService: { buscar: vi.fn(), getResumen: vi.fn() },
}));
const buscar = vi.mocked(BusquedaEquipoService.buscar);

const equipo = (id: string, nombre: string): EquipoEncontrado => ({
  _id: id, nombre, marca: 'GE', modelo: 'B20', serie: 'AB-123', inventario: 'INV-9', estadoOperativo: 'Operativo',
  cliente: { _id: 'c1', nombre: 'Clínica Norte' }, sede: 'Principal', servicio: null,
  coincidencia: { campo: 'serie', valor: 'AB-123' },
});

const Ruta = () => <div data-testid="ruta">{useLocation().pathname}</div>;

const renderBuscador = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <GlobalSearch />
        <Ruta />
      </MemoryRouter>
    </QueryClientProvider>
  );

const escribir = (valor: string) => {
  const input = screen.getByRole('combobox', { name: 'Buscar equipo' });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: valor } });
  return input;
};

beforeEach(() => {
  auth = { tenantId: 't1', viewAsTenantId: null, user: { role: 'admin', permissions: ['equipo-items:read'] } };
  escritorio = true;
  buscar.mockReset();
  buscar.mockResolvedValue([equipo('e1', 'Monitor'), equipo('e2', 'Ventilador')]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GlobalSearch visibility', () => {
  it('is hidden without equipo-items:read', () => {
    auth.user.permissions = [];
    renderBuscador();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it.each([null, '__platform__'])('is hidden without an effective tenant (%s)', (tenantId) => {
    auth = { tenantId, viewAsTenantId: null, user: { role: 'superadmin', permissions: [] } };
    renderBuscador();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('is offered to a superadmin in view-as', () => {
    auth = { tenantId: '__platform__', viewAsTenantId: 't2', user: { role: 'superadmin', permissions: [] } };
    renderBuscador();
    expect(screen.getByRole('combobox', { name: 'Buscar equipo' })).toBeInTheDocument();
  });
});

describe('GlobalSearch on desktop', () => {
  it('waits for the debounce before searching', async () => {
    vi.useFakeTimers();
    renderBuscador();
    escribir('ab123');
    expect(screen.getByRole('status')).toHaveTextContent('Buscando');
    await vi.advanceTimersByTimeAsync(290);
    expect(buscar).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(20);
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar.mock.calls[0][0]).toBe('ab123');
  });

  it.each(['a', 'a-', ' . '])('does not search a term without two useful characters (%j)', async (termino) => {
    vi.useFakeTimers();
    renderBuscador();
    escribir(termino);
    await vi.advanceTimersByTimeAsync(600);
    expect(buscar).not.toHaveBeenCalled();
  });

  it('moves with the arrows and opens the summary with Enter', async () => {
    renderBuscador();
    const input = escribir('ab123');
    const opciones = await screen.findAllByRole('option');
    expect(opciones).toHaveLength(2);
    expect(opciones[0]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[1].id);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('ruta')).toHaveTextContent('/buscar/equipo/e2');
    expect(screen.queryByRole('option')).toBeNull();
  });

  it('opens the summary on click', async () => {
    renderBuscador();
    escribir('ab123');
    fireEvent.click((await screen.findAllByRole('option'))[0]);
    expect(screen.getByTestId('ruta')).toHaveTextContent('/buscar/equipo/e1');
  });

  it('closes the results with Escape', async () => {
    renderBuscador();
    const input = escribir('ab123');
    await screen.findAllByRole('option');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('option')).toBeNull();
    expect(input).toHaveValue('ab123');
  });

  it('shows the empty state', async () => {
    buscar.mockResolvedValue([]);
    renderBuscador();
    escribir('zzz');
    expect(await screen.findByText(/No se encontraron equipos/)).toBeInTheDocument();
  });

  it('shows the error state and retries', async () => {
    buscar.mockRejectedValueOnce(new Error('boom'));
    renderBuscador();
    escribir('ab123');
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo completar la búsqueda');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
  });
});

describe('GlobalSearch on small screens', () => {
  it('shows a magnifier that opens a full-screen search and closes on selection', async () => {
    escritorio = false;
    renderBuscador();
    expect(screen.queryByRole('combobox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar equipo' }));
    expect(document.querySelector('.modal-fullscreen')).not.toBeNull();
    escribir('ab123');
    fireEvent.click((await screen.findAllByRole('option'))[0]);
    expect(screen.getByTestId('ruta')).toHaveTextContent('/buscar/equipo/e1');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
