import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const createActividadMutateMock = vi.fn();
const refetchActividadesMock = vi.fn().mockResolvedValue({});
const useActividadesMock = vi.fn();

vi.mock('@/hooks/useProtocols', () => ({
  useProtocol: () => ({ data: null, isLoading: false }),
  useCreateProtocol: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateProtocol: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));

vi.mock('@/hooks/useActividades', () => ({
  useActividades: (...args: any[]) => useActividadesMock(...args),
  useCreateActividad: () => ({ mutateAsync: createActividadMutateMock, isLoading: false }),
}));

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn() },
}));

import ProtocolFormPage from './ProtocolFormPage';

const renderCreate = () =>
  render(
    <MemoryRouter initialEntries={['/protocols/new']}>
      <Routes>
        <Route path="/protocols/new" element={<ProtocolFormPage />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  createActividadMutateMock.mockReset();
  refetchActividadesMock.mockClear();
  useActividadesMock.mockReset();
});

describe('ProtocolFormPage — auto-select newly created activity', () => {
  it('auto-checks the new activity in the picker after the create-activity modal succeeds', async () => {
    // The picker always renders both activities. Initially none is checked;
    // after creating "Purga de aire", it must become checked.
    useActividadesMock.mockReturnValue({
      data: {
        data: [
          { _id: 'act-existing', Nombre: 'Existing', Descripcion: '' },
          { _id: 'act-new', Nombre: 'Purga de aire', Descripcion: '' },
        ],
      },
      isLoading: false,
      error: null,
      refetch: refetchActividadesMock,
    });

    createActividadMutateMock.mockResolvedValue({
      data: { _id: 'act-new', Nombre: 'Purga de aire', Descripcion: '', EsObligatoria: false },
    });

    renderCreate();

    // Precondition: selected-count badge starts at 0.
    expect(screen.getByText(/0 actividades seleccionadas/i)).toBeInTheDocument();

    // Precondition: the "Purga de aire" activity label is rendered but its
    // associated checkbox is NOT checked. Query by the label text and walk
    // to its bound input (Form.Check emits <input><label for=id>).
    const purgaLabelBefore = screen.getByText('Purga de aire');
    const purgaCheckboxBefore = purgaLabelBefore
      .closest('.form-check')!
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(purgaCheckboxBefore.checked).toBe(false);

    // Open the "+ Crear actividad" modal
    fireEvent.click(screen.getByRole('button', { name: /crear actividad/i }));

    // Fill + submit the modal form
    const modal = await screen.findByRole('dialog');
    fireEvent.change(within(modal).getByPlaceholderText(/nombre de la actividad/i), {
      target: { value: 'Purga de aire' },
    });
    fireEvent.click(within(modal).getByRole('button', { name: /^crear$/i }));

    // After the flow settles, the badge should reflect exactly one selection
    await waitFor(() =>
      expect(screen.getByText(/1 actividades seleccionadas/i)).toBeInTheDocument()
    );

    // …and the "Purga de aire" checkbox is now checked
    const purgaLabelAfter = screen.getByText('Purga de aire');
    const purgaCheckboxAfter = purgaLabelAfter
      .closest('.form-check')!
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(purgaCheckboxAfter.checked).toBe(true);

    // The pre-existing activity must remain unchecked
    const existingLabel = screen.getByText('Existing');
    const existingCheckbox = existingLabel
      .closest('.form-check')!
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(existingCheckbox.checked).toBe(false);
  });
});
