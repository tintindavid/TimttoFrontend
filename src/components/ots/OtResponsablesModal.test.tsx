import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OtResponsablesModal from './OtResponsablesModal';

const useOtProgramacionesMock = vi.fn();
const useSetOtProgramacionMock = vi.fn();
vi.mock('@/hooks/useOTs', () => ({
  useOtProgramaciones: (...args: any[]) => useOtProgramacionesMock(...args),
  useSetOtProgramacion: (...args: any[]) => useSetOtProgramacionMock(...args),
}));

const useUsersEligibleForMock = vi.fn();
vi.mock('@/hooks/useUsers', () => ({
  useUsersEligibleFor: (...args: any[]) => useUsersEligibleForMock(...args),
}));

// react-select renders a portal-based, virtualized listbox that is brittle
// to drive in jsdom. Stand in with plain toggle buttons — one per option —
// so tests interact with the same `onChange`/`value` contract the real
// component uses, without depending on react-select internals.
vi.mock('react-select', () => ({
  __esModule: true,
  default: (props: any) => (
    <div aria-label={props['aria-label']}>
      {(props.options || []).map((opt: any) => {
        const isSelected = (props.value || []).some((v: any) => v.value === opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              const next = isSelected
                ? (props.value || []).filter((v: any) => v.value !== opt.value)
                : [...(props.value || []), opt];
              props.onChange(next);
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  ),
}));

const todayStr = () => new Date().toISOString().slice(0, 10);
const daysFromToday = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const activeEntry = () => ({
  _id: 'prog-1',
  isActive: true,
  fechaInicio: daysFromToday(-30),
  fechaFin: daysFromToday(-1),
  responsables: [{ userId: 'u1', snapshotName: 'M. Duran' }],
  createdBy: 'admin-1',
  createdByName: 'Admin',
  createdAt: daysFromToday(-30),
});

const previousEntry = () => ({
  _id: 'prog-0',
  isActive: false,
  fechaInicio: daysFromToday(-90),
  fechaFin: daysFromToday(-31),
  responsables: [{ userId: 'u2', snapshotName: 'J. Perez' }],
  createdBy: null,
  createdByName: 'Sistema',
  createdAt: daysFromToday(-90),
});

const userOptions = [
  { _id: 'u1', firstName: 'Martin', lastName: 'Duran', email: 'martin@timtto.com', fullName: 'Martin Duran' },
  { _id: 'u2', firstName: 'Juan', lastName: 'Perez', email: 'juan@timtto.com', fullName: 'Juan Perez' },
];

const mutateAsyncMock = vi.fn();

beforeEach(() => {
  useOtProgramacionesMock.mockReset();
  useSetOtProgramacionMock.mockReset();
  useUsersEligibleForMock.mockReset();
  mutateAsyncMock.mockReset();

  useOtProgramacionesMock.mockReturnValue({
    data: { data: [activeEntry(), previousEntry()] },
    isLoading: false,
  });
  useUsersEligibleForMock.mockReturnValue({ data: { data: userOptions }, isLoading: false });
  useSetOtProgramacionMock.mockReturnValue({ mutateAsync: mutateAsyncMock, isLoading: false });
  mutateAsyncMock.mockResolvedValue({ data: {} });
});

const renderModal = (otId: string | null = 'ot-1') =>
  render(<OtResponsablesModal show onHide={vi.fn()} otId={otId} />);

describe('OtResponsablesModal', () => {
  it('renders the eligible responsables from useUsersEligibleFor', () => {
    renderModal();
    expect(screen.getByText('Martin Duran')).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });

  it('pre-loads the active roster as selected', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Martin Duran' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Juan Perez' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('rejects a new past fechaInicio and disables Guardar', () => {
    renderModal();
    const fechaInicioInput = screen.getByLabelText('Fecha inicio');
    fireEvent.change(fechaInicioInput, { target: { value: daysFromToday(-5) } });
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled();
  });

  it('preserves an unchanged past fechaInicio and keeps Guardar enabled', () => {
    renderModal();
    const fechaFinInput = screen.getByLabelText('Fecha fin');
    // Only fechaFin changes — fechaInicio (already in the past) is untouched.
    fireEvent.change(fechaFinInput, { target: { value: daysFromToday(5) } });
    expect(screen.getByRole('button', { name: /guardar/i })).toBeEnabled();
  });

  it('disables Guardar when the roster is emptied', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Martin Duran' })); // deselect the only responsable
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled();
  });

  it('submits setProgramacion with the correct body on Guardar', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Juan Perez' })); // add a 2nd responsable
    const fechaFinInput = screen.getByLabelText('Fecha fin');
    fireEvent.change(fechaFinInput, { target: { value: daysFromToday(10) } });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      otId: 'ot-1',
      data: {
        fechaInicio: activeEntry().fechaInicio,
        fechaFin: daysFromToday(10),
        responsableUserIds: ['u1', 'u2'],
      },
    });
  });

  it('shows the previous entry only after clicking "Ver historial de programación"', () => {
    renderModal();
    expect(screen.queryByText('J. Perez')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver historial de programación'));
    expect(screen.getByText('J. Perez')).toBeInTheDocument();
  });
});
