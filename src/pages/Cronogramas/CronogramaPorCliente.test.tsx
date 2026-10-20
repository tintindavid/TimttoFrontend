import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CronogramaPorCliente } from './CronogramaPorCliente';

const externasHook = vi.fn();
const equiposHook = vi.fn();

vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({ data: { data: [{ _id: 'org1', Razonsocial: 'Mi Laboratorio', Ciudad: 'Bogota', Departamento: 'Cundinamarca' }] }, isLoading: false }),
}));
vi.mock('@/hooks/useSedes', () => ({ useSedesByCustomer: () => ({ data: { data: [] } }) }));
vi.mock('@/hooks/useServicios', () => ({ useServiciosByCustomer: () => ({ data: { data: [] } }) }));
vi.mock('@/hooks/useOTs', () => ({ useCreateOt: () => ({ mutateAsync: vi.fn(), isLoading: false }) }));
vi.mock('@/hooks/useEquipoItems', () => ({
  useEquipoItems: (...args: unknown[]) => {
    equiposHook(...args);
    return {
      data: {
        data: [{
          _id: 'e1', ClienteId: 'org1', Marca: 'GE', Modelo: 'B20', Serie: 'S1', ItemId: { _id: 'i', Nombre: 'Monitor' },
          mesesMtto: ['Mar'], mesesMttoRealizados: [],
        }],
      },
      isLoading: false,
      refetch: vi.fn(),
    };
  },
}));
vi.mock('@/hooks/useCronogramaActividadesExternas', () => ({
  useCronogramaActividadesExternas: (...args: unknown[]) => {
    externasHook(...args);
    return {
      data: {
        data: [{
          cadenaId: 'c1', equipoId: 'e1', clienteId: 'org1', tipo: 'calibracion', tipoCustom: null, frecuenciaMeses: 12,
          fechaProxima: '2027-01-21T00:00:00.000Z', meses: ['ene'], realizadas: [], vencida: false, diasParaVencer: 93,
          proveedor: 'Biolab', proveedorId: null,
          equipo: { nombre: 'Monitor', marca: null, modelo: null, serie: null, inventario: null, ubicacion: null }, cliente: null,
        }],
        truncated: false,
      },
      isError: false,
    };
  },
}));
vi.mock('@/services/cronograma.service', () => ({ generarCronogramaPDF: vi.fn(), generarCronogramaExcel: vi.fn() }));
vi.mock('@/components/ots/EditEquipoModal', () => ({ default: () => null }));
vi.mock('@/components/cronogramas/CronogramaDownloadModal', () => ({ CronogramaDownloadModal: () => null }));
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderPage = (props: React.ComponentProps<typeof CronogramaPorCliente> = {}) =>
  render(<MemoryRouter><CronogramaPorCliente {...props} /></MemoryRouter>);

beforeEach(() => {
  externasHook.mockClear();
  equiposHook.mockClear();
});

describe('CronogramaPorCliente as "Mi Cronograma"', () => {
  it('with a fixed client it shows no selector and loads that client straight away', () => {
    renderPage({ clienteFijoId: 'org1' });
    expect(screen.queryByText(/Seleccionar Cliente/)).toBeNull();
    expect(screen.queryByText('Seleccione un Cliente')).toBeNull();
    expect(equiposHook).toHaveBeenCalledWith(expect.objectContaining({ ClienteId: 'org1' }));
    expect(externasHook).toHaveBeenCalledWith(
      expect.objectContaining({ clienteId: 'org1', anio: new Date().getUTCFullYear() }),
      { enabled: true },
    );
  });

  it('shows the activity rows (MP and Cal) for the client', () => {
    renderPage({ clienteFijoId: 'org1' });
    expect(screen.getAllByTestId('etiqueta-actividad').map((b) => b.textContent)).toEqual(['MP', 'Cal']);
  });

  it('without a fixed client it keeps the selector and asks to pick one', () => {
    renderPage();
    expect(screen.getByText(/Seleccionar Cliente/)).toBeInTheDocument();
    expect(screen.getByText('Seleccione un Cliente')).toBeInTheDocument();
  });

  it('changing the year asks the endpoint for that year', () => {
    renderPage({ clienteFijoId: 'org1' });
    const anioActual = new Date().getUTCFullYear();
    fireEvent.change(screen.getByLabelText('Año'), { target: { value: String(anioActual - 1) } });
    expect(externasHook).toHaveBeenLastCalledWith(
      expect.objectContaining({ clienteId: 'org1', anio: anioActual - 1 }),
      { enabled: true },
    );
  });

  it('offers the current year and the previous ones', () => {
    renderPage({ clienteFijoId: 'org1' });
    const select = screen.getByLabelText('Año') as HTMLSelectElement;
    const anioActual = new Date().getUTCFullYear();
    expect(Array.from(select.options).map((o) => Number(o.value))).toEqual([anioActual + 1, anioActual, anioActual - 1, anioActual - 2, anioActual - 3]);
    expect(Number(select.value)).toBe(anioActual);
  });

  it('shows the legend with the activity labels and the three states', () => {
    renderPage({ clienteFijoId: 'org1' });
    const leyenda = screen.getByTestId('leyenda-cronograma');
    expect(leyenda).toHaveTextContent('Realizado');
    expect(leyenda).toHaveTextContent('Programado');
    expect(leyenda).toHaveTextContent('Vencido');
  });
});
