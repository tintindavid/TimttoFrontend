import React from 'react';
import { render, fireEvent, cleanup, waitFor, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VerificationParamsEditor from './VerificationParamsEditor';
import type { VerificationParam } from '@/types/reporte.types';

const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useReportes', () => ({
  useUpdateVerificationParams: () => ({ mutateAsync: mockMutateAsync, isLoading: false }),
}));

const mockSuggest = vi.fn();
vi.mock('@/services/verificationParams.service', () => ({
  verificationParamsService: { suggest: (...args: unknown[]) => mockSuggest(...args) },
}));

beforeEach(() => {
  mockSuggest.mockReset();
  mockSuggest.mockResolvedValue({ suggestions: [], source: null });
});

afterEach(() => {
  cleanup();
  mockMutateAsync.mockReset();
});

const renderWithClient = (ui: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('VerificationParamsEditor - draft mode', () => {
  test('works without a report id, has no save button and makes no save request', () => {
    renderWithClient(<VerificationParamsEditor mode="draft" value={[]} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Guardar/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Agregar par/ })).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('reports the rows to the parent as they are edited', () => {
    const onChange = vi.fn();
    const { container } = renderWithClient(<VerificationParamsEditor mode="draft" value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar par/ }));
    const medido = container.querySelector('input[aria-label="Valor medido"]') as HTMLInputElement;
    fireEvent.change(medido, { target: { value: '118.5' } });
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as VerificationParam[];
    expect(last).toHaveLength(1);
    expect(last[0].valorMedido).toBe(118.5);
    expect(last[0].valorReferencia).toBeNull();
  });

  test('keeps what the user typed when the parent feeds the rows back (no reset on every change)', () => {
    const Parent: React.FC = () => {
      const [rows, setRows] = React.useState<VerificationParam[]>([]);
      return <VerificationParamsEditor mode="draft" value={rows} onChange={setRows} />;
    };
    const { container } = renderWithClient(<Parent />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar par/ }));
    const medido = container.querySelector('input[aria-label="Valor medido"]') as HTMLInputElement;
    fireEvent.change(medido, { target: { value: '12' } });
    fireEvent.change(container.querySelector('input[aria-label="Valor medido"]') as HTMLInputElement, { target: { value: '123' } });
    expect((container.querySelector('input[aria-label="Valor medido"]') as HTMLInputElement).value).toBe('123');
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
  });

  test('starts from the initial rows', () => {
    const { container } = renderWithClient(
      <VerificationParamsEditor
        mode="draft"
        value={[{ magnitud: 'Voltaje', unidad: 'V', valorReferencia: 12, valorMedido: 12.6, patron: 'Fluke' }]}
      />,
    );
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
  });

  test('loads the template of the last report once when it starts empty and the equipment is known', async () => {
    mockSuggest.mockResolvedValue({
      suggestions: [{ magnitud: 'Voltaje', unidad: 'V', valorReferencia: 12, valorMedido: null, patron: 'Fluke' }],
      source: { consecutivo: 'R000010', fecha: '2026-01-10T00:00:00.000Z' },
    });
    const onChange = vi.fn();
    const { container } = renderWithClient(<VerificationParamsEditor mode="draft" value={[]} equipoId="eq1" onChange={onChange} />);
    await waitFor(() => expect(container.querySelectorAll('tbody tr').length).toBe(1));
    expect(mockSuggest).toHaveBeenCalledTimes(1);
    expect(mockSuggest).toHaveBeenCalledWith('eq1', undefined);
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as VerificationParam[];
    expect(last[0].magnitud).toBe('Voltaje');
    expect(last[0].valorMedido).toBeNull();
  });

  test('an empty template leaves the editor empty without errors', async () => {
    const { container } = renderWithClient(<VerificationParamsEditor mode="draft" value={[]} equipoId="eq1" />);
    await waitFor(() => expect(mockSuggest).toHaveBeenCalled());
    expect(container.querySelectorAll('tbody tr').length).toBe(1); // the "no parameters" placeholder row
    expect(screen.getByText(/Sin parámetros/)).toBeInTheDocument();
  });

  test('the manual button reloads the template', async () => {
    renderWithClient(<VerificationParamsEditor mode="draft" value={[]} equipoId="eq1" />);
    await waitFor(() => expect(mockSuggest).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: /Cargar del último reporte/ }));
    await waitFor(() => expect(mockSuggest).toHaveBeenCalledTimes(2));
  });
});

describe('VerificationParamsEditor - saved mode is unchanged', () => {
  test('with a report id it still shows the save button', () => {
    renderWithClient(<VerificationParamsEditor reporteId="r1" value={[{ magnitud: 'Voltaje', unidad: 'V', valorReferencia: 1, valorMedido: 1, patron: '' }]} />);
    expect(screen.getByRole('button', { name: /Guardar/ })).toBeInTheDocument();
  });

  test('it does not call onChange (only draft mode does)', () => {
    const onChange = vi.fn();
    renderWithClient(<VerificationParamsEditor reporteId="r1" value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar par/ }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
