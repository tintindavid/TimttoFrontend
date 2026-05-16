import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RepuestosSolicitadosPage from './RepuestosSolicitadosPage';

vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({ data: { data: [{ _id: 'c1', Razonsocial: 'Cliente Uno' }] } }),
}));

const mutateAsync = vi.fn().mockResolvedValue({});
vi.mock('@/hooks/useRepuestos', () => ({
  useRepuestosList: () => ({
    data: {
      data: [
        {
          _id: 'r1',
          nombre: 'Filtro A',
          EstadoSolicitud: 'Solicitado',
          Cantidad: '1',
          ClienteId: { Razonsocial: 'Cliente Uno' },
          EquipoId: { item: 'Equipo', Marca: 'Marca', Serie: '123' },
          ResponsableSolicitud: { firstName: 'Ana', lastName: 'Perez' },
          ReporteSolicitudId: 'rep1',
        },
      ],
      pagination: { page: 1, pages: 1 },
    },
    isLoading: false,
  }),
  useUpdateRepuesto: () => ({ mutateAsync }),
  useCreateOtFromRepuestos: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RepuestosSolicitadosPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('RepuestosSolicitadosPage', () => {
  it('renders list and filter controls', () => {
    renderPage();

    expect(screen.getByText('Repuestos solicitados')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar repuesto')).toBeInTheDocument();
    expect(screen.getByText('Filtro A')).toBeInTheDocument();
  });

  it('shows Create OT button when selecting a Solicitado repuesto', () => {
    renderPage();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(screen.getByText(/Crear OT \(1\)/)).toBeInTheDocument();
  });
});
