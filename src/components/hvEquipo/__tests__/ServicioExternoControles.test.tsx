import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AdicionarServicioExterno,
  EliminarServicioExterno,
  InsigniaExterno,
  VerServicio,
  esReporteExterno,
  evidenciaDeServicioExterno,
} from '../ServicioExternoControles';
import type { Reporte } from '@/types/reporte.types';

let caps: { registersExternal: boolean };
let permisos: string[];
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({ ...caps, can: (c: string) => (c === 'registersExternal' ? caps.registersExternal : true) }),
}));
vi.mock('@/hooks/usePermission', () => ({ useHasPermission: (p: string) => permisos.includes(p) }));

const remove = vi.fn();
vi.mock('@/hooks/useReporteExterno', () => ({
  useRemoveReporteExterno: () => ({ mutateAsync: remove, isLoading: false }),
}));

const modalProps = vi.fn();
vi.mock('../ReporteExternoModal', () => ({
  default: (props: { tipoMtto: string; estadoActual?: string; onSaved: (w: string[]) => void; onClose: () => void }) => {
    modalProps(props);
    return (
      <div data-testid="modal-externo">
        <button onClick={() => props.onSaved([])}>guardar-ok</button>
        <button onClick={() => props.onSaved(['MES_FUERA_DE_CRONOGRAMA'])}>guardar-aviso</button>
        <button onClick={() => props.onSaved(['SERVICIO_DE_OTRO_ANIO'])}>guardar-otro-anio</button>
        <button onClick={props.onClose}>cerrar</button>
      </div>
    );
  },
}));

const swal = vi.fn();
vi.mock('sweetalert2', () => ({ default: { fire: (...args: unknown[]) => swal(...args) } }));

const externo = (over: Partial<Reporte> = {}): Reporte => ({
  _id: 'r1', consecutivo: 'R000123', origen: 'externo', externo: { proveedor: 'Metrologia Andina SAS' }, ...over,
} as unknown as Reporte);

beforeEach(() => {
  caps = { registersExternal: true };
  permisos = ['reports:create', 'reports:delete'];
  remove.mockReset();
  remove.mockResolvedValue({ success: true });
  modalProps.mockClear();
  swal.mockReset();
  swal.mockResolvedValue({ isConfirmed: true });
});

describe('AdicionarServicioExterno', () => {
  it('shows the button with registersExternal and reports:create', () => {
    render(<AdicionarServicioExterno tipoMtto="Preventivo" equipoId="eq1" />);
    expect(screen.getByRole('button', { name: /Adicionar actividad/ })).toBeInTheDocument();
  });

  it('is hidden without the tenant capability', () => {
    caps = { registersExternal: false };
    render(<AdicionarServicioExterno tipoMtto="Preventivo" equipoId="eq1" />);
    expect(screen.queryByRole('button', { name: /Adicionar actividad/ })).toBeNull();
  });

  it('is hidden without the permission to create reports', () => {
    permisos = ['reports:delete'];
    render(<AdicionarServicioExterno tipoMtto="Correctivo" equipoId="eq1" />);
    expect(screen.queryByRole('button', { name: /Adicionar actividad/ })).toBeNull();
  });

  it('opens the form with the kind and the current state, and closes it', () => {
    render(<AdicionarServicioExterno tipoMtto="Correctivo" equipoId="eq1" estadoActual="En Reparacion" />);
    expect(screen.queryByTestId('modal-externo')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Adicionar actividad/ }));
    expect(screen.getByTestId('modal-externo')).toBeInTheDocument();
    expect(modalProps.mock.calls[0][0].tipoMtto).toBe('Correctivo');
    expect(modalProps.mock.calls[0][0].estadoActual).toBe('En Reparacion');
    fireEvent.click(screen.getByText('cerrar'));
    expect(screen.queryByTestId('modal-externo')).toBeNull();
  });

  it('after saving it closes, notifies the page and confirms', () => {
    const onChanged = vi.fn();
    render(<AdicionarServicioExterno tipoMtto="Preventivo" equipoId="eq1" onChanged={onChanged} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar actividad/ }));
    fireEvent.click(screen.getByText('guardar-ok'));
    expect(screen.queryByTestId('modal-externo')).toBeNull();
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(swal.mock.calls[0][0].icon).toBe('success');
  });

  it('warns when the month is not in the equipment schedule', () => {
    render(<AdicionarServicioExterno tipoMtto="Preventivo" equipoId="eq1" />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar actividad/ }));
    fireEvent.click(screen.getByText('guardar-aviso'));
    expect(swal.mock.calls[0][0].icon).toBe('warning');
    expect(swal.mock.calls[0][0].text).toMatch(/no está en el cronograma/);
  });
});

describe('InsigniaExterno and esReporteExterno', () => {
  it('shows the Externo badge and the provider', () => {
    render(<InsigniaExterno reporte={externo()} />);
    expect(screen.getByTestId('insignia-externo')).toHaveTextContent('Externo');
    expect(screen.getByText('Metrologia Andina SAS')).toBeInTheDocument();
  });

  it('falls back when there is no provider name', () => {
    render(<InsigniaExterno reporte={externo({ externo: undefined })} />);
    expect(screen.getByText('Sin proveedor')).toBeInTheDocument();
  });

  it('only reports with origen externo count as external', () => {
    expect(esReporteExterno(externo())).toBe(true);
    expect(esReporteExterno({ origen: 'interno' } as Reporte)).toBe(false);
    expect(esReporteExterno({} as Reporte)).toBe(false);
  });
});

describe('EliminarServicioExterno', () => {
  const clickDelete = () => fireEvent.click(screen.getByRole('button', { name: /Eliminar servicio externo/ }));

  it('is shown only for external reports', () => {
    const { rerender } = render(<EliminarServicioExterno equipoId="eq1" reporte={externo()} />);
    expect(screen.getByRole('button', { name: /Eliminar servicio externo/ })).toBeInTheDocument();
    rerender(<EliminarServicioExterno equipoId="eq1" reporte={{ _id: 'r2', origen: 'interno' } as Reporte} />);
    expect(screen.queryByRole('button', { name: /Eliminar servicio externo/ })).toBeNull();
  });

  it('needs reports:delete and the tenant capability', () => {
    permisos = ['reports:create'];
    const { rerender } = render(<EliminarServicioExterno equipoId="eq1" reporte={externo()} />);
    expect(screen.queryByRole('button', { name: /Eliminar servicio externo/ })).toBeNull();
    permisos = ['reports:delete'];
    caps = { registersExternal: false };
    rerender(<EliminarServicioExterno equipoId="eq1" reporte={externo()} />);
    expect(screen.queryByRole('button', { name: /Eliminar servicio externo/ })).toBeNull();
  });

  it('asks for confirmation, deletes and notifies the page', async () => {
    const onChanged = vi.fn();
    render(<EliminarServicioExterno equipoId="eq1" reporte={externo()} onChanged={onChanged} />);
    clickDelete();
    await waitFor(() => expect(remove).toHaveBeenCalledWith('r1'));
    expect(swal.mock.calls[0][0].showCancelButton).toBe(true);
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('does nothing when the user cancels', async () => {
    swal.mockResolvedValue({ isConfirmed: false });
    const onChanged = vi.fn();
    render(<EliminarServicioExterno equipoId="eq1" reporte={externo()} onChanged={onChanged} />);
    clickDelete();
    await waitFor(() => expect(swal).toHaveBeenCalled());
    expect(remove).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });
});

describe('VerServicio', () => {
  const open = vi.fn();
  beforeEach(() => { open.mockReset(); vi.stubGlobal('open', open); });

  it('an internal report keeps opening its detail page', () => {
    render(<VerServicio reporte={{ _id: 'r9', origen: 'interno' } as Reporte} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
    expect(open).toHaveBeenCalledWith('/reports/r9/view', '_blank');
  });

  it('an external report opens its link, never the report page', () => {
    render(<VerServicio reporte={externo({ externo: { proveedor: 'T', enlace: 'https://cert.example/42' } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
    expect(open).toHaveBeenCalledWith('https://cert.example/42', '_blank', 'noopener,noreferrer');
    expect(open).not.toHaveBeenCalledWith(expect.stringContaining('/reports/'), expect.anything());
  });

  it('an external report opens its attached document', () => {
    render(<VerServicio reporte={externo({ externo: { proveedor: 'T', documento: { url: 'https://storage.example/cert.pdf', nombreOriginal: 'cert.pdf' } } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
    expect(open).toHaveBeenCalledWith('https://storage.example/cert.pdf', '_blank', 'noopener,noreferrer');
  });

  it('with both a document and a link it offers two buttons', () => {
    render(<VerServicio reporte={externo({ externo: { proveedor: 'T', enlace: 'https://cert.example/42', documento: { url: 'https://storage.example/cert.pdf' } } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archivo' }));
    expect(open).toHaveBeenLastCalledWith('https://storage.example/cert.pdf', '_blank', 'noopener,noreferrer');
    fireEvent.click(screen.getByRole('button', { name: 'Enlace' }));
    expect(open).toHaveBeenLastCalledWith('https://cert.example/42', '_blank', 'noopener,noreferrer');
  });

  it('without evidence the button is disabled and says so', () => {
    render(<VerServicio reporte={externo({ externo: { proveedor: 'T' } })} />);
    const btn = screen.getByRole('button', { name: 'Sin adjunto' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(open).not.toHaveBeenCalled();
  });

  it('never opens an address that is not http(s)', () => {
    render(<VerServicio reporte={externo({ externo: { proveedor: 'T', enlace: 'javascript:alert(1)', documento: { url: 'data:text/html,x' } } })} />);
    expect(screen.getByRole('button', { name: 'Sin adjunto' })).toBeDisabled();
  });

  it('evidenciaDeServicioExterno filters unsafe addresses and tolerates a missing block', () => {
    expect(evidenciaDeServicioExterno({ externo: { enlace: 'https://a.example', documento: { url: 'ftp://x' } } })).toEqual({ documento: null, enlace: 'https://a.example' });
    expect(evidenciaDeServicioExterno({})).toEqual({ documento: null, enlace: null });
  });
});

describe('AdicionarServicioExterno - service of another year', () => {
  it('warns that it does not mark a month of the current schedule', () => {
    render(<AdicionarServicioExterno tipoMtto="Preventivo" equipoId="eq1" />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar actividad/ }));
    fireEvent.click(screen.getByText('guardar-otro-anio'));
    expect(swal.mock.calls[0][0].icon).toBe('warning');
    expect(swal.mock.calls[0][0].text).toMatch(/otro año/);
  });
});

describe('AdicionarServicioExterno - months guide', () => {
  it('passes the scheduled and done months to the form', () => {
    const meses = ['mar', 'sep'];
    const hechos = [{ mes: 'mar', fecha: '2026-03-12T00:00:00.000Z' }];
    render(<AdicionarServicioExterno tipoMtto="Preventivo" equipoId="eq1" mesesMtto={meses} mesesRealizados={hechos} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar actividad/ }));
    const props = modalProps.mock.calls[0][0];
    expect(props.mesesMtto).toEqual(meses);
    expect(props.mesesRealizados).toEqual(hechos);
  });
});
