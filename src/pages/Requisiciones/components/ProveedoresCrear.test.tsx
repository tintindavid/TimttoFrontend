/** Crear proveedor desde los selectores de licitación y compra directa: el creado queda seleccionado. */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AsignarProveedorModal from './AsignarProveedorModal';
import CompraDirectaModal from './CompraDirectaModal';
import type { Requisicion } from '@/types/requisicion.types';

const NUEVO = { _id: 'nuevo1', Razonsocial: 'Proveedor Nuevo SAS', Email: 'ventas@nuevo.co' };
const asignar = vi.fn();

vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({ data: { data: [{ _id: 'p1', Razonsocial: 'Proveedor Uno' }] }, isLoading: false, isError: false }),
}));
vi.mock('@/hooks/useLicitacion', () => ({
  useAsignarProveedor: () => ({ mutateAsync: asignar, isLoading: false }),
  useCompraDirecta: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
// The real dialog is covered by its own tests: here it only reports a created provider.
vi.mock('@/components/customers/CrearProveedorModal', () => ({
  default: ({ show, onCreated }: { show: boolean; onCreated: (p: unknown) => void }) =>
    show ? <button onClick={() => onCreated(NUEVO)}>simular-creado</button> : null,
}));

describe('crear proveedor desde el selector', () => {
  beforeEach(() => asignar.mockReset());

  it('asignar proveedor: ofrece crear, lista el creado, lo selecciona y autocompleta su correo', async () => {
    render(<AsignarProveedorModal show onHide={() => {}} requisicionId="r1" assignedIds={[]} />);
    const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    expect(screen.getByRole('option', { name: '+ Crear proveedor' })).toBeTruthy();
    fireEvent.change(select, { target: { value: '__crear__' } });
    fireEvent.click(await screen.findByText('simular-creado'));
    await waitFor(() => expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).toBe('nuevo1'));
    expect(screen.getByRole('option', { name: 'Proveedor Nuevo SAS' })).toBeTruthy();
    expect(screen.getByPlaceholderText('ventas@nuevo.co')).toBeTruthy();
  });

  it('compra directa: ofrece crear y deja seleccionado al proveedor creado', async () => {
    render(<CompraDirectaModal show onHide={() => {}} requisicion={{ _id: 'r1', licitacion: { proveedores: [] } } as unknown as Requisicion} />);
    expect(screen.getByRole('option', { name: '+ Crear proveedor' })).toBeTruthy();
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '__crear__' } });
    fireEvent.click(await screen.findByText('simular-creado'));
    await waitFor(() => expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).toBe('nuevo1'));
  });
});
