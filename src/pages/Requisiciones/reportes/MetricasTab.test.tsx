import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Metricas } from '@/types/requisicionReportes.types';

const mocks = vi.hoisted(() => ({ useGetMetricas: vi.fn() }));

vi.mock('react-chartjs-2', () => ({ Bar: () => <canvas data-testid="bar-canvas" /> }));
vi.mock('@/hooks/useRequisicionReportes', () => ({ useGetMetricas: mocks.useGetMetricas }));
vi.mock('@/hooks/useAreas', () => ({ useGetAreas: () => ({ data: { data: [{ _id: 'a1', nombre: 'Mantenimiento' }] } }) }));
vi.mock('@/hooks/useTiposRequisicion', () => ({ useGetTiposRequisicion: () => ({ data: { data: [{ _id: 't1', nombre: 'Repuestos' }] } }) }));

import MetricasTab from './MetricasTab';

const ciclo = (n: number, mediana: number | null, p90: number | null) => ({ n, medianaHoras: mediana, p90Horas: p90 });

const metricas: Metricas = {
  rango: { desde: '2026-10-01T00:00:00.000Z', hasta: '2026-10-31T23:59:59.000Z' },
  total: 12,
  porEstado: [
    { estado: 'Cerrada', count: 5 },
    { estado: 'Rechazada', count: 2 },
    { estado: 'Borrador', count: 0 },
  ],
  tasaRechazo: { rechazadas: 2, enviadas: 8, tasa: 0.25 },
  ciclos: {
    envioAprobacion: ciclo(8, 3.5, 20),
    aprobacionAdjudicacion: ciclo(0, null, null),
    adjudicacionOcEnviada: ciclo(4, 30, 100),
    ocEnviadaCierre: ciclo(0, null, null),
  },
  valorComprado: [
    { moneda: 'COP', total: 5000000, ordenes: 3 },
    { moneda: 'USD', total: 1200, ordenes: 1 },
  ],
  estimadoVsReal: [
    { moneda: 'COP', estimado: 4500000, real: 5000000, exceso: 500000, requisiciones: 3 },
    { moneda: 'USD', estimado: 1000, real: 1200, exceso: 200, requisiciones: 1 },
  ],
  sinEstimar: { requisiciones: 2 },
  devolucionesEntregables: { total: 1, requisiciones: 1 },
  topProveedores: [
    { proveedorId: 'p1', nombre: 'Proveedor Uno', moneda: 'COP', valor: 3000000, ordenes: 2 },
    { proveedorId: 'p2', nombre: 'Proveedor Dos', moneda: 'USD', valor: 1200, ordenes: 1 },
  ],
  topAreas: [{ areaId: 'a1', nombre: 'Mantenimiento', moneda: 'COP', valor: 5000000, requisiciones: 3 }],
};

const setResult = (over: Record<string, unknown> = {}) =>
  mocks.useGetMetricas.mockReturnValue({
    data: { data: metricas },
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    ...over,
  });

describe('MetricasTab', () => {
  beforeEach(() => {
    mocks.useGetMetricas.mockReset();
    setResult();
  });

  it('shows KPI tiles with the rejection rate and one purchased-value tile per currency', () => {
    render(<MetricasTab />);
    expect(screen.getByText('Tasa de rechazo')).toBeInTheDocument();
    expect(screen.getByText('25 %')).toBeInTheDocument();
    expect(screen.getByText('Valor comprado (COP)')).toBeInTheDocument();
    expect(screen.getByText('Valor comprado (USD)')).toBeInTheDocument();
    expect(screen.getByText('Sin estimar')).toBeInTheDocument();
  });

  it('shows an em dash instead of a rate when nothing was sent', () => {
    setResult({ data: { data: { ...metricas, tasaRechazo: { rechazadas: 0, enviadas: 0, tasa: null } } } });
    render(<MetricasTab />);
    expect(screen.queryByText('0 %')).not.toBeInTheDocument();
    expect(screen.getByText('0 rechazadas de 0 enviadas').closest('[data-testid="metricas-kpi"]')).toHaveTextContent('—');
  });

  it('renders the charts with their equivalent tables and never mixes currencies', () => {
    render(<MetricasTab />);
    expect(screen.getByTestId('chart-estados')).toBeInTheDocument();
    expect(screen.getByTestId('chart-ciclos')).toBeInTheDocument();
    expect(screen.getByTestId('chart-estimado-COP')).toBeInTheDocument();
    expect(screen.getByTestId('chart-estimado-USD')).toBeInTheDocument();
    const estados = screen.getByRole('table', { name: 'Requisiciones por estado, tabla equivalente' });
    expect(within(estados).getByText('Cerrada')).toBeInTheDocument();
    // States with zero requisiciones are left out.
    expect(within(estados).queryByText('Borrador')).not.toBeInTheDocument();
    const ciclos = screen.getByRole('table', { name: 'Tiempos de ciclo (mediana y P90), tabla equivalente' });
    expect(within(ciclos).getByText('Envío → aprobación (n=8)')).toBeInTheDocument();
    expect(within(ciclos).getByText('3,5 h')).toBeInTheDocument();
    expect(within(ciclos).getByText('4,2 d')).toBeInTheDocument();
    // Stages without data are not drawn.
    expect(within(ciclos).queryByText(/Aprobación → adjudicación/)).not.toBeInTheDocument();
  });

  it('lists top suppliers and areas grouped by currency', () => {
    render(<MetricasTab />);
    expect(screen.getByRole('table', { name: 'Principales proveedores en COP' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Principales proveedores en USD' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Principales áreas en COP' })).toBeInTheDocument();
    expect(screen.getByText('Proveedor Uno')).toBeInTheDocument();
  });

  it('shows the empty state when there are no requisiciones in the period', () => {
    setResult({ data: { data: { ...metricas, total: 0, porEstado: [], valorComprado: [], estimadoVsReal: [], topProveedores: [], topAreas: [] } } });
    render(<MetricasTab />);
    expect(screen.getByTestId('metricas-vacio')).toBeInTheDocument();
    expect(screen.queryByTestId('chart-estados')).not.toBeInTheDocument();
  });

  it('shows the loading state', () => {
    setResult({ data: undefined, isLoading: true });
    render(<MetricasTab />);
    expect(screen.getByLabelText('Cargando métricas')).toBeInTheDocument();
  });

  it('maps the slow-report error to Spanish', () => {
    setResult({ data: undefined, isError: true, error: { response: { data: { error: { code: 'REPORTE_LENTO' } } } } });
    render(<MetricasTab />);
    expect(screen.getByText(/El reporte tardó demasiado/)).toBeInTheDocument();
  });

  it('applies the filters and blocks an inverted range', () => {
    render(<MetricasTab />);
    fireEvent.change(screen.getByLabelText('Métricas desde'), { target: { value: '2026-10-10' } });
    fireEvent.change(screen.getByLabelText('Métricas hasta'), { target: { value: '2026-10-01' } });
    expect(screen.getByRole('alert')).toHaveTextContent('no puede ser posterior');
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Métricas hasta'), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText('Métricas por área'), { target: { value: 'a1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(mocks.useGetMetricas).toHaveBeenLastCalledWith(
      expect.objectContaining({ desde: '2026-10-10', hasta: '2026-10-20', areaId: 'a1' })
    );
  });
});
