import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen, fireEvent } from '@testing-library/react';
import CrearActividadExternaModal from '../CrearActividadExternaModal';

let mockProviders: { _id: string; Razonsocial: string }[] = [];
vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({ data: { data: mockProviders } }),
  useCreateCustomer: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));

const render = (ui: React.ReactElement) => rtlRender(ui);

const fillValid = () => {
  fireEvent.change(screen.getByLabelText(/Tipo de actividad/i), { target: { value: 'calibracion' } });
  fireEvent.change(screen.getByLabelText(/Consecutivo/i), { target: { value: 'CAL-1' } });
  fireEvent.change(screen.getByLabelText(/^Fecha/i), { target: { value: '2026-01-15' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Proveedor' }), { target: { value: '__otro__' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del proveedor' }), { target: { value: 'ACME' } });
  fireEvent.change(screen.getByLabelText(/^Resultado/i), { target: { value: 'aprobada' } });
};

describe('CrearActividadExternaModal', () => {
  beforeEach(() => { mockProviders = []; });

  it('con tipoFijo el tipo viene de la cadena y no se puede cambiar (carga rapida desde el cronograma)', () => {
    render(
      <CrearActividadExternaModal
        show={true}
        tipoFijo
        initial={{ tipo: 'otro', tipoCustom: 'Tomografia', fecha: '2026-03-31' }}
        onClose={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByLabelText(/Tipo de actividad/i)).toBeDisabled();
    expect((screen.getByLabelText(/Tipo de actividad/i) as HTMLSelectElement).value).toBe('otro');
    expect(screen.getByLabelText(/Especifica cuál/i)).toBeDisabled();
    expect((screen.getByLabelText(/Especifica cuál/i) as HTMLInputElement).value).toBe('Tomografia');
    expect((screen.getByLabelText(/Fecha/i) as HTMLInputElement).value).toBe('2026-03-31');
  });

  it('con tipoFijo (continuar una cadena) no ofrece "Actividad única", y sin tipoFijo sí', () => {
    const { unmount } = render(<CrearActividadExternaModal show={true} tipoFijo initial={{ tipo: 'calibracion' }} onClose={() => {}} onNext={() => {}} />);
    expect(screen.queryByLabelText(/Actividad única/i)).toBeNull();
    unmount();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={() => {}} />);
    expect(screen.getByLabelText(/Actividad única/i)).toBeInTheDocument();
  });

  it('sin tipoFijo el tipo sigue siendo editable (hoja de vida)', () => {
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={() => {}} />);
    expect(screen.getByLabelText(/Tipo de actividad/i)).not.toBeDisabled();
  });

  it('al seleccionar tipo=otro muestra input tipoCustom', () => {
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Tipo de actividad/i), { target: { value: 'otro' } });
    expect(screen.getByLabelText(/Especifica cuál/i)).toBeInTheDocument();
  });

  it('al pulsar Continuar sin tipo bloquea el submit', () => {
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('al pulsar Continuar con formulario válido llama onNext con DTO', () => {
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'calibracion', consecutivoExterno: 'CAL-1' }),
      undefined,
    );
  });

  it('bloquea submit si tipo=otro sin tipoCustom', () => {
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fillValid();
    fireEvent.change(screen.getByLabelText(/Tipo de actividad/i), { target: { value: 'otro' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('bloquea submit si frecuencia recurrente tiene meses indefinidos', () => {
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fillValid();
    fireEvent.change(screen.getByLabelText(/Meses entre repeticiones/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getAllByText(/cuántos meses/i).length).toBeGreaterThan(0);
  });

  it('no envía tipoCustom si se cambió de otro a calibracion', () => {
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fillValid();
    fireEvent.change(screen.getByLabelText(/Tipo de actividad/i), { target: { value: 'otro' } });
    fireEvent.change(screen.getByLabelText(/Especifica cuál/i), { target: { value: 'viejo' } });
    fireEvent.change(screen.getByLabelText(/Tipo de actividad/i), { target: { value: 'calibracion' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onNext.mock.calls[0][0].tipoCustom).toBeUndefined();
  });

  it('bloquea submit con proveedor solo espacios', () => {
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fillValid();
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del proveedor' }), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('bloquea submit con evidencia archivo sin archivo', () => {
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fillValid();
    fireEvent.click(screen.getByLabelText(/Archivo adjunto/i));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(/Selecciona un archivo/i)).toBeInTheDocument();
  });

  it('bloquea submit con evidencia enlace sin enlace válido', () => {
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fillValid();
    fireEvent.click(screen.getByLabelText(/Enlace externo/i));
    fireEvent.change(screen.getByLabelText(/Enlace de evidencia/i), { target: { value: 'ftp://x' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(/Ingresa un enlace válido/i)).toBeInTheDocument();
  });

  it('permite submit con actividad única sin meses', () => {
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fillValid();
    fireEvent.click(screen.getByLabelText(/Actividad única/i));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext).toHaveBeenCalledWith(
      expect.objectContaining({ frecuencia: { esUnica: true } }),
      undefined,
    );
  });

  it('bloquea seleccionar fecha futura (max=today en el input)', () => {
    render(<CrearActividadExternaModal show onClose={() => {}} onNext={() => {}} />);
    const input = screen.getByLabelText(/Fecha/i) as HTMLInputElement;
    const today = new Date().toISOString().slice(0, 10);
    expect(input.max).toBe(today);
  });

  it('con proveedores registrados permite elegir uno y envía proveedorId sin nombre', () => {
    mockProviders = [{ _id: 'p1', Razonsocial: 'ACME SAS' }, { _id: 'p2', Razonsocial: 'Metrologia SA' }];
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fireEvent.change(screen.getByLabelText(/Tipo de actividad/i), { target: { value: 'calibracion' } });
    fireEvent.change(screen.getByLabelText(/Consecutivo/i), { target: { value: 'CAL-1' } });
    fireEvent.change(screen.getByLabelText(/^Fecha/i), { target: { value: '2026-01-15' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Proveedor' }), { target: { value: 'p2' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    const dto = onNext.mock.calls[0][0];
    expect(dto.proveedorId).toBe('p2');
    expect(dto.proveedor).toBeUndefined();
  });

  it('con proveedores registrados bloquea el submit si no se elige ninguno', () => {
    mockProviders = [{ _id: 'p1', Razonsocial: 'ACME SAS' }];
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fireEvent.change(screen.getByLabelText(/Tipo de actividad/i), { target: { value: 'calibracion' } });
    fireEvent.change(screen.getByLabelText(/Consecutivo/i), { target: { value: 'CAL-1' } });
    fireEvent.change(screen.getByLabelText(/^Fecha/i), { target: { value: '2026-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('"Otro (escribir)" muestra el campo de texto y envía solo el nombre', () => {
    mockProviders = [{ _id: 'p1', Razonsocial: 'ACME SAS' }];
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show={true} onClose={() => {}} onNext={onNext} />);
    fireEvent.change(screen.getByLabelText(/Tipo de actividad/i), { target: { value: 'calibracion' } });
    fireEvent.change(screen.getByLabelText(/Consecutivo/i), { target: { value: 'CAL-1' } });
    fireEvent.change(screen.getByLabelText(/^Fecha/i), { target: { value: '2026-01-15' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Proveedor' }), { target: { value: '__otro__' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del proveedor' }), { target: { value: 'Taller Externo' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    const dto = onNext.mock.calls[0][0];
    expect(dto.proveedor).toBe('Taller Externo');
    expect(dto.proveedorId).toBeUndefined();
  });
});

describe('CrearActividadExternaModal - estado operativo', () => {
  it('asks for the operative state with the same options as a report, and keeps the result separate', () => {
    render(<CrearActividadExternaModal show onClose={() => {}} onNext={() => {}} />);
    const estado = screen.getByLabelText('Estado operativo *') as HTMLSelectElement;
    expect(Array.from(estado.options).map((o) => o.value)).toEqual(['Operativo', 'Fuera de Servicio', 'En Mantenimiento', 'Espera de Repuestos', 'En Reparacion']);
    const resultado = screen.getByLabelText('Resultado *') as HTMLSelectElement;
    expect(Array.from(resultado.options).map((o) => o.value)).toContain('aprobada');
    expect(screen.queryByLabelText(/Estado final/i)).toBeNull();
  });

  it('preselects the current state of the equipment, or Operativo when unknown', () => {
    const { unmount } = render(<CrearActividadExternaModal show onClose={() => {}} onNext={() => {}} estadoActual="En Reparacion" />);
    expect((screen.getByLabelText('Estado operativo *') as HTMLSelectElement).value).toBe('En Reparacion');
    unmount();
    render(<CrearActividadExternaModal show onClose={() => {}} onNext={() => {}} estadoActual="Dado de Baja" />);
    expect((screen.getByLabelText('Estado operativo *') as HTMLSelectElement).value).toBe('Operativo');
  });

  it('sends the chosen operative state with the activity', () => {
    const onNext = vi.fn();
    render(<CrearActividadExternaModal show onClose={() => {}} onNext={onNext} />);
    fillValid();
    fireEvent.change(screen.getByLabelText('Estado operativo *'), { target: { value: 'Fuera de Servicio' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onNext.mock.calls[0][0].estadoOperativo).toBe('Fuera de Servicio');
    expect(onNext.mock.calls[0][0].estadoFinal).toBe('aprobada');
  });

  it('the custom result label follows the new name', () => {
    render(<CrearActividadExternaModal show onClose={() => {}} onNext={() => {}} />);
    fireEvent.change(screen.getByLabelText('Resultado *'), { target: { value: 'otro' } });
    expect(screen.getByLabelText('Especifica el resultado *')).toBeInTheDocument();
  });
});
