import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PublicActividadesExternasTab from '../PublicActividadesExternasTab';
import type { PublicActividadExterna } from '@/types/equipmentQr.types';

const act = (over: Partial<PublicActividadExterna> = {}): PublicActividadExterna => ({
  tipo: 'calibracion',
  fecha: '2026-10-17T00:00:00.000Z',
  proveedor: 'Biolab',
  consecutivoDocumento: 'CAL-1',
  resultado: 'aprobada',
  estadoOperativo: 'En Mantenimiento',
  tieneEvidencia: true,
  proximaFecha: '2027-10-17T00:00:00.000Z',
  ...over,
});

describe('PublicActividadesExternasTab', () => {
  it('shows an empty state when there are no activities', () => {
    render(<PublicActividadesExternasTab actividades={[]} />);
    expect(screen.getByText(/Aún no hay actividades externas/)).toBeInTheDocument();
  });

  it('renders type with document number, provider, result, state, evidence and next date', () => {
    render(<PublicActividadesExternasTab actividades={[act()]} />);
    expect(screen.getByText('Calibración CAL-1')).toBeInTheDocument();
    expect(screen.getByText('Biolab')).toBeInTheDocument();
    expect(screen.getByText('Aprobada')).toBeInTheDocument();
    expect(screen.getByText('En Mantenimiento')).toBeInTheDocument();
    expect(screen.getByText('Con evidencia')).toBeInTheDocument();
    expect(screen.getByText(/Próxima:/)).toBeInTheDocument();
  });

  it('formats the calendar day in UTC (no day slip)', () => {
    render(<PublicActividadesExternasTab actividades={[act({ fecha: '2026-10-17T00:00:00.000Z', proximaFecha: null })]} />);
    expect(screen.getByText(/17 de octubre de 2026/)).toBeInTheDocument();
  });

  it('uses the free text for type "otro" and for a custom result', () => {
    render(
      <PublicActividadesExternasTab
        actividades={[act({ tipo: 'otro', tipoCustom: 'Tomografía', consecutivoDocumento: null, resultado: 'Con reserva' })]}
      />,
    );
    expect(screen.getByText('Tomografía')).toBeInTheDocument();
    expect(screen.getByText('Con reserva')).toBeInTheDocument();
  });

  it('hides the optional pieces when absent', () => {
    render(
      <PublicActividadesExternasTab
        actividades={[act({ proveedor: null, estadoOperativo: null, tieneEvidencia: false, proximaFecha: null, resultado: null })]}
      />,
    );
    expect(screen.getByText('Proveedor no registrado')).toBeInTheDocument();
    expect(screen.queryByText('Con evidencia')).toBeNull();
    expect(screen.queryByText(/Próxima:/)).toBeNull();
  });
});
