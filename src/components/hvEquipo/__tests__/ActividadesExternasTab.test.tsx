import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActividadesExternasTab from '../ActividadesExternasTab';

const mockMutate = vi.fn().mockResolvedValue({ data: {} });
const mockRefetch = vi.fn();
let mockLoading = false;

vi.mock('@/hooks/useActividadesExternas', () => ({
  useActividadesExternasPorEquipo: () => ({ data: { data: [] }, isLoading: false, isError: false }),
  useCadenasVigentesPorTipo: () => ({ data: { data: [] }, refetch: mockRefetch }),
  useCreateActividadExterna: () => ({ mutateAsync: mockMutate, isLoading: mockLoading }),
  useRemoveActividadExterna: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useCerrarCadena: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

const fillPaso1 = (opts: { unica?: boolean } = {}) => {
  fireEvent.click(screen.getByRole('button', { name: /Agregar actividad/i }));
  fireEvent.change(screen.getByLabelText(/Tipo de actividad/i), { target: { value: 'calibracion' } });
  fireEvent.change(screen.getByLabelText(/Consecutivo/i), { target: { value: 'CAL-1' } });
  fireEvent.change(screen.getByLabelText(/^Fecha/i), { target: { value: '2026-01-15' } });
  fireEvent.change(screen.getByLabelText(/Proveedor/i), { target: { value: 'ACME' } });
  fireEvent.change(screen.getByLabelText(/Estado final/i), { target: { value: 'aprobada' } });
  if (opts.unica) fireEvent.click(screen.getByLabelText(/Actividad única/i));
  fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
};

describe('ActividadesExternasTab — matriz de continuidad', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockRefetch.mockReset();
    mockLoading = false;
    mockMutate.mockResolvedValue({ data: {} });
  });

  it('0 cadenas vigentes → crea directo, no abre paso 2', async () => {
    mockRefetch.mockResolvedValue({ data: { data: [] } });
    render(<ActividadesExternasTab equipoId="eq1" clienteId="cli1" />, { wrapper });
    fillPaso1();
    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ dto: expect.objectContaining({ cadenaIdSucesion: undefined }) }),
      ),
    );
    expect(screen.queryByText(/continúa un cronograma/i)).toBeNull();
  });

  it('esUnica + 1 cadena vigente → crea directo, no abre paso 2', async () => {
    mockRefetch.mockResolvedValue({
      data: { data: [{ _id: 'cad1', tipo: 'calibracion', esUnica: false, frecuenciaMeses: 12, estado: 'vigente' }] },
    });
    render(<ActividadesExternasTab equipoId="eq1" clienteId="cli1" />, { wrapper });
    fillPaso1({ unica: true });
    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(screen.queryByText(/continúa un cronograma/i)).toBeNull();
  });

  it('con frecuencia + 1 cadena sucedible → abre paso 2', async () => {
    mockRefetch.mockResolvedValue({
      data: { data: [{ _id: 'cad1', tipo: 'calibracion', esUnica: false, frecuenciaMeses: 12, estado: 'vigente' }] },
    });
    render(<ActividadesExternasTab equipoId="eq1" clienteId="cli1" />, { wrapper });
    fillPaso1();
    await waitFor(() => expect(screen.getByText(/continúa un cronograma/i)).toBeInTheDocument());
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('si create falla, vuelve al paso 1 y el modal sigue montado para reintentar', async () => {
    mockRefetch.mockResolvedValue({ data: { data: [] } });
    mockMutate.mockRejectedValueOnce(new Error('boom'));
    render(<ActividadesExternasTab equipoId="eq1" clienteId="cli1" />, { wrapper });
    fillPaso1();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    const btn = await screen.findByRole('button', { name: /Continuar/i });
    fireEvent.click(btn);
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(2));
  });

  it('no dispara un segundo create si createMut.isLoading', async () => {
    mockRefetch.mockResolvedValue({ data: { data: [] } });
    mockLoading = true;
    render(<ActividadesExternasTab equipoId="eq1" clienteId="cli1" />, { wrapper });
    fillPaso1({ unica: true });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
