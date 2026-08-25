import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CronogramaDownloadModal from './CronogramaDownloadModal';

describe('CronogramaDownloadModal', () => {
  it('renders both PDF and Excel buttons', () => {
    render(
      <CronogramaDownloadModal
        show
        onHide={vi.fn()}
        onDescargarPDF={vi.fn()}
        onDescargarExcel={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /excel/i })).toBeInTheDocument();
  });

  it('calls onDescargarPDF and closes when the PDF button is clicked', async () => {
    const onDescargarPDF = vi.fn().mockResolvedValue(undefined);
    const onHide = vi.fn();
    render(
      <CronogramaDownloadModal
        show
        onHide={onHide}
        onDescargarPDF={onDescargarPDF}
        onDescargarExcel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /pdf/i }));
    await waitFor(() => expect(onDescargarPDF).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onHide).toHaveBeenCalledTimes(1));
  });

  it('calls onDescargarExcel and closes when the Excel button is clicked', async () => {
    const onDescargarExcel = vi.fn().mockResolvedValue(undefined);
    const onHide = vi.fn();
    render(
      <CronogramaDownloadModal
        show
        onHide={onHide}
        onDescargarPDF={vi.fn()}
        onDescargarExcel={onDescargarExcel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /excel/i }));
    await waitFor(() => expect(onDescargarExcel).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onHide).toHaveBeenCalledTimes(1));
  });

  it('shows the "solo lo visible/filtrado" disclaimer', () => {
    render(
      <CronogramaDownloadModal
        show
        onHide={vi.fn()}
        onDescargarPDF={vi.fn()}
        onDescargarExcel={vi.fn()}
      />
    );
    expect(
      screen.getByText(/Descarga solo los equipos actualmente filtrados\/visibles/i)
    ).toBeInTheDocument();
  });
});
