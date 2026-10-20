import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CronogramaFiltros } from './CronogramaFiltros';

const baseProps = {
  sedesSeleccionadas: [], serviciosSeleccionados: [], ubicacionesSeleccionadas: [], mesesSeleccionados: [],
  searchText: '', sedesOptions: [], serviciosOptions: [], ubicacionesOptions: [],
  onSedesChange: vi.fn(), onServiciosChange: vi.fn(), onUbicacionesChange: vi.fn(), onMesesChange: vi.fn(),
  onSearchChange: vi.fn(), onLimpiar: vi.fn(),
};

describe('CronogramaFiltros - Origen', () => {
  it('does not render the selector when no handler is given', () => {
    render(<CronogramaFiltros {...baseProps} />);
    expect(screen.queryByLabelText('Origen')).toBeNull();
  });

  it('renders the three options and reports the change', () => {
    const onOrigenChange = vi.fn();
    render(<CronogramaFiltros {...baseProps} origenSeleccionado="todos" onOrigenChange={onOrigenChange} />);
    const select = screen.getByLabelText('Origen') as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['todos', 'preventivo', 'externo']);
    fireEvent.change(select, { target: { value: 'externo' } });
    expect(onOrigenChange).toHaveBeenCalledWith('externo');
  });

  it('counts a non-default origin as an active filter', () => {
    render(<CronogramaFiltros {...baseProps} origenSeleccionado="externo" onOrigenChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Limpiar filtros \(1\)/ })).toBeInTheDocument();
  });

  it('the default origin does not count as a filter', () => {
    render(<CronogramaFiltros {...baseProps} origenSeleccionado="todos" onOrigenChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Limpiar filtros/ })).toBeNull();
  });
});
