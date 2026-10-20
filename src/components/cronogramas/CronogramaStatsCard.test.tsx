import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CronogramaStatsCard, tarjetasPorFila } from './CronogramaStatsCard';
import { MESES } from '@/types/cronograma.types';
import type { CronogramaStats, Mes } from '@/types/cronograma.types';

const porMes = (valores: Partial<Record<Mes, number>>) =>
  MESES.reduce((acc, mes) => ({ ...acc, [mes]: valores[mes] ?? 0 }), {} as Record<Mes, number>);

const base: CronogramaStats = {
  totalEquipos: 10, equiposVisibles: 8, equiposSeleccionados: 2, equiposVisiblesSeleccionados: 1,
  equiposPorMes: porMes({ Mar: 3, Jun: 2 }),
};

describe('CronogramaStatsCard', () => {
  it('without external data it only shows the original cards', () => {
    render(<CronogramaStatsCard stats={base} />);
    expect(screen.getByText('Total Equipos')).toBeInTheDocument();
    expect(screen.queryByTestId('stats-externas')).toBeNull();
  });

  it('with external data it splits preventive from external and shows overdue and due soon', () => {
    render(
      <CronogramaStatsCard
        stats={{ ...base, equiposPorMesExterno: porMes({ Mar: 1, Sep: 4 }), externasVencidas: 3, externasPorVencer: 2 }}
      />,
    );
    expect(screen.getByTestId('stats-externas')).toBeInTheDocument();
    expect(screen.getByText('Programaciones preventivas').parentElement).toHaveTextContent('5');
    expect(screen.getByText('Programaciones externas').parentElement).toHaveTextContent('5');
    expect(screen.getByTestId('externas-vencidas')).toHaveTextContent('3');
    expect(screen.getByTestId('externas-por-vencer')).toHaveTextContent('2');
  });

  it('shows zeros when there is nothing overdue', () => {
    render(<CronogramaStatsCard stats={{ ...base, equiposPorMesExterno: porMes({}), externasVencidas: 0, externasPorVencer: 0 }} />);
    expect(screen.getByTestId('externas-vencidas')).toHaveTextContent('0');
  });
});

describe('CronogramaStatsCard - selection figures', () => {
  it('shows "Equipos Seleccionados" and "Visibles Selecc." by default', () => {
    render(<CronogramaStatsCard stats={base} />);
    expect(screen.getByText('Equipos Seleccionados')).toBeInTheDocument();
    expect(screen.getByText('Visibles Selecc.')).toBeInTheDocument();
  });

  it('hides both when equipment can not be selected, keeping the other figures', () => {
    render(<CronogramaStatsCard stats={base} mostrarSeleccion={false} />);
    expect(screen.queryByText('Equipos Seleccionados')).toBeNull();
    expect(screen.queryByText('Visibles Selecc.')).toBeNull();
    expect(screen.getByText('Total Equipos')).toBeInTheDocument();
    expect(screen.getByText('Equipos Filtrados')).toBeInTheDocument();
  });

  it('hiding the selection does not touch the external figures', () => {
    render(<CronogramaStatsCard stats={{ ...base, equiposPorMesExterno: porMes({ Mar: 1 }), externasVencidas: 2, externasPorVencer: 0 }} mostrarSeleccion={false} />);
    expect(screen.getByTestId('stats-externas')).toBeInTheDocument();
    expect(screen.getByTestId('externas-vencidas').textContent).toBe('2');
    expect(screen.queryByText('Equipos Seleccionados')).toBeNull();
  });
});

describe('CronogramaStatsCard - the cards share the width without gaps', () => {
  const externos = { equiposPorMesExterno: porMes({ Mar: 1 }), externasVencidas: 1, externasPorVencer: 0 };
  const columnas = (container: HTMLElement) => Array.from(container.querySelectorAll('[data-testid="stats-cards"] > div'));
  const anchos = (container: HTMLElement) => new Set(columnas(container).map((c) => c.className.match(/col-md-(\d+)/)?.[1]));

  it('tarjetasPorFila never leaves an incomplete row', () => {
    expect([1, 2, 3, 4].map(tarjetasPorFila)).toEqual([1, 2, 3, 4]);
    expect(tarjetasPorFila(6)).toBe(3); // 3 + 3
    expect(tarjetasPorFila(8)).toBe(4); // 4 + 4
    expect(tarjetasPorFila(5)).toBe(4);
    expect(tarjetasPorFila(0)).toBe(1);
    for (const n of [2, 4, 6, 8]) expect(n % tarjetasPorFila(n)).toBe(0);
  });

  it('the four basic cards fill one row', () => {
    const { container } = render(<CronogramaStatsCard stats={base} />);
    expect(columnas(container)).toHaveLength(4);
    expect(anchos(container)).toEqual(new Set(['3']));
  });

  it('without the selection the two remaining cards take half the row each', () => {
    const { container } = render(<CronogramaStatsCard stats={base} mostrarSeleccion={false} />);
    expect(columnas(container)).toHaveLength(2);
    expect(anchos(container)).toEqual(new Set(['6']));
  });

  it('without the selection but with the external figures: six cards in two rows of three, no gap', () => {
    const { container } = render(<CronogramaStatsCard stats={{ ...base, ...externos }} mostrarSeleccion={false} />);
    expect(columnas(container)).toHaveLength(6);
    expect(anchos(container)).toEqual(new Set(['4']));
    expect(screen.queryByText('Equipos Seleccionados')).toBeNull();
    expect(screen.getByTestId('stats-externas')).toBeInTheDocument();
  });

  it('with everything: eight cards in two rows of four', () => {
    const { container } = render(<CronogramaStatsCard stats={{ ...base, ...externos }} />);
    expect(columnas(container)).toHaveLength(8);
    expect(anchos(container)).toEqual(new Set(['3']));
  });

  it('with the selection and without external figures it keeps the original four', () => {
    const { container } = render(<CronogramaStatsCard stats={{ ...base, ...externos }} mostrarExternas={false} />);
    expect(columnas(container)).toHaveLength(4);
    expect(screen.queryByTestId('stats-externas')).toBeNull();
  });
});
