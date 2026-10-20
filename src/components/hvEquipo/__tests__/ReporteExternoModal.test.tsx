import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReporteExternoModal from '../ReporteExternoModal';

const mutateAsync = vi.fn();
// Rejections come from a plain function: vitest reports a rejection produced by a spy as unhandled even when caught.
const { rejection } = vi.hoisted(() => ({ rejection: { value: null as Error | null } }));
vi.mock('@/hooks/useReporteExterno', () => ({
  useCreateReporteExterno: () => ({
    mutateAsync: (...args: unknown[]) => (rejection.value ? new Promise((_, reject) => { reject(rejection.value); }) : mutateAsync(...args)),
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({ data: { data: [{ _id: 'p1', Razonsocial: 'Metrologia Andina SAS' }] } }),
  useCreateCustomer: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));

// The real editor is covered by its own tests; here it only feeds rows to the form.
vi.mock('@/components/ots/VerificationParamsEditor', () => ({
  default: ({ mode, onChange, equipoId }: { mode?: string; onChange?: (rows: unknown[]) => void; equipoId?: string }) => (
    <button type="button" data-testid="editor-parametros" data-mode={mode} data-equipo={equipoId}
      onClick={() => onChange?.([{ magnitud: 'Presion', unidad: 'mmHg', valorReferencia: 120, valorMedido: 118.5, patron: 'Fluke' }])}>
      editor
    </button>
  ),
}));

const setup = (props: Partial<React.ComponentProps<typeof ReporteExternoModal>> = {}) => {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<ReporteExternoModal show tipoMtto="Preventivo" equipoId="eq1" onClose={onClose} onSaved={onSaved} {...props} />);
  return { onClose, onSaved };
};

const pickProvider = () => fireEvent.change(screen.getByRole('combobox', { name: 'Proveedor' }), { target: { value: 'p1' } });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar servicio' }));

beforeEach(() => {
  rejection.value = null;
  mutateAsync.mockReset();
  mutateAsync.mockResolvedValue({ success: true, data: {}, warnings: [] });
});

describe('ReporteExternoModal - fechaInicial (carga rapida desde el cronograma)', () => {
  it('starts on the given date', () => {
    setup({ fechaInicial: '2026-03-31' });
    expect((screen.getByLabelText('Fecha del servicio *') as HTMLInputElement).value).toBe('2026-03-31');
  });

  it('a date after today is ignored and the form starts today', () => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    const future = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setup({ fechaInicial: future });
    const today = new Date();
    const hoy = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect((screen.getByLabelText('Fecha del servicio *') as HTMLInputElement).value).toBe(hoy);
  });

  it('without it the form starts today, as before', () => {
    setup();
    const today = new Date();
    const hoy = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect((screen.getByLabelText('Fecha del servicio *') as HTMLInputElement).value).toBe(hoy);
  });
});

describe('ReporteExternoModal', () => {
  it('shows the automatic consecutive as read-only and the third party document number as an input', () => {
    setup();
    const consecutivo = screen.getByLabelText('Consecutivo') as HTMLInputElement;
    expect(consecutivo.readOnly).toBe(true);
    expect(consecutivo.value).toBe('Se asigna al guardar');
    expect(screen.getByLabelText('N.º de documento del tercero')).toBeInTheDocument();
  });

  it('preventive has the verification-parameters section (draft editor), corrective does not', () => {
    const { unmount } = render(<ReporteExternoModal show tipoMtto="Preventivo" equipoId="eq1" onClose={vi.fn()} />);
    expect(screen.getByTestId('seccion-verificacion')).toBeInTheDocument();
    expect(screen.getByTestId('editor-parametros').getAttribute('data-mode')).toBe('draft');
    expect(screen.getByTestId('editor-parametros').getAttribute('data-equipo')).toBe('eq1');
    unmount();
    render(<ReporteExternoModal show tipoMtto="Correctivo" equipoId="eq1" onClose={vi.fn()} />);
    expect(screen.queryByTestId('seccion-verificacion')).toBeNull();
    expect(screen.getByText('Adicionar mantenimiento correctivo externo')).toBeInTheDocument();
  });

  it('preselects the current operative state of the equipment, or Operativo', () => {
    const { unmount } = render(<ReporteExternoModal show tipoMtto="Correctivo" equipoId="eq1" estadoActual="Fuera de Servicio" onClose={vi.fn()} />);
    expect((screen.getByLabelText('Estado operativo *') as HTMLSelectElement).value).toBe('Fuera de Servicio');
    unmount();
    render(<ReporteExternoModal show tipoMtto="Correctivo" equipoId="eq1" estadoActual="Dado de Baja" onClose={vi.fn()} />);
    expect((screen.getByLabelText('Estado operativo *') as HTMLSelectElement).value).toBe('Operativo');
  });

  it('the date cannot be later than today', () => {
    setup();
    const today = new Date().toISOString().slice(0, 10);
    expect((screen.getByLabelText('Fecha del servicio *') as HTMLInputElement).max).toBe(today);
  });

  it('requires a provider', () => {
    setup();
    save();
    expect(screen.getByText('Selecciona un proveedor o escribe el nombre.')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('rejects a future date', () => {
    setup();
    pickProvider();
    const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText('Fecha del servicio *'), { target: { value: future } });
    save();
    expect(screen.getByText('La fecha del servicio no puede ser futura.')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('rejects an empty date', () => {
    setup();
    pickProvider();
    fireEvent.change(screen.getByLabelText('Fecha del servicio *'), { target: { value: '' } });
    save();
    expect(screen.getByText('Indica la fecha del servicio.')).toBeInTheDocument();
  });

  it('sends a preventive service with a registered provider, the document number and the parameters', async () => {
    const { onSaved } = setup();
    pickProvider();
    fireEvent.change(screen.getByLabelText('Fecha del servicio *'), { target: { value: '2026-03-12' } });
    fireEvent.change(screen.getByLabelText('Estado operativo *'), { target: { value: 'En Mantenimiento' } });
    fireEvent.change(screen.getByLabelText('N.º de documento del tercero'), { target: { value: ' CERT-889 ' } });
    fireEvent.change(screen.getByLabelText('Observación'), { target: { value: 'Todo ok' } });
    fireEvent.click(screen.getByTestId('editor-parametros'));
    save();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    const { dto, file } = mutateAsync.mock.calls[0][0];
    expect(dto).toMatchObject({
      tipoMtto: 'Preventivo', fecha: '2026-03-12', estadoOperativo: 'En Mantenimiento', proveedorId: 'p1',
      consecutivoDocumento: 'CERT-889', observacion: 'Todo ok',
    });
    expect(dto.proveedor).toBeUndefined();
    expect(dto.verificationParam).toHaveLength(1);
    expect(dto.verificationParam[0].valorMedido).toBe(118.5);
    expect(file).toBeUndefined();
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith([]));
  });

  it('a corrective service never sends parameters', async () => {
    setup({ tipoMtto: 'Correctivo' });
    pickProvider();
    save();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].dto.verificationParam).toBeUndefined();
    expect(mutateAsync.mock.calls[0][0].dto.tipoMtto).toBe('Correctivo');
  });

  it('a free-text provider sends only the name', async () => {
    setup();
    fireEvent.change(screen.getByRole('combobox', { name: 'Proveedor' }), { target: { value: '__otro__' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del proveedor' }), { target: { value: '  Taller Libre ' } });
    save();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const { dto } = mutateAsync.mock.calls[0][0];
    expect(dto.proveedor).toBe('Taller Libre');
    expect(dto.proveedorId).toBeUndefined();
  });

  it('passes the schedule warnings back to the page', async () => {
    mutateAsync.mockResolvedValue({ success: true, data: {}, warnings: ['MES_FUERA_DE_CRONOGRAMA'] });
    const { onSaved } = setup();
    pickProvider();
    save();
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(['MES_FUERA_DE_CRONOGRAMA']));
  });

  it('shows the server message and stays open when saving fails', async () => {
    rejection.value = Object.assign(new Error('x'), { response: { data: { message: 'Proveedor no encontrado', error: { code: 'CUSTOMER_NOT_FOUND' } } } });
    const { onSaved } = setup();
    pickProvider();
    save();
    expect(await screen.findByText('Proveedor no encontrado')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('explains a disabled capability', async () => {
    rejection.value = Object.assign(new Error('x'), { response: { data: { message: 'raw', error: { code: 'CAPABILITY_DISABLED' } } } });
    setup();
    pickProvider();
    save();
    expect(await screen.findByText(/no tiene habilitado el registro de servicios de terceros/)).toBeInTheDocument();
  });

  it('cancel closes without saving', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});

describe('ReporteExternoModal - months guide', () => {
  it('preventive shows the scheduled months and outlines the month of the chosen date', () => {
    render(<ReporteExternoModal show tipoMtto="Preventivo" equipoId="eq1" mesesMtto={['mar', 'sep']} mesesRealizados={[]} onClose={vi.fn()} />);
    expect(screen.getByTestId('barra-meses')).toBeInTheDocument();
    const mes = (m: string) => screen.getAllByTestId('mes-programado').find((b) => b.getAttribute('data-mes') === m) as HTMLElement;
    expect(mes('mar').getAttribute('data-estado')).toBe('programado');
    fireEvent.change(screen.getByLabelText('Fecha del servicio *'), { target: { value: '2026-09-02' } });
    expect(mes('sep').getAttribute('data-seleccionado')).toBe('true');
  });

  it('marks a scheduled month as done when there is already a report of that month and year', () => {
    render(<ReporteExternoModal show tipoMtto="Preventivo" equipoId="eq1" mesesMtto={['mar']} mesesRealizados={[{ mes: 'mar', fecha: '2026-03-12T00:00:00.000Z' }]} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Fecha del servicio *'), { target: { value: '2026-03-20' } });
    const marzo = screen.getAllByTestId('mes-programado').find((b) => b.getAttribute('data-mes') === 'mar') as HTMLElement;
    expect(marzo.getAttribute('data-estado')).toBe('hecho');
  });

  it('the corrective form has no months guide', () => {
    render(<ReporteExternoModal show tipoMtto="Correctivo" equipoId="eq1" mesesMtto={['mar']} onClose={vi.fn()} />);
    expect(screen.queryByTestId('barra-meses')).toBeNull();
  });

  it('an equipment without scheduled months says so instead of an empty bar', () => {
    render(<ReporteExternoModal show tipoMtto="Preventivo" equipoId="eq1" mesesMtto={[]} onClose={vi.fn()} />);
    expect(screen.getByText('Este equipo no tiene meses de mantenimiento programados.')).toBeInTheDocument();
  });
});
