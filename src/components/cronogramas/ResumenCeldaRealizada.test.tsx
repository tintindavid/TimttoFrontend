import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import ResumenCeldaRealizada from './ResumenCeldaRealizada';
import type { CeldaCarga } from './CargaRapidaCelda';
import type { CronogramaActividadExterna, CronogramaEquipo } from '@/types/cronograma.types';

const { actividadesState, reportesState, reportesHook } = vi.hoisted(() => ({
  reportesHook: vi.fn(),
  actividadesState: { value: { data: undefined as unknown, isLoading: false, isError: false } },
  reportesState: { value: { data: undefined as unknown, isLoading: false, isError: false } },
}));
vi.mock('@/hooks/useActividadesExternas', () => ({ useActividadesExternasPorEquipo: () => actividadesState.value }));
vi.mock('@/hooks/useReportes', () => ({ useReportesByEquipo: (...args: unknown[]) => { reportesHook(...args); return reportesState.value; } }));

const cadena = { cadenaId: 'cad1' } as CronogramaActividadExterna;
const equipo = { _id: 'e1' } as CronogramaEquipo;
const celdaExterna: CeldaCarga = { equipo, mes: 'Mar', estado: 'realizado', fila: { key: 'k', tipo: 'externa', etiqueta: 'Cal', titulo: 'Calibración', cadena } };
const celdaMp: CeldaCarga = { equipo, mes: 'Mar', estado: 'realizado', fila: { key: 'k2', tipo: 'mp', etiqueta: 'MP', titulo: 'Mantenimiento preventivo' } };

const actividad = (over: Record<string, unknown> = {}) => ({
  _id: 'a1', cadenaId: 'cad1', tipo: 'calibracion', consecutivoExterno: 'CAL-77', fecha: '2026-03-12T00:00:00.000Z', proveedor: 'Biolab',
  estadoFinal: 'aprobada', estadoOperativo: 'Operativo', observacion: 'Todo bien', ...over,
});
const conActividades = (actividades: unknown[]) => { actividadesState.value = { data: { data: [{ cadena: { _id: 'cad1' }, actividades }] }, isLoading: false, isError: false }; };
const conReportes = (reportes: unknown[]) => { reportesState.value = { data: { data: reportes }, isLoading: false, isError: false }; };
const open = (celda: CeldaCarga, onClose = vi.fn()) => render(<ResumenCeldaRealizada celda={celda} anio={2026} onClose={onClose} />);

beforeEach(() => {
  actividadesState.value = { data: undefined, isLoading: false, isError: false };
  reportesState.value = { data: undefined, isLoading: false, isError: false };
});

describe('ResumenCeldaRealizada - external activity', () => {
  it('shows the summary of the activity of that month', () => {
    conActividades([actividad()]);
    open(celdaExterna);
    expect(screen.getByText(/Resumen — Calibración de Marzo 2026/)).toBeInTheDocument();
    const tarjeta = screen.getByTestId('resumen-actividad');
    expect(within(tarjeta).getByText('CAL-77')).toBeInTheDocument();
    expect(within(tarjeta).getByText('12/03/2026')).toBeInTheDocument();
    expect(within(tarjeta).getByText('Biolab')).toBeInTheDocument();
    expect(within(tarjeta).getByText('Aprobada')).toBeInTheDocument();
    expect(within(tarjeta).getByText('Operativo')).toBeInTheDocument();
    expect(within(tarjeta).getByText('Todo bien')).toBeInTheDocument();
  });

  it('a file opens in a new tab without access to the opener', () => {
    conActividades([actividad({ evidencia: { url: 'https://storage.example/cert.pdf', nombreOriginal: 'cert.pdf' } })]);
    open(celdaExterna);
    const insignia = screen.getByRole('link', { name: 'Ver archivo' });
    expect(insignia).toHaveAttribute('href', 'https://storage.example/cert.pdf');
    expect(insignia).toHaveAttribute('target', '_blank');
    expect(insignia).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.queryByRole('link', { name: 'Ver enlace' })).toBeNull();
  });

  it('a link shows its badge, and with both there are two badges', () => {
    conActividades([actividad({ enlace: 'https://cert.example/42' })]);
    const { unmount } = open(celdaExterna);
    expect(screen.getByRole('link', { name: 'Ver enlace' })).toHaveAttribute('href', 'https://cert.example/42');
    unmount();
    conActividades([actividad({ enlace: 'https://cert.example/42', evidencia: { url: 'https://storage.example/c.pdf' } })]);
    open(celdaExterna);
    expect(screen.getByRole('link', { name: 'Ver archivo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver enlace' })).toBeInTheDocument();
  });

  it('without evidence the badge says so and there is no link', () => {
    conActividades([actividad()]);
    open(celdaExterna);
    expect(screen.getByText('Sin adjunto')).toBeInTheDocument();
    expect(within(screen.getByTestId('resumen-evidencia')).queryAllByRole('link')).toHaveLength(0);
  });

  it('never opens an address that is not http(s)', () => {
    conActividades([actividad({ enlace: 'javascript:alert(1)', evidencia: { url: 'data:text/html,x' } })]);
    open(celdaExterna);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText('Sin adjunto')).toBeInTheDocument();
  });

  it('lists every activity of the month, newest first, and ignores other months and chains', () => {
    conActividades([
      actividad({ _id: 'a1', consecutivoExterno: 'PRIMERA', fecha: '2026-03-02T00:00:00.000Z' }),
      actividad({ _id: 'a2', consecutivoExterno: 'SEGUNDA', fecha: '2026-03-25T00:00:00.000Z' }),
      actividad({ _id: 'a3', consecutivoExterno: 'ABRIL', fecha: '2026-04-02T00:00:00.000Z' }),
    ]);
    open(celdaExterna);
    const tarjetas = screen.getAllByTestId('resumen-actividad');
    expect(tarjetas).toHaveLength(2);
    expect(within(tarjetas[0]).getByText('SEGUNDA')).toBeInTheDocument();
    expect(within(tarjetas[1]).getByText('PRIMERA')).toBeInTheDocument();
    expect(screen.queryByText('ABRIL')).toBeNull();
  });

  it('a custom result and type show their own text', () => {
    conActividades([actividad({ tipo: 'otro', tipoCustom: 'Tomografia', estadoFinal: 'otro', estadoFinalCustom: 'Con reserva' })]);
    open(celdaExterna);
    expect(screen.getByText('Tomografia')).toBeInTheDocument();
    expect(screen.getByText('Con reserva')).toBeInTheDocument();
  });

  it('says the detail is not available when nothing matches', () => {
    conActividades([actividad({ fecha: '2026-05-12T00:00:00.000Z' })]);
    open(celdaExterna);
    expect(screen.getByText('El detalle no está disponible para este mes.')).toBeInTheDocument();
  });

  it('shows a spinner while loading and an error when it fails', () => {
    actividadesState.value = { data: undefined, isLoading: true, isError: false };
    const { unmount } = open(celdaExterna);
    expect(screen.getByRole('status', { name: 'Cargando el detalle' })).toBeInTheDocument();
    unmount();
    actividadesState.value = { data: undefined, isLoading: false, isError: true };
    open(celdaExterna);
    expect(screen.getByText('No se pudo cargar el detalle de la actividad.')).toBeInTheDocument();
  });

  it('is read only: it has no form fields and no save button, and it closes', () => {
    conActividades([actividad()]);
    const onClose = vi.fn();
    open(celdaExterna, onClose);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /Guardar/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ResumenCeldaRealizada - preventive row', () => {
  const interno = { _id: 'rep1', tipoMtto: 'Preventivo', estado: 'Procesado', consecutivo: 'R000010', fechaProcesado: '2026-03-12T15:00:00.000Z',
    procesadoPor: { snapshotName: 'M. Duran' }, estadoOperativo: 'Operativo', observacionEstadoFinal: 'Sin novedades' };
  const externo = { _id: 'rep2', tipoMtto: 'Preventivo', estado: 'Cerrado', consecutivo: 'R000011', fechaProcesado: '2026-03-20T12:00:00.000Z', origen: 'externo',
    externo: { proveedor: 'Metrologia Andina', consecutivoDocumento: 'CERT-9', enlace: 'https://cert.example/9', documento: { url: 'https://storage.example/c.pdf' } },
    estadoOperativo: 'En Mantenimiento', observacion: 'Cambio de sensor' };

  it('an internal report shows who did it and links to its page', () => {
    conReportes([interno]);
    open(celdaMp);
    const tarjeta = screen.getByTestId('resumen-preventivo');
    expect(within(tarjeta).getByText('R000010')).toBeInTheDocument();
    expect(within(tarjeta).getByText('M. Duran')).toBeInTheDocument();
    expect(within(tarjeta).getByText('Sin novedades')).toBeInTheDocument();
    expect(within(tarjeta).queryByText('Externo')).toBeNull();
    expect(within(tarjeta).getByRole('link', { name: 'Ver reporte' })).toHaveAttribute('href', '/reports/rep1/view');
  });

  it('an external service shows the provider with the Externo badge and its evidence', () => {
    conReportes([externo]);
    open(celdaMp);
    const tarjeta = screen.getByTestId('resumen-preventivo');
    expect(within(tarjeta).getByText('Externo')).toBeInTheDocument();
    expect(within(tarjeta).getByText('Metrologia Andina')).toBeInTheDocument();
    expect(within(tarjeta).getByText('CERT-9')).toBeInTheDocument();
    expect(within(tarjeta).getByRole('link', { name: 'Ver archivo' })).toHaveAttribute('href', 'https://storage.example/c.pdf');
    expect(within(tarjeta).getByRole('link', { name: 'Ver enlace' })).toHaveAttribute('href', 'https://cert.example/9');
    expect(within(tarjeta).queryByRole('link', { name: 'Ver reporte' })).toBeNull();
  });

  it('an external service without attachment says so', () => {
    conReportes([{ ...externo, externo: { proveedor: 'Taller' } }]);
    open(celdaMp);
    expect(screen.getByText('Sin adjunto')).toBeInTheDocument();
  });

  it('lists several services of the month, and ignores corrective and other months', () => {
    conReportes([interno, externo, { ...interno, _id: 'mc', tipoMtto: 'Correctivo' }, { ...interno, _id: 'abr', consecutivo: 'R000099', fechaProcesado: '2026-04-12T15:00:00.000Z' }]);
    open(celdaMp);
    expect(screen.getAllByTestId('resumen-preventivo')).toHaveLength(2);
    expect(screen.queryByText('R000099')).toBeNull();
  });

  it('says the detail is not available when no report matches', () => {
    conReportes([]);
    open(celdaMp);
    expect(screen.getByText('El detalle no está disponible para este mes.')).toBeInTheDocument();
  });
});

describe('ResumenCeldaRealizada - old months of an equipment with many reports', () => {
  it('asks for a large page so an old month does not fall out of a short default one', () => {
    conReportes([]);
    open(celdaMp);
    expect(reportesHook).toHaveBeenCalledWith('e1', { page: 1, limit: 1000 });
  });

  it('finds the preventive service of a month among more than ten reports of other kinds', () => {
    const otros = Array.from({ length: 25 }, (_, i) => ({ _id: `c${i}`, tipoMtto: 'Correctivo', estado: 'Cerrado', consecutivo: `R9${i}`, fechaProcesado: '2026-08-12T12:00:00.000Z' }));
    conReportes([...otros, { _id: 'viejo', tipoMtto: 'Preventivo', estado: 'Procesado', consecutivo: 'R000001', fechaProcesado: '2026-03-12T12:00:00.000Z', procesadoPor: { snapshotName: 'M. Duran' } }]);
    open(celdaMp);
    expect(screen.getAllByTestId('resumen-preventivo')).toHaveLength(1);
    expect(screen.getByText('R000001')).toBeInTheDocument();
  });
});
