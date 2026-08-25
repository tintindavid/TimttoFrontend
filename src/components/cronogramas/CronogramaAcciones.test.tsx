import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CronogramaAcciones } from './CronogramaAcciones';

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
