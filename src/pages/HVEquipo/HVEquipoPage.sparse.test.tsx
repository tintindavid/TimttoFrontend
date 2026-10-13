import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HVEquipoPage from './HVEquipoPage';
import { HVEquipo } from '@/types/hvEquipo.types';

let mockHv: Partial<HVEquipo> | null = null;

// Stable reference: a fresh object per render would re-trigger the page's effects forever.
const { stableEquipoResult } = vi.hoisted(() => ({
  stableEquipoResult: {
    data: {
      data: { _id: 'eq1', ClienteId: 'cli1', Marca: 'Dell', Modelo: 'X1', Serie: 'S1', ItemId: { _id: 'it1', Nombre: 'Computador' } },
    },
    isLoading: false,
  },
}));

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }), close: vi.fn(), showLoading: vi.fn() },
}));

vi.mock('@/hooks/useHVEquipo', () => ({
  useHVEquipoByEquipoId: () => ({
    data: mockHv ? { data: mockHv } : undefined,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useHVEquiposByMarcaModelo: () => ({ data: undefined, isLoading: false }),
  useCreateHVEquipo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateHVEquipo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUploadHvDocumento: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateHvDocumento: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeleteHvDocumento: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));

vi.mock('@/hooks/useEquipoItems', () => ({
  useEquipoItem: () => ({ data: undefined, isLoading: false }),
  useEquipoItemPopulated: () => stableEquipoResult,
}));

vi.mock('@/hooks/useReportes', () => ({
  useReportesByEquipo: () => ({ data: { data: [] }, isLoading: false }),
  useRepuestosByEquipo: () => ({ data: { data: [] }, isLoading: false }),
  useRepuestosByEquipoAll: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { _id: 'u1', role: 'admin' } }) }));
vi.mock('@/context/userContext', () => ({ useCurrentUserData: () => ({ _id: 'u1', role: 'admin' }) }));
vi.mock('@/components/hvEquipo/VerificationTrendsTab', () => ({ default: () => null }));
vi.mock('@/components/hvEquipo/ActividadesExternasTab', () => ({ default: () => null }));
vi.mock('@/components/hvEquipo/GuiaRapidaTab', () => ({ default: () => null }));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/equipos/eq1/hv']}>
      <Routes>
        <Route path="/equipos/:equipoId/hv" element={<HVEquipoPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('HVEquipoPage - sparse HV', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    mockHv = {
      _id: 'hv1',
      clienteId: 'cli1',
      EquipoId: 'eq1',
      EstadoHV: 'Guardada',
      equipoSnapshot: {},
      Fabricante: 'Dell',
      TipoEquipo: 'Computador',
    };
  });

  it('hides empty sections in view mode and shows them all in edit mode', () => {
    renderPage();

    // View mode: sections without data are not rendered
    expect(screen.queryByText('Información del Proveedor')).not.toBeInTheDocument();
    expect(screen.queryByText('Registro Técnico y Características Eléctricas')).not.toBeInTheDocument();
    expect(screen.queryByText('Información de Adquisición')).not.toBeInTheDocument();
    expect(screen.queryByText('Fechas Importantes')).not.toBeInTheDocument();
    // Section with data stays
    expect(screen.getByText('Registro Sanitario y Clasificación')).toBeInTheDocument();
    // Empty fields inside a visible section are hidden
    expect(screen.queryByText('Registro INVIMA:')).not.toBeInTheDocument();
    expect(screen.getByText('Tipo de Equipo:')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));

    expect(screen.getByText('Información del Proveedor')).toBeInTheDocument();
    expect(screen.getByText('Registro Técnico y Características Eléctricas')).toBeInTheDocument();
    expect(screen.getByText('Información de Adquisición')).toBeInTheDocument();
    expect(screen.getByText('Fechas Importantes')).toBeInTheDocument();
    expect(screen.getByText('Registro INVIMA:')).toBeInTheDocument();
    expect(screen.getByText('Otras Especificaciones')).toBeInTheDocument();
  });

  it('offers the new Uso del Equipo options in edit mode', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    for (const label of ['Diagnóstico', 'Monitoreo y soporte vital', 'Terapéutico y rehabilitación', 'Laboratorio clínico', 'Anestesia y quirófano', 'Imágenes diagnósticas']) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('option', { name: 'Producción' })).toBeInTheDocument();
  });

  it('periodicity inputs are numeric, labelled in months and strip non-digits', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    const input = screen.getByText('Periodicidad Calibración (meses):').parentElement!.querySelector('input')!;
    expect(input).toHaveAttribute('type', 'number');
    fireEvent.change(input, { target: { value: '12' } });
    expect(input).toHaveValue(12);
    expect(screen.getByText('Mantenimiento Preventivo (meses):')).toBeInTheDocument();
  });

  it('shows saved periodicity with the months unit in view mode', () => {
    mockHv = { ...mockHv, PeriodicidadCalibracion: '12', PeriodicidadMantenimiento: '1' };
    renderPage();
    expect(screen.getByText('12 meses')).toBeInTheDocument();
    expect(screen.getByText('1 mes')).toBeInTheDocument();
  });

  it('keeps unsaved edits when the HV is refetched (e.g. after a document upload) and resets them on Cancelar', () => {
    const { rerender } = renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    const voltaje = () => screen.getByText('Voltaje (V):').parentElement!.querySelector('input')!;
    fireEvent.change(voltaje(), { target: { value: '220' } });

    mockHv = { ...mockHv }; // refetch returns a new object with the same data
    rerender(
      <MemoryRouter initialEntries={['/equipos/eq1/hv']}>
        <Routes>
          <Route path="/equipos/:equipoId/hv" element={<HVEquipoPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(voltaje()).toHaveValue('220');

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/ }));
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    expect(voltaje()).toHaveValue('');
  });

  it('no longer renders Manual / Planos Disponibles', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    expect(screen.queryByText('Manual Disponible:')).not.toBeInTheDocument();
    expect(screen.queryByText('Planos Disponibles:')).not.toBeInTheDocument();
  });
});
