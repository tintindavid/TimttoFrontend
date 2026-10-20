import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CronogramaAcciones } from './CronogramaAcciones';

let ejecutaServicios = true;
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({ can: (c: string) => (c === 'executesServices' ? ejecutaServicios : true) }),
}));

const renderComponent = (overrides: Partial<React.ComponentProps<typeof CronogramaAcciones>> = {}) =>
  render(
    <CronogramaAcciones
      equiposSeleccionados={0}
      todosVisiblesSeleccionados={false}
      onImprimir={vi.fn()}
      onCrearOT={vi.fn()}
      onToggleTodosVisibles={vi.fn()}
      onLimpiarSeleccion={vi.fn()}
      {...overrides}
    />
  );

describe('CronogramaAcciones — "Imprimir Visible" tooltip', () => {
  it('shows the disclaimer tooltip on hover', async () => {
    renderComponent();
    fireEvent.mouseOver(screen.getByRole('button', { name: /imprimir visible/i }));
    await waitFor(() =>
      expect(
        screen.getByText('Descarga solo los equipos actualmente filtrados/visibles en el cronograma')
      ).toBeInTheDocument()
    );
  });

  it('calls onImprimir when clicked (caller decides whether that opens a modal)', () => {
    const onImprimir = vi.fn();
    renderComponent({ onImprimir });
    fireEvent.click(screen.getByRole('button', { name: /imprimir visible/i }));
    expect(onImprimir).toHaveBeenCalledTimes(1);
  });
});

describe('CronogramaAcciones — selection only exists to create work orders', () => {
  it('a tenant that can create work orders sees "Seleccionar todos", "Limpiar Selección" and "Crear OT"', () => {
    ejecutaServicios = true;
    renderComponent({ equiposSeleccionados: 2 });
    expect(screen.getByLabelText('Seleccionar todos los visibles')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Limpiar Selección/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear OT \(2\)/ })).toBeInTheDocument();
  });

  it('a tenant that can not create work orders sees none of them, but keeps "Imprimir Visible"', () => {
    ejecutaServicios = false;
    renderComponent({ equiposSeleccionados: 2 });
    expect(screen.queryByLabelText('Seleccionar todos los visibles')).toBeNull();
    expect(screen.queryByRole('button', { name: /Limpiar Selección/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Crear OT/ })).toBeNull();
    expect(screen.getByRole('button', { name: /imprimir visible/i })).toBeInTheDocument();
    ejecutaServicios = true;
  });

  it('mostrarCrearOT=false hides the selection too', () => {
    ejecutaServicios = true;
    renderComponent({ mostrarCrearOT: false });
    expect(screen.queryByLabelText('Seleccionar todos los visibles')).toBeNull();
  });
});
