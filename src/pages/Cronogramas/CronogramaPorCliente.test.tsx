import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CronogramaPorCliente } from './CronogramaPorCliente';

const externasHook = vi.fn();
const equiposHook = vi.fn();
let moduloExternas = true;
let ejecutaServicios = true;
let marzoHecho = false;
let cargaRapidaOn = false;
let rolUsuario = 'admin';
let puedeCrearReportes = true;
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({
    can: (c: string) => (c === 'registersExternal' ? moduloExternas : c === 'scheduleQuickLoad' ? cargaRapidaOn : c === 'executesServices' ? ejecutaServicios : true),
    isLoading: false,
  }),
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { role: rolUsuario } }) }));
vi.mock('@/hooks/usePermission', () => ({ useHasPermission: (p: string) => (p === 'reports:create' ? puedeCrearReportes : true) }));
// The quick load component has its own tests; here it only shows what the page gives it.
vi.mock('@/components/cronogramas/ResumenCeldaRealizada', () => ({
  default: (props: { celda: { equipo: { _id: string }; mes: string; estado: string }; anio: number; onClose: () => void }) => (
    <div data-testid="resumen-celda" data-equipo={props.celda.equipo._id} data-mes={props.celda.mes} data-estado={props.celda.estado} data-anio={props.anio}>
      <button onClick={props.onClose}>cerrar-resumen</button>
    </div>
  ),
}));
vi.mock('@/components/cronogramas/CargaRapidaCelda', () => ({
  default: (props: { celda: { equipo: { _id: string }; fila: { tipo: string }; mes: string }; anio: number; onClose: () => void }) => (
    <div data-testid="carga-rapida" data-equipo={props.celda.equipo._id} data-fila={props.celda.fila.tipo} data-mes={props.celda.mes} data-anio={props.anio}>
      <button onClick={props.onClose}>cerrar-carga</button>
    </div>
  ),
}));

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
          mesesMtto: ['Mar'],
          mesesMttoRealizados: marzoHecho ? [{ mes: 'mar', fecha: '2026-03-12T00:00:00.000Z', consecutivo: 'R000010' }] : [],
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
  moduloExternas = true;
  ejecutaServicios = true;
  cargaRapidaOn = false;
  marzoHecho = false;
  rolUsuario = 'admin';
  puedeCrearReportes = true;
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

describe('CronogramaPorCliente without the premium module "Servicios de terceros"', () => {
  beforeEach(() => { moduloExternas = false; });

  it('does not ask for external activities and shows only the preventive rows', () => {
    renderPage({ clienteFijoId: 'org1' });
    expect(externasHook).toHaveBeenCalledWith(expect.anything(), { enabled: false });
    expect(screen.getAllByTestId('etiqueta-actividad').map((b) => b.textContent)).toEqual(['MP']);
  });

  it('shows no external figures and no Origen filter', () => {
    renderPage({ clienteFijoId: 'org1' });
    expect(screen.queryByTestId('stats-externas')).toBeNull();
    expect(screen.queryByText('Externas vencidas')).toBeNull();
    expect(screen.queryByText('Programaciones externas')).toBeNull();
    expect(screen.queryByLabelText('Origen')).toBeNull();
  });

  it('the legend does not mention external activities', () => {
    renderPage({ clienteFijoId: 'org1' });
    const leyenda = screen.getByTestId('leyenda-cronograma');
    expect(leyenda.textContent).toMatch(/Mantenimiento preventivo/);
    expect(leyenda.textContent).not.toMatch(/Actividades externas/);
    expect(leyenda.textContent).not.toMatch(/Vencido/);
  });
});

describe('CronogramaPorCliente - quick load (cronograma-carga-rapida)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 20, 10, 0, 0)); // 20 October 2026: March (MP) and January (calibration, overdue) are due
    cargaRapidaOn = true;
  });
  afterEach(() => { vi.useRealTimers(); });

  it('without the switch no cell is clickable', () => {
    cargaRapidaOn = false;
    renderPage({ clienteFijoId: 'org1' });
    expect(screen.queryAllByTestId('celda-cargar')).toHaveLength(0);
  });

  it('with the switch the due cells of MP and of the calibration are clickable', () => {
    renderPage({ clienteFijoId: 'org1' });
    expect(screen.getByRole('button', { name: /Cargar Mantenimiento preventivo de Marzo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cargar Calibración de Enero/ })).toBeInTheDocument();
  });

  it('clicking a cell opens the quick load for that equipment, row and month, and it closes', () => {
    renderPage({ clienteFijoId: 'org1' });
    fireEvent.click(screen.getByRole('button', { name: /Cargar Calibración de Enero/ }));
    const carga = screen.getByTestId('carga-rapida');
    expect(carga).toHaveAttribute('data-equipo', 'e1');
    expect(carga).toHaveAttribute('data-fila', 'externa');
    expect(carga).toHaveAttribute('data-mes', 'Ene');
    expect(carga).toHaveAttribute('data-anio', '2026');
    fireEvent.click(screen.getByText('cerrar-carga'));
    expect(screen.queryByTestId('carga-rapida')).toBeNull();
  });

  it('a user who is not admin cannot load external activities but can load the preventive one', () => {
    rolUsuario = 'technician';
    renderPage({ clienteFijoId: 'org1' });
    expect(screen.queryByRole('button', { name: /Cargar Calibración/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Cargar Mantenimiento preventivo de Marzo/ })).toBeInTheDocument();
  });

  it('without reports:create the preventive cell is not clickable but the external one is for an admin', () => {
    puedeCrearReportes = false;
    renderPage({ clienteFijoId: 'org1' });
    expect(screen.queryByRole('button', { name: /Cargar Mantenimiento preventivo/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Cargar Calibración de Enero/ })).toBeInTheDocument();
  });

  it('a done (green) cell opens the read-only summary, not the form', () => {
    marzoHecho = true;
    renderPage({ clienteFijoId: 'org1' });
    fireEvent.click(screen.getByRole('button', { name: /Ver resumen de Mantenimiento preventivo de Marzo/ }));
    const resumen = screen.getByTestId('resumen-celda');
    expect(resumen).toHaveAttribute('data-equipo', 'e1');
    expect(resumen).toHaveAttribute('data-mes', 'Mar');
    expect(resumen).toHaveAttribute('data-estado', 'realizado');
    expect(resumen).toHaveAttribute('data-anio', '2026');
    expect(screen.queryByTestId('carga-rapida')).toBeNull();
    fireEvent.click(screen.getByText('cerrar-resumen'));
    expect(screen.queryByTestId('resumen-celda')).toBeNull();
  });

  it('the summary needs neither the admin role nor reports:create', () => {
    marzoHecho = true;
    rolUsuario = 'technician';
    puedeCrearReportes = false;
    renderPage({ clienteFijoId: 'org1' });
    expect(screen.getByRole('button', { name: /Ver resumen de Mantenimiento preventivo de Marzo/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cargar Mantenimiento preventivo/ })).toBeNull();
  });

  it('without the switch a done cell is inert', () => {
    marzoHecho = true;
    cargaRapidaOn = false;
    renderPage({ clienteFijoId: 'org1' });
    expect(screen.queryByRole('button', { name: /Ver resumen/ })).toBeNull();
  });

  it('the switch does nothing without "Servicios de terceros"', () => {
    moduloExternas = false;
    renderPage({ clienteFijoId: 'org1' });
    expect(screen.queryAllByTestId('celda-cargar')).toHaveLength(0);
  });
});

describe('CronogramaPorCliente - selection checkboxes only for tenants that can create work orders', () => {
  const checksDeFila = (container: HTMLElement) => container.querySelectorAll('.cronograma-grid input[type="checkbox"]');

  it('a tenant that can create work orders has a checkbox per equipment and "Seleccionar todos los visibles"', () => {
    const { container } = renderPage({ clienteFijoId: 'org1' });
    expect(checksDeFila(container).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Seleccionar todos los visibles')).toBeInTheDocument();
    expect(screen.getByText('Equipos Seleccionados')).toBeInTheDocument();
    expect(screen.getByText('Visibles Selecc.')).toBeInTheDocument();
  });

  it('a tenant that can not (e.g. a client organization) has neither the row checkboxes nor "Seleccionar todos"', () => {
    ejecutaServicios = false;
    const { container } = renderPage({ clienteFijoId: 'org1' });
    expect(checksDeFila(container)).toHaveLength(0);
    expect(screen.queryByLabelText('Seleccionar todos los visibles')).toBeNull();
    // the figures about the selection make no sense either, the rest of the figures stay
    expect(screen.queryByText('Equipos Seleccionados')).toBeNull();
    expect(screen.queryByText('Visibles Selecc.')).toBeNull();
    expect(screen.getByText('Total Equipos')).toBeInTheDocument();
    expect(screen.getByText('Equipos Filtrados')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Crear OT/ })).toBeNull();
    // the rest of the schedule is intact
    expect(screen.getAllByTestId('etiqueta-actividad').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /imprimir visible/i })).toBeInTheDocument();
  });
});
