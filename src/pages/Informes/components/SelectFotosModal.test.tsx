import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/services/informe.service', () => ({
  informeService: { listEvidenciasByOt: vi.fn() },
}));

import { informeService } from '@/services/informe.service';
import { SelectFotosModal } from './SelectFotosModal';
import { EvidenciaCandidata } from '@/types/informe.types';

const mockList = informeService.listEvidenciasByOt as unknown as ReturnType<typeof vi.fn>;

function foto(i: number): EvidenciaCandidata {
  return {
    evidenciaId: `e${i}`,
    url: `https://x/${i}.jpg`,
    nombre: `foto${i}`,
    descripcion: '',
    reporteId: i <= 6 ? 'r1' : 'r2',
    reporteConsecutivo: i <= 6 ? 'R000001' : 'R000002',
    equipoNombre: 'Ventilador',
  };
}

function renderModal(props: Partial<React.ComponentProps<typeof SelectFotosModal>> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onConfirm = vi.fn();
  render(
    <QueryClientProvider client={qc}>
      <SelectFotosModal
        show
        onHide={() => {}}
        clienteId="c1"
        otIds={['ot1']}
        initialSelected={[]}
        onConfirm={onConfirm}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onConfirm };
}

describe('SelectFotosModal', () => {
  beforeEach(() => {
    mockList.mockReset();
  });

  it('blocks selection at 10 photos and allows removing one', async () => {
    const items = Array.from({ length: 12 }, (_, i) => foto(i + 1));
    mockList.mockResolvedValue({ items, total: 12, page: 1, limit: 24, hasMore: false });
    renderModal();

    for (let i = 1; i <= 10; i++) {
      fireEvent.click(await screen.findByRole('checkbox', { name: `Seleccionar foto foto${i}` }));
    }
    expect(screen.getByTestId('fotos-counter').textContent).toContain('10 de 10');
    expect(screen.getByRole('checkbox', { name: 'Seleccionar foto foto11' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Quitar foto foto1' }));
    expect(screen.getByTestId('fotos-counter').textContent).toContain('9 de 10');
    expect(screen.getByRole('checkbox', { name: 'Seleccionar foto foto11' })).not.toBeDisabled();
  });

  it('sends the report filter and search to the service', async () => {
    mockList.mockResolvedValue({ items: [foto(1), foto(7)], total: 2, page: 1, limit: 24, hasMore: false });
    renderModal();
    await screen.findByRole('checkbox', { name: 'Seleccionar foto foto1' });

    fireEvent.change(screen.getByLabelText('Filtrar por reporte'), { target: { value: 'r2' } });
    await waitFor(() =>
      expect(mockList).toHaveBeenLastCalledWith(expect.objectContaining({ reporteId: 'r2', page: 1 })),
    );

    fireEvent.change(screen.getByLabelText('Buscar fotos'), { target: { value: 'vent' } });
    await waitFor(() => expect(mockList).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'vent' })));
  });

  it('builds the report filter from the server-provided reportes', async () => {
    mockList.mockResolvedValue({
      items: [foto(1)],
      total: 1,
      page: 1,
      limit: 24,
      hasMore: false,
      reportes: [
        { reporteId: 'r1', consecutivo: 'R000001', equipoNombre: 'Ventilador' },
        { reporteId: 'r9', consecutivo: 'R000009', equipoNombre: 'Monitor' },
      ],
    });
    renderModal();
    await screen.findByRole('checkbox', { name: 'Seleccionar foto foto1' });
    expect(screen.getByRole('option', { name: 'R000009' })).toBeInTheDocument();
  });

  it('loads the next page with "Ver más"', async () => {
    mockList
      .mockResolvedValueOnce({ items: [foto(1)], total: 2, page: 1, limit: 24, hasMore: true })
      .mockResolvedValueOnce({ items: [foto(2)], total: 2, page: 2, limit: 24, hasMore: false });
    renderModal();
    fireEvent.click(await screen.findByRole('button', { name: 'Ver más' }));
    expect(await screen.findByRole('checkbox', { name: 'Seleccionar foto foto2' })).toBeInTheDocument();
    expect(mockList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('shows an empty state', async () => {
    mockList.mockResolvedValue({ items: [], total: 0, page: 1, limit: 24, hasMore: false });
    renderModal();
    expect(await screen.findByText(/No hay fotos disponibles/)).toBeInTheDocument();
  });

  it('confirms the chosen photos', async () => {
    mockList.mockResolvedValue({ items: [foto(1)], total: 1, page: 1, limit: 24, hasMore: false });
    const { onConfirm } = renderModal();
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Seleccionar foto foto1' }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/ }));
    expect(onConfirm).toHaveBeenCalledWith([expect.objectContaining({ evidenciaId: 'e1' })]);
  });
});
