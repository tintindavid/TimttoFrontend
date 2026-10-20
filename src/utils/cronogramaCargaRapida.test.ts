import { describe, it, expect } from 'vitest';
import { diaLocal, fechaInicialDeCelda, hayActividadPosterior, puedeCargarCelda } from './cronogramaCargaRapida';
import type { CronogramaActividadExterna } from '@/types/cronograma.types';

// Local dates on purpose: the helpers work with the user's calendar day.
const hoy = new Date(2026, 5, 15, 10, 0, 0); // 15 June 2026

describe('puedeCargarCelda', () => {
  it('only cells that are due can be loaded', () => {
    expect(puedeCargarCelda('programado', 'Mar', 2026, hoy)).toBe(true);
    expect(puedeCargarCelda('vencido', 'Mar', 2026, hoy)).toBe(true);
    expect(puedeCargarCelda('realizado', 'Mar', 2026, hoy)).toBe(false);
    expect(puedeCargarCelda(null, 'Mar', 2026, hoy)).toBe(false);
  });

  it('the current year allows up to the current month, included, and no later month', () => {
    expect(puedeCargarCelda('programado', 'Jun', 2026, hoy)).toBe(true);
    expect(puedeCargarCelda('programado', 'Jul', 2026, hoy)).toBe(false);
    expect(puedeCargarCelda('vencido', 'Dic', 2026, hoy)).toBe(false);
    expect(puedeCargarCelda('programado', 'Ene', 2026, hoy)).toBe(true);
  });

  it('a past year allows every month and a future year none', () => {
    expect(puedeCargarCelda('vencido', 'Dic', 2025, hoy)).toBe(true);
    expect(puedeCargarCelda('programado', 'Ene', 2027, hoy)).toBe(false);
  });

  it('the boundaries of the year: December of the current year, January of the next', () => {
    const fin = new Date(2026, 11, 31, 23, 0, 0);
    expect(puedeCargarCelda('programado', 'Dic', 2026, fin)).toBe(true);
    expect(puedeCargarCelda('programado', 'Ene', 2027, fin)).toBe(false);
    const inicio = new Date(2026, 0, 1, 8, 0, 0);
    expect(puedeCargarCelda('programado', 'Ene', 2026, inicio)).toBe(true);
    expect(puedeCargarCelda('programado', 'Feb', 2026, inicio)).toBe(false);
  });
});

describe('fechaInicialDeCelda', () => {
  it('is the last day of the month of the cell when that month is over', () => {
    expect(fechaInicialDeCelda('Mar', 2026, hoy)).toBe('2026-03-31');
    expect(fechaInicialDeCelda('Feb', 2026, hoy)).toBe('2026-02-28');
    expect(fechaInicialDeCelda('Feb', 2024, hoy)).toBe('2024-02-29');
    expect(fechaInicialDeCelda('Dic', 2025, hoy)).toBe('2025-12-31');
  });

  it('is today when the month of the cell is the current one (never in the future)', () => {
    expect(fechaInicialDeCelda('Jun', 2026, hoy)).toBe('2026-06-15');
  });

  it('diaLocal formats the local calendar day with zero padding', () => {
    expect(diaLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('puedeCargarCelda by kind of row', () => {
  const mp = { tipo: 'mp' as const };
  const externa = (realizadas: { mes: string; fecha: string }[] = []) =>
    ({ tipo: 'externa' as const, cadena: { realizadas } as unknown as CronogramaActividadExterna });

  it('preventive: only the current year (the backend does not mark a month for a service of another year)', () => {
    expect(puedeCargarCelda('vencido', 'Mar', 2026, hoy, mp)).toBe(true);
    expect(puedeCargarCelda('vencido', 'Mar', 2025, hoy, mp)).toBe(false);
    expect(puedeCargarCelda('programado', 'Ene', 2027, hoy, mp)).toBe(false);
  });

  it('external: a past year is allowed (its months are computed per year)', () => {
    expect(puedeCargarCelda('vencido', 'Mar', 2025, hoy, externa())).toBe(true);
  });

  it('external: not a month before the latest activity registered in the chain', () => {
    const conMayo = externa([{ mes: 'may', fecha: '2026-05-10T00:00:00.000Z' }]);
    expect(puedeCargarCelda('vencido', 'Mar', 2026, hoy, conMayo)).toBe(false);
    expect(puedeCargarCelda('vencido', 'May', 2026, hoy, conMayo)).toBe(true); // same month: the backend compares dates
    expect(puedeCargarCelda('programado', 'Jun', 2026, hoy, conMayo)).toBe(true);
  });

  it('without the row (old callers) the rule is the one by state, year and month only', () => {
    expect(puedeCargarCelda('vencido', 'Mar', 2025, hoy)).toBe(true);
  });
});

describe('hayActividadPosterior', () => {
  it('compares months, ignores a missing chain and unknown month names', () => {
    const cadena = { realizadas: [{ mes: 'jun', fecha: 'x' }, { mes: 'zzz', fecha: 'x' }] } as unknown as CronogramaActividadExterna;
    expect(hayActividadPosterior(cadena, 'Mar')).toBe(true);
    expect(hayActividadPosterior(cadena, 'Jun')).toBe(false);
    expect(hayActividadPosterior(cadena, 'Dic')).toBe(false);
    expect(hayActividadPosterior(undefined, 'Mar')).toBe(false);
  });
});
