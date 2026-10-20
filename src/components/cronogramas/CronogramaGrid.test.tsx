import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { CronogramaGrid } from './CronogramaGrid';
import type { CronogramaActividadExterna, CronogramaEquipo, GrupoServicioSede } from '@/types/cronograma.types';

const AHORA = new Date().getUTCFullYear();

const cadena = (over: Partial<CronogramaActividadExterna> = {}): CronogramaActividadExterna => ({
  cadenaId: 'c1', equipoId: 'e1', clienteId: 'cli', tipo: 'calibracion', tipoCustom: null, frecuenciaMeses: 12,
  fechaProxima: `${AHORA + 1}-03-10T00:00:00.000Z`, meses: ['mar'], realizadas: [], vencida: false, diasParaVencer: 200,
  proveedor: 'ACME', proveedorId: null,
  equipo: { nombre: 'Monitor', marca: null, modelo: null, serie: null, inventario: null, ubicacion: null },
  cliente: null,
  ...over,
});

const equipo = (over: Partial<CronogramaEquipo> = {}): CronogramaEquipo => ({
  _id: 'e1', Marca: 'GE', Modelo: 'B20', Serie: 'S1', Estado: 'Activo', ItemId: { _id: 'i', Nombre: 'Monitor' },
  mesesMtto: ['Mar', 'Jun'], cadenas: [], ...over,
});

const grupos = (e: CronogramaEquipo): GrupoServicioSede[] => [{ servicio: 'UCI', sede: 'Principal', equipos: [e] }];

const renderGrid = (e: CronogramaEquipo, props: Partial<React.ComponentProps<typeof CronogramaGrid>> = {}) =>
  render(
    <CronogramaGrid
      grupos={grupos(e)}
      equiposSeleccionados={[]}
      onToggleEquipo={vi.fn()}
      onEditEquipo={vi.fn()}
      anio={AHORA}
      {...props}
    />,
  );

const celdas = (fila: HTMLElement) => Array.from(fila.querySelectorAll('td.mes-cell')) as HTMLElement[];

describe('CronogramaGrid - one row per activity', () => {
  it('has an Act column right after Edit', () => {
    const { container } = renderGrid(equipo());
    const headers = Array.from(container.querySelectorAll('thead th')).map((th) => th.textContent?.trim());
    expect(headers.indexOf('Act')).toBe(headers.indexOf('Edit') + 1);
    expect(headers.slice(headers.indexOf('Act') + 1)).toHaveLength(12);
  });

  it('renders MP plus one row per external chain, labelled in Act', () => {
    renderGrid(equipo({ cadenas: [cadena(), cadena({ cadenaId: 'c2', tipo: 'verificacion', meses: ['jun'] })] }));
    expect(screen.getAllByTestId('fila-actividad')).toHaveLength(3);
    expect(screen.getAllByTestId('etiqueta-actividad').map((b) => b.textContent)).toEqual(['MP', 'Cal', 'Ver']);
  });

  it('the equipment columns appear once and span all the rows of the block', () => {
    const { container } = renderGrid(equipo({ cadenas: [cadena(), cadena({ cadenaId: 'c2', tipo: 'verificacion' })] }));
    expect(screen.getAllByText('GE')).toHaveLength(1);
    const spans = Array.from(container.querySelectorAll('td[rowspan]')).map((td) => td.getAttribute('rowspan'));
    expect(spans.length).toBeGreaterThan(0);
    expect(new Set(spans)).toEqual(new Set(['3']));
  });

  it('equipment with only external activities has no MP row', () => {
    renderGrid(equipo({ mesesMtto: undefined, cadenas: [cadena()] }));
    expect(screen.getAllByTestId('etiqueta-actividad').map((b) => b.textContent)).toEqual(['Cal']);
  });

  it('equipment without activity is still listed with one row', () => {
    renderGrid(equipo({ mesesMtto: undefined, cadenas: [] }));
    expect(screen.getAllByTestId('fila-actividad')).toHaveLength(1);
  });

  it('origen "preventivo" shows only MP and "externo" only the chain rows', () => {
    const e = equipo({ cadenas: [cadena()] });
    const { unmount } = renderGrid(e, { origen: 'preventivo' });
    expect(screen.getAllByTestId('etiqueta-actividad').map((b) => b.textContent)).toEqual(['MP']);
    unmount();
    renderGrid(e, { origen: 'externo' });
    expect(screen.getAllByTestId('etiqueta-actividad').map((b) => b.textContent)).toEqual(['Cal']);
  });

  it('the selection checkbox and the edit button are shared by the block', () => {
    renderGrid(equipo({ cadenas: [cadena()] }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getAllByTitle('Editar equipo')).toHaveLength(1);
  });

  it('marks every row of a selected equipment', () => {
    renderGrid(equipo({ cadenas: [cadena()] }), { equiposSeleccionados: ['e1'] });
    screen.getAllByTestId('fila-actividad').forEach((fila) => expect(fila.className).toContain('table-active'));
  });
});

describe('CronogramaGrid - month states', () => {
  it('preventive: green with a report of the year, gray without it', () => {
    const e = equipo({ mesesRealizados: [{ mes: 'mar', fecha: `${AHORA}-03-12T00:00:00.000Z` }] });
    renderGrid(e, { origen: 'preventivo' });
    const [fila] = screen.getAllByTestId('fila-actividad');
    const cs = celdas(fila);
    expect(within(cs[2]).getByTestId('celda-estado').getAttribute('data-estado')).toBe('realizado');
    expect(within(cs[5]).getByTestId('celda-estado').getAttribute('data-estado')).toBe('programado');
    expect(within(cs[0]).queryByTestId('celda-estado')).toBeNull();
  });

  it('preventive: a report of another year leaves the month gray', () => {
    const e = equipo({ mesesRealizados: [{ mes: 'mar', fecha: `${AHORA - 1}-03-12T00:00:00.000Z` }] });
    renderGrid(e, { origen: 'preventivo' });
    const [fila] = screen.getAllByTestId('fila-actividad');
    expect(within(celdas(fila)[2]).getByTestId('celda-estado').getAttribute('data-estado')).toBe('programado');
  });

  it('preventive months not done are never red', () => {
    renderGrid(equipo({ mesesMtto: ['Ene'] }), { origen: 'preventivo', anio: AHORA - 1 });
    const [fila] = screen.getAllByTestId('fila-actividad');
    expect(within(celdas(fila)[0]).getByTestId('celda-estado').getAttribute('data-estado')).toBe('programado');
  });

  it('external: green when executed in the year', () => {
    const c = cadena({ meses: ['abr', 'oct'], realizadas: [{ mes: 'abr', fecha: `${AHORA}-04-10T00:00:00.000Z` }] });
    renderGrid(equipo({ mesesMtto: undefined, cadenas: [c] }));
    const [fila] = screen.getAllByTestId('fila-actividad');
    expect(within(celdas(fila)[3]).getByTestId('celda-estado').getAttribute('data-estado')).toBe('realizado');
  });

  it('external: a scheduled past month without activity is red in a past year', () => {
    renderGrid(equipo({ mesesMtto: undefined, cadenas: [cadena({ meses: ['mar'] })] }), { anio: AHORA - 1 });
    const [fila] = screen.getAllByTestId('fila-actividad');
    expect(within(celdas(fila)[2]).getByTestId('celda-estado').getAttribute('data-estado')).toBe('vencido');
  });

  it('external: a scheduled month of a future year is gray', () => {
    renderGrid(equipo({ mesesMtto: undefined, cadenas: [cadena({ meses: ['mar'] })] }), { anio: AHORA + 1 });
    const [fila] = screen.getAllByTestId('fila-actividad');
    expect(within(celdas(fila)[2]).getByTestId('celda-estado').getAttribute('data-estado')).toBe('programado');
  });

  it('shows no state in the months an activity is not scheduled', () => {
    renderGrid(equipo({ mesesMtto: undefined, cadenas: [cadena({ meses: ['mar'] })] }), { anio: AHORA + 1 });
    const [fila] = screen.getAllByTestId('fila-actividad');
    expect(within(fila).getAllByTestId('celda-estado')).toHaveLength(1);
  });

  it('the preventive and external rows of the same month are independent', () => {
    const e = equipo({ mesesMtto: ['Mar'], cadenas: [cadena({ meses: ['mar'] })] });
    renderGrid(e, { anio: AHORA + 1 });
    const filas = screen.getAllByTestId('fila-actividad');
    expect(filas).toHaveLength(2);
    expect(within(celdas(filas[0])[2]).getByTestId('celda-estado').getAttribute('data-fila')).toBe('mp');
    expect(within(celdas(filas[1])[2]).getByTestId('celda-estado').getAttribute('data-fila')).toBe('externa');
  });
});

describe('CronogramaGrid - empty', () => {
  it('shows the empty message without groups', () => {
    render(<CronogramaGrid grupos={[]} equiposSeleccionados={[]} onToggleEquipo={vi.fn()} />);
    expect(screen.getByText('No hay equipos para mostrar')).toBeInTheDocument();
  });
});

describe('CronogramaGrid - quick load (cronograma-carga-rapida)', () => {
  afterEach(() => { vi.useRealTimers(); });
  // 15 June of the year shown: March and June are due (past / current month), December is in the future
  const enJunio = () => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(AHORA, 5, 15, 10, 0, 0)); };

  it('without the callback no cell is a button (read-only grid, e.g. General)', () => {
    enJunio();
    renderGrid(equipo({ cadenas: [cadena({ meses: ['ene'] })] }));
    expect(screen.queryAllByTestId('celda-cargar')).toHaveLength(0);
    expect(screen.getAllByTestId('celda-estado').length).toBeGreaterThan(0);
  });

  it('a due cell is a button that reports the equipment, the row and the month', () => {
    enJunio();
    const onCargarCelda = vi.fn();
    const e = equipo({ mesesMtto: ['Mar'] });
    renderGrid(e, { onCargarCelda });
    const boton = screen.getByRole('button', { name: /Cargar Mantenimiento preventivo de Marzo/ });
    fireEvent.click(boton);
    expect(onCargarCelda).toHaveBeenCalledTimes(1);
    const celda = onCargarCelda.mock.calls[0][0];
    expect(celda.equipo._id).toBe('e1');
    expect(celda.fila.tipo).toBe('mp');
    expect(celda.mes).toBe('Mar');
    expect(within(boton).getByTestId('celda-estado')).toHaveAttribute('data-estado', 'programado');
  });

  it('the current month is clickable, a later month is not', () => {
    enJunio();
    renderGrid(equipo({ mesesMtto: ['Jun', 'Dic'] }), { onCargarCelda: vi.fn() });
    expect(screen.getByRole('button', { name: /Cargar Mantenimiento preventivo de Junio/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /de Diciembre/ })).toBeNull();
    expect(screen.getAllByTestId('celda-estado')).toHaveLength(2); // both cells still draw their state
  });

  it('a cell that is already done is a button that asks for its read-only summary, whatever the permission', () => {
    enJunio();
    const onCargarCelda = vi.fn();
    renderGrid(
      equipo({ mesesMtto: ['Mar'], mesesRealizados: [{ mes: 'mar', fecha: `${AHORA}-03-12T00:00:00.000Z` }] }),
      { onCargarCelda, puedeCargarFila: () => false },
    );
    const boton = screen.getByRole('button', { name: /Ver resumen de Mantenimiento preventivo de Marzo/ });
    expect(within(boton).getByTestId('celda-estado')).toHaveAttribute('data-estado', 'realizado');
    fireEvent.click(boton);
    expect(onCargarCelda.mock.calls[0][0].estado).toBe('realizado');
    expect(onCargarCelda.mock.calls[0][0].mes).toBe('Mar');
  });

  it('a done cell stays inert in a read-only grid (no callback)', () => {
    enJunio();
    renderGrid(equipo({ mesesMtto: ['Mar'], mesesRealizados: [{ mes: 'mar', fecha: `${AHORA}-03-12T00:00:00.000Z` }] }));
    expect(screen.queryAllByTestId('celda-cargar')).toHaveLength(0);
    expect(screen.getByTestId('celda-estado')).toHaveAttribute('data-estado', 'realizado');
  });

  it('a due cell reports its state so the page opens the form', () => {
    enJunio();
    const onCargarCelda = vi.fn();
    renderGrid(equipo({ mesesMtto: ['Mar'] }), { onCargarCelda });
    fireEvent.click(screen.getByRole('button', { name: /Cargar Mantenimiento preventivo de Marzo/ }));
    expect(onCargarCelda.mock.calls[0][0].estado).toBe('programado');
  });

  it('an overdue external cell is a button labelled with the activity', () => {
    enJunio();
    const onCargarCelda = vi.fn();
    renderGrid(equipo({ mesesMtto: [], cadenas: [cadena({ meses: ['ene'], vencida: true })] }), { onCargarCelda });
    fireEvent.click(screen.getByRole('button', { name: /Cargar Calibración de Enero/ }));
    const celda = onCargarCelda.mock.calls[0][0];
    expect(celda.fila.tipo).toBe('externa');
    expect(celda.fila.cadena.cadenaId).toBe('c1');
    expect(celda.mes).toBe('Ene');
  });

  it('the permission of the user is asked per kind of row', () => {
    enJunio();
    renderGrid(
      equipo({ mesesMtto: ['Mar'], cadenas: [cadena({ meses: ['ene'] })] }),
      { onCargarCelda: vi.fn(), puedeCargarFila: (fila) => fila.tipo === 'mp' },
    );
    expect(screen.getAllByTestId('celda-cargar')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Mantenimiento preventivo/ })).toBeInTheDocument();
  });

  it('a future year has no clickable cell', () => {
    enJunio();
    renderGrid(equipo({ mesesMtto: ['Mar', 'Dic'] }), { onCargarCelda: vi.fn(), anio: AHORA + 1 });
    expect(screen.queryAllByTestId('celda-cargar')).toHaveLength(0);
  });

  it('a past year: the preventive row is not clickable (the backend would not mark its month) but an external one is', () => {
    enJunio();
    renderGrid(
      equipo({ mesesMtto: ['Mar', 'Dic'], cadenas: [cadena({ meses: ['mar', 'dic'] })] }),
      { onCargarCelda: vi.fn(), anio: AHORA - 1 },
    );
    expect(screen.queryByRole('button', { name: /Cargar Mantenimiento preventivo/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: /Cargar Calibración/ })).toHaveLength(2);
  });

  it('an external cell before the latest activity of the chain is not clickable (it would send the chain back in time)', () => {
    enJunio();
    // March is overdue but the chain already has an activity registered in May of this year
    renderGrid(
      equipo({ mesesMtto: [], cadenas: [cadena({ meses: ['mar', 'may'], realizadas: [{ mes: 'may', fecha: `${AHORA}-05-10T00:00:00.000Z` }] })] }),
      { onCargarCelda: vi.fn() },
    );
    expect(screen.queryByRole('button', { name: /Cargar Calibración de Marzo/ })).toBeNull();
    // the cell of the month that is done still opens the summary
    expect(screen.getByRole('button', { name: /Ver resumen de Calibración de Mayo/ })).toBeInTheDocument();
  });

  it('an external cell after the latest activity is clickable', () => {
    enJunio();
    renderGrid(
      equipo({ mesesMtto: [], cadenas: [cadena({ meses: ['mar', 'jun'], realizadas: [{ mes: 'mar', fecha: `${AHORA}-03-10T00:00:00.000Z` }] })] }),
      { onCargarCelda: vi.fn() },
    );
    expect(screen.getByRole('button', { name: /Cargar Calibración de Junio/ })).toBeInTheDocument();
  });
});
