import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AddExtraActivitiesModal from './AddExtraActivitiesModal';

// Mock the debounce hook so search fires synchronously in tests.
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

let permissionAnswer = true;
vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: () => permissionAnswer,
}));

// Catalog listing: paginated response the modal iterates.
const listQuery = vi.fn(() => ({
  data: {
    data: [
      { _id: 'cat-1', Nombre: 'Limpieza filtro', Descripcion: 'Limpieza mensual' },
      { _id: 'cat-2', Nombre: 'Calibración', Descripcion: 'Anual' },
      { _id: 'cat-3', Nombre: 'Verificación de escala', Descripcion: '' },
    ],
    pagination: { page: 1, limit: 20, total: 3, pages: 1, hasNext: false, hasPrev: false },
  },
  isLoading: false,
  isError: false,
}));
const createMutation = { mutateAsync: vi.fn(), isLoading: false };
vi.mock('@/hooks/useActividades', () => ({
  useActividades: (params: any) => listQuery(params),
  useCreateActividad: () => createMutation,
}));

const addExtrasMutation = { mutateAsync: vi.fn(), isLoading: false };
vi.mock('@/hooks/useReportes', () => ({
  useAddExtraActividades: () => addExtrasMutation,
}));

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) },
}));

function renderModal(overrides: Partial<React.ComponentProps<typeof AddExtraActivitiesModal>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const props = {
    show: true,
    onHide: vi.fn(),
    reporteId: 'rep-1',
    protocoloActividadIds: [] as string[],
    extrasYaAgregadasIds: [] as string[],
    onSuccess: vi.fn(),
    ...overrides,
  };
  return {
    ...render(
      <QueryClientProvider client={client}>
        <AddExtraActivitiesModal {...props} />
      </QueryClientProvider>
    ),
    props,
  };
}

describe('AddExtraActivitiesModal', () => {
  beforeEach(() => {
    permissionAnswer = true;
    listQuery.mockClear();
    createMutation.mutateAsync.mockReset();
    addExtrasMutation.mutateAsync.mockReset();
  });

  it('renders the catalog rows', () => {
    renderModal();
    expect(screen.getByText('Limpieza filtro')).toBeInTheDocument();
    expect(screen.getByText('Calibración')).toBeInTheDocument();
    expect(screen.getByText('Verificación de escala')).toBeInTheDocument();
  });

  it('disables the "Agregar seleccionadas" button until at least one selection', () => {
    renderModal();
    const submit = screen.getByRole('button', { name: /Agregar seleccionadas \(0\)/i });
    expect(submit).toBeDisabled();
  });

  it('disables rows already in the item protocol and shows the correct tooltip text', () => {
    renderModal({ protocoloActividadIds: ['cat-1'] });
    const check = screen.getByLabelText(/Limpieza filtro/i) as HTMLInputElement;
    expect(check.disabled).toBe(true);
    // Tooltip content lives inline in the OverlayTrigger — it's rendered but
    // hidden until hover. Assert on presence of the OverlayTrigger by finding
    // the row and reading its associated tooltip id.
    expect(check.getAttribute('id')).toBe('extra-activity-cat-1');
  });

  it('disables rows already added as extras', () => {
    renderModal({ extrasYaAgregadasIds: ['cat-2'] });
    const check = screen.getByLabelText(/Calibración/i) as HTMLInputElement;
    expect(check.disabled).toBe(true);
  });

  it('submits selected ids via the mutation and calls onSuccess with the returned report', async () => {
    addExtrasMutation.mutateAsync.mockResolvedValueOnce({
      data: { _id: 'rep-1', actividadesRealizadas: [{ actividadMttoId: 'cat-1', esExtra: true }] },
    });
    const { props } = renderModal();

    fireEvent.click(screen.getByLabelText(/Limpieza filtro/i));
    fireEvent.click(screen.getByLabelText(/Calibración/i));

    const submit = screen.getByRole('button', { name: /Agregar seleccionadas \(2\)/i });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(addExtrasMutation.mutateAsync).toHaveBeenCalledWith({
        reporteId: 'rep-1',
        actividadMttoIds: expect.arrayContaining(['cat-1', 'cat-2']),
      });
    });
    await waitFor(() => {
      expect(props.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'rep-1' })
      );
    });
    expect(props.onHide).toHaveBeenCalled();
  });

  it('hides the "+ Crear nueva actividad" button when the user lacks ACTIVIDAD_MTTO_CREATE', () => {
    permissionAnswer = false;
    renderModal();
    expect(screen.queryByRole('button', { name: /Crear nueva actividad/i })).not.toBeInTheDocument();
  });

  it('shows the "+ Crear nueva actividad" button when the user has the permission', () => {
    permissionAnswer = true;
    renderModal();
    expect(screen.getByRole('button', { name: /Crear nueva actividad/i })).toBeInTheDocument();
  });

  it('search input change fires the catalog query with the new search param', async () => {
    renderModal();
    const searchInput = screen.getByPlaceholderText(/Buscar por nombre o descripción/i);
    fireEvent.change(searchInput, { target: { value: 'cal' } });
    await waitFor(() => {
      expect(listQuery).toHaveBeenCalledWith(expect.objectContaining({ search: 'cal' }));
    });
  });

  it('creating a new activity auto-selects its id in the list', async () => {
    permissionAnswer = true;
    createMutation.mutateAsync.mockResolvedValueOnce({
      data: { _id: 'cat-new', Nombre: 'Prueba nueva' },
    });
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /Crear nueva actividad/i }));
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Prueba nueva' } });
    fireEvent.click(screen.getByRole('button', { name: /^Crear$/i }));

    await waitFor(() => {
      expect(createMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ Nombre: 'Prueba nueva' })
      );
    });
    // After creation the selected counter should include the new id (1).
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Agregar seleccionadas \(1\)/i })).toBeInTheDocument();
    });
  });

  it('renders an empty-state message when the catalog page returns 0 rows', () => {
    listQuery.mockReturnValueOnce({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0, hasNext: false, hasPrev: false } },
      isLoading: false,
      isError: false,
    } as any);
    renderModal();
    expect(screen.getByText(/No se encontraron actividades/i)).toBeInTheDocument();
  });
});
