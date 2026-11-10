import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({ emitir: vi.fn(), editar: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn() }));

vi.mock('@/hooks/useOrdenCompra', () => ({
  useEmitirOrdenCompra: () => ({ mutateAsync: mocks.emitir, isLoading: false }),
  useEditarOrdenCompra: () => ({ mutateAsync: mocks.editar, isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError, warning: vi.fn() } }));

import OrdenCompraModal from './OrdenCompraModal';

const requisicion = (): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0042',
  titulo: 'Compra',
  tipoRequisicionId: 't1',
  areaId: 'a1',
  prioridad: 'Alta',
  estado: 'Adjudicada',
  creadaPor: 'creator',
  montoEstimado: 1000,
  moneda: 'COP',
  version: 1,
  lineas: [
    { _id: 'l1', descripcion: 'Rodamiento', unidad: 'und', cantidadSolicitada: 4, precioEstimado: 100 },
    { _id: 'l2', descripcion: 'Grasa', unidad: 'kg', cantidadSolicitada: 2, precioEstimado: 300 },
    { _id: 'l3', descripcion: 'Línea cancelada', unidad: 'und', cantidadSolicitada: 1, precioEstimado: 10, estadoLinea: 'Cancelada' },
  ],
  ordenCompra: {
    numero: 'OC-2026-0001',
    version: 1,
    estado: 'Emitida',
    lineas: [
      { lineaId: 'l1', descripcion: 'Rodamiento', cantidad: 4, precioUnitario: 120, subtotal: 480 },
      { lineaId: 'l2', descripcion: 'Grasa', cantidad: 2, precioUnitario: 310, subtotal: 620 },
    ],
    total: 1100,
    condiciones: 'Pago a 30 días',
    fechaEntrega: '2099-01-15T00:00:00.000Z',
    requiereEntregables: true,
  },
});

const renderModal = (mode: 'emitir' | 'editar', onHide = vi.fn()) =>
  render(<OrdenCompraModal show onHide={onHide} requisicion={requisicion()} mode={mode} />);

describe('OrdenCompraModal', () => {
  beforeEach(() => {
    mocks.emitir.mockReset().mockResolvedValue({});
    mocks.editar.mockReset().mockResolvedValue({});
    mocks.toastError.mockReset();
    mocks.toastSuccess.mockReset();
  });

  it('starts with blank prices, skips cancelled lines and keeps submit disabled', async () => {
    renderModal('emitir');
    expect(await screen.findByLabelText('Precio unitario de Rodamiento')).toHaveValue(null);
    expect(screen.getByLabelText('Precio unitario de Grasa')).toHaveValue(null);
    expect(screen.queryByLabelText('Precio unitario de Línea cancelada')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Emitir orden' })).toBeDisabled();
  });

  it('computes the live total and enables submit once every price and the date are set', async () => {
    const user = userEvent.setup();
    renderModal('emitir');
    await user.type(await screen.findByLabelText('Precio unitario de Rodamiento'), '120');
    await user.type(screen.getByLabelText('Precio unitario de Grasa'), '310');
    expect(screen.getByTestId('oc-modal-total').textContent).toContain('1.100');
    expect(screen.getByRole('button', { name: 'Emitir orden' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Fecha de entrega/), { target: { value: '2099-01-15' } });
    expect(screen.getByRole('button', { name: 'Emitir orden' })).toBeEnabled();
  });

  it('totals decimal prices in integer cents (matches the server)', async () => {
    const user = userEvent.setup();
    renderModal('emitir');
    await user.type(await screen.findByLabelText('Precio unitario de Rodamiento'), '120.5');
    await user.type(screen.getByLabelText('Precio unitario de Grasa'), '310.25');
    expect(screen.getByTestId('oc-modal-total').textContent).toBe(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(1102.5));
  });

  it('rejects a negative price', async () => {
    const user = userEvent.setup();
    renderModal('emitir');
    await user.type(await screen.findByLabelText('Precio unitario de Rodamiento'), '-5');
    await user.type(screen.getByLabelText('Precio unitario de Grasa'), '10');
    fireEvent.change(screen.getByLabelText(/Fecha de entrega/), { target: { value: '2099-01-15' } });
    expect(screen.getByRole('button', { name: 'Emitir orden' })).toBeDisabled();
  });

  it('blocks a delivery date in the past', async () => {
    const user = userEvent.setup();
    renderModal('emitir');
    await user.type(await screen.findByLabelText('Precio unitario de Rodamiento'), '1');
    await user.type(screen.getByLabelText('Precio unitario de Grasa'), '1');
    fireEvent.change(screen.getByLabelText(/Fecha de entrega/), { target: { value: '2000-01-01' } });
    expect(screen.getByText('La fecha de entrega no puede ser anterior a hoy.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Emitir orden' })).toBeDisabled();
  });

  it('submits only line ids and prices (never quantity, total or number)', async () => {
    const onHide = vi.fn();
    const user = userEvent.setup();
    renderModal('emitir', onHide);
    await user.type(await screen.findByLabelText('Precio unitario de Rodamiento'), '120');
    await user.type(screen.getByLabelText('Precio unitario de Grasa'), '310.5');
    fireEvent.change(screen.getByLabelText(/Fecha de entrega/), { target: { value: '2099-01-15' } });
    await user.type(screen.getByLabelText('Condiciones'), '  Pago a 30 días ');
    await user.click(screen.getByRole('checkbox', { name: /Exigir entregables/ }));
    await user.click(screen.getByRole('button', { name: 'Emitir orden' }));
    await waitFor(() =>
      expect(mocks.emitir).toHaveBeenCalledWith({
        id: 'r1',
        data: {
          lineas: [
            { lineaId: 'l1', precioUnitario: 120 },
            { lineaId: 'l2', precioUnitario: 310.5 },
          ],
          condiciones: 'Pago a 30 días',
          fechaEntrega: '2099-01-15',
          requiereEntregables: true,
        },
      })
    );
    expect(onHide).toHaveBeenCalled();
  });

  it('prefills the current order when editing and sends the edit', async () => {
    const user = userEvent.setup();
    renderModal('editar');
    expect(await screen.findByLabelText('Precio unitario de Rodamiento')).toHaveValue(120);
    expect(screen.getByLabelText('Condiciones')).toHaveValue('Pago a 30 días');
    expect(screen.getByLabelText(/Fecha de entrega/)).toHaveValue('2099-01-15');
    expect(screen.getByRole('checkbox', { name: /Exigir entregables/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(mocks.editar).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' })));
    expect(mocks.emitir).not.toHaveBeenCalled();
  });

  it('keeps the modal open and shows the mapped error when the server answers SIN_REGLAS_APROBACION', async () => {
    mocks.emitir.mockRejectedValue({ response: { data: { error: { code: 'SIN_REGLAS_APROBACION' } } } });
    const onHide = vi.fn();
    const user = userEvent.setup();
    renderModal('emitir', onHide);
    await user.type(await screen.findByLabelText('Precio unitario de Rodamiento'), '1');
    await user.type(screen.getByLabelText('Precio unitario de Grasa'), '1');
    fireEvent.change(screen.getByLabelText(/Fecha de entrega/), { target: { value: '2099-01-15' } });
    await user.click(screen.getByRole('button', { name: 'Emitir orden' }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('reglas de aprobación')));
    expect(onHide).not.toHaveBeenCalled();
  });
});
