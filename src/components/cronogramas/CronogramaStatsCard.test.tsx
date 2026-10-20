import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CronogramaStatsCard } from './CronogramaStatsCard';
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
