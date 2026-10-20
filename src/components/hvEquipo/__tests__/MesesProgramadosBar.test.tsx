import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MesesProgramadosBar from '../MesesProgramadosBar';

const badges = () => screen.getAllByTestId('mes-programado');
const byMes = (mes: string) => badges().find((b) => b.getAttribute('data-mes') === mes) as HTMLElement;

describe('MesesProgramadosBar', () => {
  it('lists the twelve months in a row', () => {
    render(<MesesProgramadosBar meses={['mar', 'sep']} />);
    expect(badges().map((b) => b.getAttribute('data-mes'))).toEqual(['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']);
    expect(badges().map((b) => b.textContent?.replace(' ✓', ''))).toEqual(['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']);
  });

  it('marks the scheduled months and no others', () => {
    render(<MesesProgramadosBar meses={['mar', 'sep']} />);
    expect(byMes('mar').getAttribute('data-estado')).toBe('programado');
    expect(byMes('sep').getAttribute('data-estado')).toBe('programado');
    expect(byMes('ene').getAttribute('data-estado')).toBe('libre');
    expect(badges().filter((b) => b.getAttribute('data-estado') === 'programado')).toHaveLength(2);
  });

  it('accepts the months in any letter case', () => {
    render(<MesesProgramadosBar meses={['Mar', ' SEP ']} />);
    expect(byMes('mar').getAttribute('data-estado')).toBe('programado');
    expect(byMes('sep').getAttribute('data-estado')).toBe('programado');
  });

  it('shows as done the scheduled months that have a report in the year of the selected date', () => {
    render(
      <MesesProgramadosBar
        meses={['mar', 'sep']}
        realizados={[{ mes: 'mar', fecha: '2026-03-12T00:00:00.000Z' }, { mes: 'sep', fecha: '2025-09-02T00:00:00.000Z' }]}
        fecha="2026-05-10"
      />,
    );
    expect(byMes('mar').getAttribute('data-estado')).toBe('hecho');
    expect(byMes('mar').textContent).toContain('✓');
    expect(byMes('sep').getAttribute('data-estado')).toBe('programado'); // done in 2025, not in 2026
  });

  it('outlines the month of the selected date', () => {
    render(<MesesProgramadosBar meses={['mar']} fecha="2026-06-15" />);
    expect(byMes('jun').getAttribute('data-seleccionado')).toBe('true');
    expect(badges().filter((b) => b.getAttribute('data-seleccionado') === 'true')).toHaveLength(1);
  });

  it('without a date nothing is outlined and no month is shown as done', () => {
    render(<MesesProgramadosBar meses={['mar']} realizados={[{ mes: 'mar', fecha: '2026-03-12T00:00:00.000Z' }]} />);
    expect(badges().filter((b) => b.getAttribute('data-seleccionado') === 'true')).toHaveLength(0);
    expect(byMes('mar').getAttribute('data-estado')).toBe('programado');
  });

  it('says so when the equipment has no scheduled months', () => {
    render(<MesesProgramadosBar meses={[]} />);
    expect(screen.queryAllByTestId('mes-programado')).toHaveLength(0);
    expect(screen.getByText('Este equipo no tiene meses de mantenimiento programados.')).toBeInTheDocument();
  });

  it('copes with missing props', () => {
    render(<MesesProgramadosBar />);
    expect(screen.getByTestId('barra-meses')).toBeInTheDocument();
  });
});
