import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  exportReq: vi.fn(),
  exportComp: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/hooks/useRequisicionReportes', () => ({
  useExportarRequisicion: () => ({ mutateAsync: mocks.exportReq, isLoading: false }),
  useExportarComparativo: () => ({ mutateAsync: mocks.exportComp, isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { error: mocks.toastError, success: vi.fn() } }));

import ExportButtons from './ExportButtons';

describe('ExportButtons', () => {
  beforeEach(() => {
    mocks.exportReq.mockReset().mockResolvedValue(undefined);
    mocks.exportComp.mockReset().mockResolvedValue(undefined);
    mocks.toastError.mockReset();
  });

  it('downloads the requisicion as PDF and as Excel', async () => {
    render(<ExportButtons kind="requisicion" requisicionId="r1" consecutivo="REQ-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Descargar PDF de la requisición' }));
    await waitFor(() => expect(mocks.exportReq).toHaveBeenCalledWith({ id: 'r1', formato: 'pdf', consecutivo: 'REQ-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Descargar Excel de la requisición' }));
    await waitFor(() => expect(mocks.exportReq).toHaveBeenCalledWith({ id: 'r1', formato: 'xlsx', consecutivo: 'REQ-1' }));
    expect(mocks.exportComp).not.toHaveBeenCalled();
  });

  it('the comparativo variant uses the comparativo export', async () => {
    render(<ExportButtons kind="comparativo" requisicionId="r1" consecutivo="REQ-1" size="sm" />);
    fireEvent.click(screen.getByRole('button', { name: 'Descargar Excel del comparativo' }));
    await waitFor(() => expect(mocks.exportComp).toHaveBeenCalledWith({ id: 'r1', formato: 'xlsx', consecutivo: 'REQ-1' }));
    expect(mocks.exportReq).not.toHaveBeenCalled();
  });

  it('shows the mapped Spanish error when the PDF service is down', async () => {
    mocks.exportReq.mockRejectedValue({ response: { data: { error: { code: 'PDF_NO_DISPONIBLE' } } } });
    render(<ExportButtons kind="requisicion" requisicionId="r1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Descargar PDF de la requisición' }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('no está disponible')));
  });
});
