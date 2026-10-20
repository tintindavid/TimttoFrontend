import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProveedorSelect, { type ProveedorValue } from '../ProveedorSelect';
import CambiarProveedorModal from '../CambiarProveedorModal';
import type { ActividadExterna } from '@/types/actividadExterna.types';

let mockProviders: { _id: string; Razonsocial: string }[] = [];
const mockUseCustomers = vi.fn();
const mockCreate = vi.fn();
vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: (params: unknown) => { mockUseCustomers(params); return { data: { data: mockProviders } }; },
  useCreateCustomer: () => ({ mutateAsync: mockCreate, isLoading: false }),
}));

const Harness: React.FC<{ initial?: ProveedorValue; spy?: (v: ProveedorValue) => void }> = ({ initial = {}, spy }) => {
  const [value, setValue] = useState<ProveedorValue>(initial);
  return <ProveedorSelect value={value} onChange={(v) => { setValue(v); spy?.(v); }} />;
};

beforeEach(() => {
  mockProviders = [{ _id: 'p1', Razonsocial: 'ACME SAS' }, { _id: 'p2', Razonsocial: 'Metrologia SA' }];
  mockUseCustomers.mockClear();
  mockCreate.mockReset();
});

describe('ProveedorSelect', () => {
  it('asks only for providers of the tenant', () => {
    render(<Harness />);
    expect(mockUseCustomers).toHaveBeenCalledWith(expect.objectContaining({ kind: 'provider' }));
  });

  it('lists the providers plus the free-text option', () => {
    render(<Harness />);
    const select = screen.getByRole('combobox', { name: 'Proveedor' }) as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
      'Selecciona un proveedor', 'ACME SAS', 'Metrologia SA', '+ Crear proveedor', 'Otro (escribir)',
    ]);
  });

  it('choosing a provider reports its id and no name', () => {
    const spy = vi.fn();
    render(<Harness spy={spy} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Proveedor' }), { target: { value: 'p1' } });
    expect(spy).toHaveBeenLastCalledWith({ proveedorId: 'p1', proveedor: undefined });
    expect(screen.queryByRole('textbox', { name: 'Nombre del proveedor' })).toBeNull();
  });

  it('"Otro (escribir)" shows the text input and clears the id', () => {
    const spy = vi.fn();
    render(<Harness initial={{ proveedorId: 'p1' }} spy={spy} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Proveedor' }), { target: { value: '__otro__' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del proveedor' }), { target: { value: 'Taller' } });
    expect(spy).toHaveBeenLastCalledWith({ proveedorId: undefined, proveedor: 'Taller' });
  });

  it('starts in free-text mode when the value has only a name', () => {
    render(<Harness initial={{ proveedor: 'Viejo SA' }} />);
    expect(screen.getByRole('textbox', { name: 'Nombre del proveedor' })).toHaveValue('Viejo SA');
  });

  it('a tenant without providers still gets the select, with the create and free-text options', () => {
    mockProviders = [];
    render(<Harness />);
    const select = screen.getByRole('combobox', { name: 'Proveedor' }) as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
      'Selecciona un proveedor', '+ Crear proveedor', 'Otro (escribir)',
    ]);
    expect(screen.queryByRole('textbox', { name: 'Nombre del proveedor' })).toBeNull();
  });

  it('"+ Crear proveedor" opens the creation dialog without changing the value', () => {
    const spy = vi.fn();
    render(<Harness spy={spy} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Proveedor' }), { target: { value: '__crear__' } });
    expect(screen.getByText('Crear proveedor', { selector: '.modal-title' })).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('creating a provider selects it right away, even before the list refetches', async () => {
    mockCreate.mockResolvedValue({ data: { _id: 'pNew', Razonsocial: 'Nuevo Lab SAS' } });
    const spy = vi.fn();
    render(<Harness spy={spy} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Proveedor' }), { target: { value: '__crear__' } });
    fireEvent.change(screen.getByLabelText('Razón social *'), { target: { value: 'Nuevo Lab SAS' } });
    fireEvent.change(screen.getByLabelText('NIT *'), { target: { value: '900123456' } });
    fireEvent.change(screen.getByLabelText('Ciudad *'), { target: { value: 'Bogota' } });
    fireEvent.change(screen.getByLabelText('Departamento *'), { target: { value: 'Cundinamarca' } });
    fireEvent.change(screen.getByLabelText('Correo *'), { target: { value: 'lab@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear proveedor' }));
    await screen.findByRole('option', { name: 'Nuevo Lab SAS' });
    expect(spy).toHaveBeenLastCalledWith({ proveedorId: 'pNew', proveedor: undefined });
    expect((screen.getByRole('combobox', { name: 'Proveedor' }) as HTMLSelectElement).value).toBe('pNew');
    const fd = mockCreate.mock.calls[0][0] as FormData;
    expect(fd.get('kind')).toBe('provider');
    expect(fd.get('Nit')).toBe('900123456');
  });
});

const actividad = (over: Partial<ActividadExterna> = {}): ActividadExterna => ({
  _id: 'a1', tenantId: 't', clienteId: 'c', equipoId: 'e', cadenaId: 'cad', tipo: 'calibracion',
  consecutivoExterno: 'CAL-9', fecha: '2026-01-15T00:00:00.000Z', proveedor: 'Viejo SA', estadoFinal: 'aprobada',
  esInicioCadena: true, createdByUserId: 'u', createdAt: '', updatedAt: '',
  ...over,
});

describe('CambiarProveedorModal', () => {
  it('is closed without an activity', () => {
    render(<CambiarProveedorModal actividad={null} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.queryByText('Cambiar proveedor')).toBeNull();
  });

  it('shows the current provider and saves a linked provider with only the id', () => {
    const onSave = vi.fn();
    render(<CambiarProveedorModal actividad={actividad()} onClose={vi.fn()} onSave={onSave} />);
    expect(screen.getByText('Viejo SA')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Proveedor' }), { target: { value: 'p2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onSave).toHaveBeenCalledWith({ proveedorId: 'p2' });
  });

  it('saves a free-text name when no provider is chosen', () => {
    const onSave = vi.fn();
    render(<CambiarProveedorModal actividad={actividad()} onClose={vi.fn()} onSave={onSave} />);
    // The activity has a free-text provider, so the dialog starts in the free-text option
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del proveedor' }), { target: { value: '  Nuevo Taller ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onSave).toHaveBeenCalledWith({ proveedor: 'Nuevo Taller' });
  });

  it('does not save an empty provider', () => {
    const onSave = vi.fn();
    render(<CambiarProveedorModal actividad={actividad()} onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del proveedor' }), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Selecciona un proveedor o escribe el nombre.')).toBeInTheDocument();
  });

  it('starts on the linked provider when the activity has one', () => {
    render(<CambiarProveedorModal actividad={actividad({ proveedorId: 'p1', proveedor: 'ACME SAS' })} onClose={vi.fn()} onSave={vi.fn()} />);
    expect((screen.getByRole('combobox', { name: 'Proveedor' }) as HTMLSelectElement).value).toBe('p1');
  });
});
