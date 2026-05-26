import React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VerificationParamsEditor from './VerificationParamsEditor';

const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useReportes', () => ({
  useUpdateVerificationParams: () => ({
    mutateAsync: mockMutateAsync,
    isLoading: false,
  }),
}));

afterEach(() => {
  cleanup();
  mockMutateAsync.mockReset();
});

const renderWithClient = (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('VerificationParamsEditor', () => {
  test('renders one row per item in value', () => {
    const { container } = renderWithClient(
      <VerificationParamsEditor
        reporteId="r1"
        value={[
          { magnitud: 'Voltaje', unidad: 'V', valorReferencia: 12, valorMedido: 12.6, patron: 'Fluke' },
          { magnitud: 'Presión', unidad: 'PSI', valorReferencia: 120, valorMedido: 119, patron: 'Gauge' },
        ]}
      />
    );
    const dataRows = container.querySelectorAll('tbody tr');
    expect(dataRows.length).toBe(2);
  });

  test('cascade pre-fill on "+": new row copies magnitud, unidad and patron from previous', () => {
    const { container, getByRole } = renderWithClient(
      <VerificationParamsEditor
        reporteId="r1"
        value={[
          { magnitud: 'Voltaje', unidad: 'V', valorReferencia: 12, valorMedido: 12.6, patron: 'Fluke 87V' },
        ]}
      />
    );

    const addBtn = getByRole('button', { name: /Agregar par/ });
    fireEvent.click(addBtn);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const inputs = rows[1].querySelectorAll('input');
    // magnitud, unidad, valorReferencia, valorMedido, patron
    expect((inputs[0] as HTMLInputElement).value).toBe('Voltaje');
    expect((inputs[1] as HTMLInputElement).value).toBe('V');
    expect((inputs[2] as HTMLInputElement).value).toBe('');
    expect((inputs[3] as HTMLInputElement).value).toBe('');
    expect((inputs[4] as HTMLInputElement).value).toBe('Fluke 87V');
  });

  test('delete row removes it from the table', () => {
    const { container, getAllByLabelText } = renderWithClient(
      <VerificationParamsEditor
        reporteId="r1"
        value={[
          { magnitud: 'A', unidad: 'V', valorReferencia: 1, valorMedido: 2, patron: 'p' },
          { magnitud: 'B', unidad: 'V', valorReferencia: 1, valorMedido: 2, patron: 'p' },
        ]}
      />
    );

    expect(container.querySelectorAll('tbody tr').length).toBe(2);
    const deleteButtons = getAllByLabelText('Eliminar fila');
    fireEvent.click(deleteButtons[0]);
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
  });

  test('Guardar invokes mutation with sanitized payload (numbers, not strings)', async () => {
    mockMutateAsync.mockResolvedValue({ success: true, data: { verificationParam: [] } });

    const { container, getByRole } = renderWithClient(
      <VerificationParamsEditor
        reporteId="r1"
        value={[
          { magnitud: 'Voltaje', unidad: 'V', valorReferencia: 12, valorMedido: 12, patron: 'Fluke' },
        ]}
      />
    );

    // Edit valorMedido to mark dirty
    const inputs = container.querySelectorAll('tbody tr input');
    fireEvent.change(inputs[3], { target: { value: '12.6' } });

    const saveBtn = getByRole('button', { name: /Guardar/ });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    const callArg = mockMutateAsync.mock.calls[0][0];
    expect(callArg.reporteId).toBe('r1');
    expect(callArg.verificationParam[0].valorMedido).toBe(12.6);
    expect(typeof callArg.verificationParam[0].valorMedido).toBe('number');
  });

  test('parent re-render with a fresh-but-equivalent `[]` does NOT wipe a row the user just added (regression)', () => {
    // This reproduces the bug reported by the user: clicking "+ Agregar parámetro"
    // appeared to add a row that disappeared immediately, because the parent
    // re-renders with `value={editedReporte.verificationParam ?? []}` — the `??`
    // returns a NEW array literal on every render, which broke a naive
    // `useEffect([value])` that reset local state on every parent render.
    const { container, getByRole, rerender } = renderWithClient(
      <VerificationParamsEditor reporteId="r1" value={[]} />
    );

    fireEvent.click(getByRole('button', { name: /Agregar par/ }));
    expect(container.querySelectorAll('tbody tr').length).toBe(1);

    // Parent re-renders with a brand-new empty array reference (same content).
    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <VerificationParamsEditor reporteId="r1" value={[]} />
      </QueryClientProvider>
    );

    // The row the user added must still be there.
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
  });

  test('parent passing a TRULY different value (different content) does reset local state', () => {
    const { container, rerender } = renderWithClient(
      <VerificationParamsEditor reporteId="r1" value={[]} />
    );

    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <VerificationParamsEditor
          reporteId="r1"
          value={[
            { magnitud: 'Voltaje', unidad: 'V', valorReferencia: 12, valorMedido: 12.6, patron: 'Fluke' },
          ]}
        />
      </QueryClientProvider>
    );

    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    const inputs = container.querySelectorAll('tbody tr input');
    expect((inputs[0] as HTMLInputElement).value).toBe('Voltaje');
  });

  test('disabled hides editing affordances', () => {
    const { container, queryByRole } = renderWithClient(
      <VerificationParamsEditor
        reporteId="r1"
        value={[
          { magnitud: 'A', unidad: 'V', valorReferencia: 1, valorMedido: 2, patron: 'p' },
        ]}
        disabled
      />
    );
    const inputs = container.querySelectorAll('tbody tr input');
    inputs.forEach((input) => expect((input as HTMLInputElement).disabled).toBe(true));
    const saveBtn = queryByRole('button', { name: /Guardar/ });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
