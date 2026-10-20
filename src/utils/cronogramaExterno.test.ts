import { describe, it, expect } from 'vitest';
import {
  mesApiToMes, etiquetaTipo, formatearFechaUtc, textoVencimiento, describirCadena,
  abreviaturaTipo, filasEquipo, estadoMesPreventivo, estadoMesExterno,
} from './cronogramaExterno';
import type { CronogramaActividadExterna, CronogramaEquipo } from '@/types/cronograma.types';

const cadena = (over: Partial<CronogramaActividadExterna> = {}): CronogramaActividadExterna => ({
  cadenaId: 'c1', equipoId: 'e1', clienteId: 'cli1', tipo: 'calibracion', tipoCustom: null, frecuenciaMeses: 6,
  fechaProxima: '2026-03-10T00:00:00.000Z', meses: ['mar', 'sep'], realizadas: [], vencida: false, diasParaVencer: 20,
  proveedor: 'ACME', proveedorId: null,
  equipo: { nombre: 'Monitor', marca: 'GE', modelo: 'B20', serie: 'S1', inventario: null, ubicacion: null },
  cliente: { razonsocial: 'Hospital' },
  ...over,
});

describe('mesApiToMes', () => {
  it('converts the API format to the grid format', () => {
    expect(mesApiToMes('ene')).toBe('Ene');
    expect(mesApiToMes('dic')).toBe('Dic');
    expect(mesApiToMes('SEP')).toBe('Sep');
  });
  it('returns null for anything else', () => {
    expect(mesApiToMes('enero')).toBeNull();
    expect(mesApiToMes('')).toBeNull();
  });
});

describe('etiquetaTipo', () => {
  it('uses the catalog label', () => {
    expect(etiquetaTipo(cadena())).toBe('Calibración');
  });
  it('uses the custom text for "otro"', () => {
    expect(etiquetaTipo(cadena({ tipo: 'otro', tipoCustom: 'Trazabilidad' }))).toBe('Trazabilidad');
  });
  it('falls back to the raw type when unknown', () => {
    expect(etiquetaTipo({ tipo: 'otro', tipoCustom: null })).toBe('Otro');
  });
});

describe('formatearFechaUtc', () => {
  it('shows the UTC day, not the previous local day', () => {
    expect(formatearFechaUtc('2026-03-10T00:00:00.000Z')).toBe('10/03/2026');
  });
});

describe('textoVencimiento', () => {
  it('overdue', () => {
    expect(textoVencimiento({ vencida: true, diasParaVencer: -10 })).toBe('Vencida hace 10 días');
    expect(textoVencimiento({ vencida: true, diasParaVencer: -1 })).toBe('Vencida hace 1 día');
  });
  it('upcoming', () => {
    expect(textoVencimiento({ vencida: false, diasParaVencer: 20 })).toBe('Vence en 20 días');
    expect(textoVencimiento({ vencida: false, diasParaVencer: 1 })).toBe('Vence en 1 día');
    expect(textoVencimiento({ vencida: false, diasParaVencer: 0 })).toBe('Vence hoy');
  });
  it('unknown', () => {
    expect(textoVencimiento({ vencida: false, diasParaVencer: null })).toBe('');
  });
});

describe('describirCadena', () => {
  it('lists type, date, status and provider', () => {
    expect(describirCadena(cadena())).toEqual([
      'Calibración — próxima: 10/03/2026',
      'Vence en 20 días',
      'Proveedor: ACME',
    ]);
  });
  it('omits the provider line when there is none', () => {
    expect(describirCadena(cadena({ proveedor: null }))).toHaveLength(2);
  });
});

describe('abreviaturaTipo', () => {
  it('uses the short label of each type', () => {
    expect(abreviaturaTipo({ tipo: 'calibracion', tipoCustom: null })).toBe('Cal');
    expect(abreviaturaTipo({ tipo: 'verificacion', tipoCustom: null })).toBe('Ver');
    expect(abreviaturaTipo({ tipo: 'inspeccion_tecnica', tipoCustom: null })).toBe('Ins');
  });
  it('uses the first letters of the custom text for "otro"', () => {
    expect(abreviaturaTipo({ tipo: 'otro', tipoCustom: 'Trazabilidad' })).toBe('Tra');
    expect(abreviaturaTipo({ tipo: 'otro', tipoCustom: null })).toBe('Otr');
  });
});

const equipo = (over: Partial<CronogramaEquipo> = {}): CronogramaEquipo => ({
  _id: 'e1', mesesMtto: ['Mar', 'Jun'], cadenas: [], ...over,
});

describe('filasEquipo', () => {
  it('equipment with preventive months and no chains has one MP row', () => {
    const filas = filasEquipo(equipo());
    expect(filas.map((f) => f.etiqueta)).toEqual(['MP']);
  });
  it('adds one row per chain after MP', () => {
    const filas = filasEquipo(equipo({ cadenas: [cadena(), cadena({ cadenaId: 'c2', tipo: 'verificacion' })] }));
    expect(filas.map((f) => f.etiqueta)).toEqual(['MP', 'Cal', 'Ver']);
    expect(filas[1].cadena?.cadenaId).toBe('c1');
  });
  it('without preventive months the MP row is omitted when there are chains', () => {
    const filas = filasEquipo(equipo({ mesesMtto: undefined, cadenas: [cadena()] }));
    expect(filas.map((f) => f.etiqueta)).toEqual(['Cal']);
  });
  it('equipment without any activity keeps one row so it is still listed', () => {
    const filas = filasEquipo(equipo({ mesesMtto: undefined, cadenas: [] }));
    expect(filas).toHaveLength(1);
    expect(filas[0].tipo).toBe('mp');
  });
  it('origen "preventivo" hides the chain rows and "externo" hides MP', () => {
    const e = equipo({ cadenas: [cadena()] });
    expect(filasEquipo(e, 'preventivo').map((f) => f.etiqueta)).toEqual(['MP']);
    expect(filasEquipo(e, 'externo').map((f) => f.etiqueta)).toEqual(['Cal']);
  });
  it('row keys are unique', () => {
    const filas = filasEquipo(equipo({ cadenas: [cadena(), cadena({ cadenaId: 'c2' })] }));
    expect(new Set(filas.map((f) => f.key)).size).toBe(filas.length);
  });
});

describe('estadoMesPreventivo', () => {
  const e = equipo({ mesesRealizados: [{ mes: 'mar', fecha: '2026-03-12T00:00:00.000Z' }] });
  it('green when a report of that month exists in the year', () => {
    expect(estadoMesPreventivo(e, 'Mar', 2026)).toBe('realizado');
  });
  it('gray when scheduled and not done', () => {
    expect(estadoMesPreventivo(e, 'Jun', 2026)).toBe('programado');
  });
  it('nothing when not scheduled and not done', () => {
    expect(estadoMesPreventivo(e, 'Ene', 2026)).toBeNull();
  });
  it('a report of another year does not count', () => {
    expect(estadoMesPreventivo(e, 'Mar', 2027)).toBe('programado');
    expect(estadoMesPreventivo(equipo({ mesesRealizados: [{ mes: 'mar', fecha: '2025-03-12T00:00:00.000Z' }] }), 'Mar', 2026)).toBe('programado');
  });
  it('a done month that was not scheduled is still green', () => {
    expect(estadoMesPreventivo(equipo({ mesesMtto: [], mesesRealizados: [{ mes: 'ago', fecha: '2026-08-01T00:00:00.000Z' }] }), 'Ago', 2026)).toBe('realizado');
  });
  it('a report without a date never counts', () => {
    expect(estadoMesPreventivo(equipo({ mesesRealizados: [{ mes: 'mar' }] }), 'Mar', 2026)).toBe('programado');
  });
});

describe('estadoMesExterno', () => {
  const ahora = new Date('2026-10-20T15:00:00Z');
  const c = cadena({ meses: ['abr', 'oct'], realizadas: [{ mes: 'abr', fecha: '2026-04-10T00:00:00.000Z' }], vencida: true, diasParaVencer: -10 });
  it('green when an activity was registered that month', () => {
    expect(estadoMesExterno(c, 'Abr', 2026, ahora)).toBe('realizado');
  });
  it('red when scheduled, not done and the month is over', () => {
    expect(estadoMesExterno(cadena({ meses: ['jun'], vencida: true }), 'Jun', 2026, ahora)).toBe('vencido');
  });
  it('red in the current month only when the chain is overdue', () => {
    expect(estadoMesExterno(c, 'Oct', 2026, ahora)).toBe('vencido');
    expect(estadoMesExterno({ ...c, vencida: false }, 'Oct', 2026, ahora)).toBe('programado');
  });
  it('gray for future scheduled months', () => {
    expect(estadoMesExterno(cadena({ meses: ['dic'] }), 'Dic', 2026, ahora)).toBe('programado');
  });
  it('nothing for months that are not scheduled', () => {
    expect(estadoMesExterno(c, 'Feb', 2026, ahora)).toBeNull();
  });
  it('a past year without activity is red, a future year is gray', () => {
    expect(estadoMesExterno(cadena({ meses: ['dic'] }), 'Dic', 2025, ahora)).toBe('vencido');
    expect(estadoMesExterno(cadena({ meses: ['ene'] }), 'Ene', 2027, ahora)).toBe('programado');
  });
});
