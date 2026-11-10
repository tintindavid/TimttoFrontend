import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Tablero } from '@/types/requisicionReportes.types';

const mocks = vi.hoisted(() => ({
  useGetTablero: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/hooks/useRequisicionReportes', () => ({ useGetTablero: mocks.useGetTablero }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

import TableroTab from './TableroTab';

const c = (count: number, enlace: Record<string, string> | null = null) => ({ count, enlace });

const personal = {
  mias: c(3, { vista: 'mias' }),
  porAprobar: c(2, { vista: 'por-aprobar' }),
  ocPorAprobar: c(0, { vista: 'oc-por-aprobar' }),
  porRecibir: c(1, { vista: 'por-recibir' }),
  porConfirmar: c(4, null),
};

const tenant = {
  porAprobar: c(9, { vista: 'por-aprobar' }),
  ocPorAprobar: c(1, { vista: 'oc-por-aprobar' }),
  licitacionesAbiertas: c(5, { alcance: 'tenant', filtro: 'licitaciones-abiertas' }),
  licitacionesPorVencer: c(2, { alcance: 'tenant', filtro: 'licitaciones-por-vencer' }),
  licitacionesVencidas: c(1, null),
  porRecibir: c(6, { vista: 'por-recibir' }),
  porConfirmar: c(7, { vista: 'por-confirmar' }),
  entregablesPendientes: c(8, { alcance: 'tenant', estado: 'En_Recepcion' }),
  sinMovimiento: c(10, null),
};

const renderTab = (tablero?: Tablero, state: Record<string, unknown> = {}) => {
  mocks.useGetTablero.mockReturnValue({ data: tablero ? { data: tablero } : undefined, isLoading: false, isError: false, ...state });
  return render(
    <MemoryRouter>
      <TableroTab />
    </MemoryRouter>
  );
};

describe('TableroTab', () => {
  beforeEach(() => {
    mocks.navigate.mockClear();
    mocks.useGetTablero.mockReset();
  });

  it('shows the personal section only when the server sends no tenant block', () => {
    renderTab({ personal });
    expect(screen.getByRole('heading', { name: 'Mis pendientes' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Toda la organización' })).not.toBeInTheDocument();
    expect(screen.getAllByTestId('tablero-card')).toHaveLength(5);
  });

  it('shows the tenant section when present', () => {
    renderTab({ personal, tenant });
    expect(screen.getByRole('heading', { name: 'Toda la organización' })).toBeInTheDocument();
    expect(screen.getAllByTestId('tablero-card')).toHaveLength(14);
    expect(screen.getByText('Licitaciones por vencer')).toBeInTheDocument();
  });

  it('a card with enlace is a button that opens the list with the enlace params', () => {
    renderTab({ personal, tenant });
    fireEvent.click(screen.getByRole('button', { name: 'Por aprobar: 2. Ver listado' }));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/requisiciones/por-aprobar');
    fireEvent.click(screen.getByRole('button', { name: 'Licitaciones abiertas: 5. Ver listado' }));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/requisiciones?alcance=tenant&filtro=licitaciones-abiertas');
    fireEvent.click(screen.getByRole('button', { name: 'Entregables pendientes: 8. Ver listado' }));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/requisiciones?estado=En_Recepcion&alcance=tenant');
  });

  it('a card without enlace is not clickable', () => {
    renderTab({ personal, tenant });
    expect(screen.queryByRole('button', { name: /Por confirmar: 4/ })).not.toBeInTheDocument();
    const card = screen.getAllByTestId('tablero-card').find((el) => within(el).queryByText('Sin movimiento'));
    expect(card).toBeDefined();
    expect(within(card as HTMLElement).queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the loading and error states', () => {
    renderTab(undefined, { isLoading: true });
    expect(screen.getByLabelText('Cargando tablero')).toBeInTheDocument();
  });

  it('shows an error alert when the request fails', () => {
    renderTab(undefined, { isError: true });
    expect(screen.getByText('No fue posible cargar el tablero.')).toBeInTheDocument();
  });
});
