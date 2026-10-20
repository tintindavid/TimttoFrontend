import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CargaRapidaCelda, { type CeldaCarga } from './CargaRapidaCelda';
import type { CronogramaActividadExterna, CronogramaEquipo } from '@/types/cronograma.types';

const { guardar, actividadProps, servicioProps, avisar } = vi.hoisted(() => ({
  guardar: vi.fn(),
  actividadProps: vi.fn(),
  servicioProps: vi.fn(),
  avisar: vi.fn(),
}));

vi.mock('@/hooks/useGuardarActividadExterna', () => ({
  useGuardarActividadExterna: () => ({ guardar, guardando: false }),
}));
vi.mock('@/components/hvEquipo/ServicioExternoControles', () => ({ avisarServicioGuardado: avisar }));

// The real forms are covered by their own tests; here they expose what the cell gives them.
vi.mock('@/components/hvEquipo/CrearActividadExternaModal', () => ({
  default: (props: { tipoFijo?: boolean; estadoActual?: string; initial?: Record<string, unknown>; onClose: () => void; onNext: (dto: unknown, file?: File) => void }) => {
    actividadProps(props);
    return (
      <div data-testid="modal-actividad">
        <button onClick={() => props.onNext({ tipo: 'calibracion', consecutivoExterno: 'CAL-9' }, undefined)}>guardar</button>
        <button onClick={props.onClose}>cerrar</button>
      </div>
    );
  },
}));
vi.mock('@/components/hvEquipo/ReporteExternoModal', () => ({
  default: (props: { tipoMtto: string; equipoId: string; estadoActual?: string; mesesMtto?: string[]; fechaInicial?: string; onClose: () => void; onSaved: (w: string[]) => void }) => {
    servicioProps(props);
    return (
      <div data-testid="modal-servicio">
        <button onClick={() => props.onSaved(['MES_FUERA_DE_CRONOGRAMA'])}>guardado</button>
      </div>
    );
  },
}));

const cadena: CronogramaActividadExterna = {
  cadenaId: 'cad1', equipoId: 'e1', clienteId: 'cli', tipo: 'otro', tipoCustom: 'Tomografia', frecuenciaMeses: 6,
  fechaProxima: '2026-03-10T00:00:00.000Z', meses: ['mar'], realizadas: [], vencida: true, diasParaVencer: -5,
  proveedor: 'Biolab', proveedorId: 'prov1',
  equipo: { nombre: 'Monitor', marca: null, modelo: null, serie: null, inventario: null, ubicacion: null }, cliente: null,
};
const equipo: CronogramaEquipo = {
  _id: 'e1', EstadoOperativo: 'En Reparacion', mesesMtto: ['Mar', 'Sep'], mesesRealizados: [{ mes: 'mar', fecha: '2026-03-12T00:00:00.000Z' }],
};

const celdaExterna: CeldaCarga = { equipo, mes: 'Mar', estado: 'vencido', fila: { key: 'e1-cad1', tipo: 'externa', etiqueta: 'Tom', titulo: 'Tomografia', cadena } };
const celdaMp: CeldaCarga = { equipo, mes: 'Sep', estado: 'programado', fila: { key: 'e1-mp', tipo: 'mp', etiqueta: 'MP', titulo: 'Mantenimiento preventivo' } };

beforeEach(() => {
  guardar.mockReset();
  guardar.mockResolvedValue(true);
  actividadProps.mockClear();
  servicioProps.mockClear();
  avisar.mockClear();
});

describe('CargaRapidaCelda - external activity of a chain', () => {
  it('opens the activity form with the type locked and the data of the chain, in the month of the cell', () => {
    render(<CargaRapidaCelda celda={celdaExterna} anio={2025} onClose={vi.fn()} />);
    expect(screen.getByTestId('modal-actividad')).toBeInTheDocument();
    expect(screen.queryByTestId('modal-servicio')).toBeNull();
    const props = actividadProps.mock.calls[0][0];
    expect(props.tipoFijo).toBe(true);
    expect(props.estadoActual).toBe('En Reparacion');
    expect(props.initial).toEqual({
      tipo: 'otro', tipoCustom: 'Tomografia', proveedor: 'Biolab', proveedorId: 'prov1',
      frecuencia: { esUnica: false, meses: 6 }, fecha: '2025-03-31',
    });
  });

  it('saves as the successor of THAT chain, with no question about continuing it, and closes on success', async () => {
    const onClose = vi.fn();
    render(<CargaRapidaCelda celda={celdaExterna} anio={2025} onClose={onClose} />);
    fireEvent.click(screen.getByText('guardar'));
    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    const [dto, cadenaId, file, opciones] = guardar.mock.calls[0];
    expect(dto.consecutivoExterno).toBe('CAL-9');
    expect(cadenaId).toBe('cad1');
    expect(file).toBeUndefined();
    opciones.alGuardar();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a double click does not register it twice', async () => {
    let resolver: (v: boolean) => void = () => {};
    guardar.mockReturnValue(new Promise<boolean>((r) => { resolver = r; }));
    render(<CargaRapidaCelda celda={celdaExterna} anio={2025} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('guardar'));
    fireEvent.click(screen.getByText('guardar'));
    expect(guardar).toHaveBeenCalledTimes(1);
    resolver(true);
  });

  it('when saving fails the form stays open and can be tried again', async () => {
    guardar.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const onClose = vi.fn();
    render(<CargaRapidaCelda celda={celdaExterna} anio={2025} onClose={onClose} />);
    fireEvent.click(screen.getByText('guardar'));
    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('modal-actividad')).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('guardar'));
    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(2));
  });

  it('a chain without frequency falls back to 12 months and without provider leaves it empty', () => {
    const sinDatos: CeldaCarga = { ...celdaExterna, fila: { ...celdaExterna.fila, cadena: { ...cadena, frecuenciaMeses: null, proveedor: null, proveedorId: null, tipo: 'calibracion', tipoCustom: null } } };
    render(<CargaRapidaCelda celda={sinDatos} anio={2025} onClose={vi.fn()} />);
    const initial = actividadProps.mock.calls[0][0].initial;
    expect(initial.frecuencia).toEqual({ esUnica: false, meses: 12 });
    expect(initial.proveedor).toBeUndefined();
    expect(initial.proveedorId).toBeUndefined();
    expect(initial.tipoCustom).toBeUndefined();
  });
});

describe('CargaRapidaCelda - preventive row', () => {
  it('opens the external preventive service form with the guide of the equipment and the month of the cell', () => {
    render(<CargaRapidaCelda celda={celdaMp} anio={2025} onClose={vi.fn()} />);
    expect(screen.getByTestId('modal-servicio')).toBeInTheDocument();
    expect(screen.queryByTestId('modal-actividad')).toBeNull();
    const props = servicioProps.mock.calls[0][0];
    expect(props.tipoMtto).toBe('Preventivo');
    expect(props.equipoId).toBe('e1');
    expect(props.estadoActual).toBe('En Reparacion');
    expect(props.mesesMtto).toEqual(['mar', 'sep']);
    expect(props.fechaInicial).toBe('2025-09-30');
  });

  it('after saving it closes and shows the same alert as the equipment record', () => {
    const onClose = vi.fn();
    render(<CargaRapidaCelda celda={celdaMp} anio={2025} onClose={onClose} />);
    fireEvent.click(screen.getByText('guardado'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(avisar).toHaveBeenCalledWith(['MES_FUERA_DE_CRONOGRAMA']);
  });
});
