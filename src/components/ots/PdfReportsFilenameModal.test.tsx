import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PdfReportsFilenameModal from './PdfReportsFilenameModal';

const generateBulkPDFMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/services/descargarPdf.service', () => ({
  generateBulkPDF: (...args: any[]) => generateBulkPDFMock(...args),
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const sampleReport = {
  consecutivo: 'OT-2026-001-1',
  equipoSnapshot: { Serie: 'SN12345', Inventario: 'INV-777', ItemText: 'MONITOR MULTIPARAMETRO' },
  fechaProcesado: '2026-08-11T14:30:00Z',
};

describe('PdfReportsFilenameModal', () => {
  beforeEach(() => {
    generateBulkPDFMock.mockClear();
  });

  it('opens with the default selection and matching preview', () => {
    render(
      <PdfReportsFilenameModal
        show
        onHide={() => {}}
        sheetworkId="sw-1"
        sampleReport={sampleReport}
      />
    );
    // Default order: consecutivo, fecha, item
    expect(screen.getByTestId('pdf-filename-preview').textContent).toBe(
      'OT-2026-001-1_2026-08-11_MONITOR_MULTIPARAMETRO.pdf'
    );
  });

  it('clicking an unselected chip appends it to the selection', () => {
    render(
      <PdfReportsFilenameModal
        show
        onHide={() => {}}
        sheetworkId="sw-1"
        sampleReport={sampleReport}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /agregar serial/i }));
    expect(screen.getByTestId('pdf-filename-preview').textContent).toBe(
      'OT-2026-001-1_2026-08-11_MONITOR_MULTIPARAMETRO_SN12345.pdf'
    );
  });

  it('Deseleccionar todo empties the selection and disables submit', () => {
    render(
      <PdfReportsFilenameModal
        show
        onHide={() => {}}
        sheetworkId="sw-1"
        sampleReport={sampleReport}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /deseleccionar todo/i }));
    // The copy appears both in the empty-chip-area placeholder and in the
    // preview placeholder — assert at least one is rendered.
    expect(screen.getAllByText(/selecciona al menos un campo/i).length).toBeGreaterThan(0);
    const submit = screen.getByRole('button', { name: /descargar/i });
    expect(submit).toBeDisabled();
  });

  it('renders the info popover when the info icon is clicked', () => {
    render(
      <PdfReportsFilenameModal
        show
        onHide={() => {}}
        sheetworkId="sw-1"
        sampleReport={sampleReport}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /información/i }));
    expect(screen.getByText(/haz clic en un chip/i)).toBeInTheDocument();
  });

  it('submit calls generateBulkPDF with the current selection', async () => {
    const onHide = vi.fn();
    render(
      <PdfReportsFilenameModal
        show
        onHide={onHide}
        sheetworkId="sw-1"
        sampleReport={sampleReport}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /descargar/i }));
    await waitFor(() => expect(generateBulkPDFMock).toHaveBeenCalled());
    expect(generateBulkPDFMock).toHaveBeenCalledWith({
      sheetworkId: 'sw-1',
      fileNameConfig: { tokens: ['consecutivo', 'fecha', 'item'] },
    });
    await waitFor(() => expect(onHide).toHaveBeenCalled());
  });
});
