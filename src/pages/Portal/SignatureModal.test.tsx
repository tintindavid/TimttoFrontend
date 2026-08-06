import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SignatureModal, { SignatureModalReportGroup } from './SignatureModal';

const mockMutate = vi.fn();
const mockUseSign = vi.fn();
vi.mock('@/hooks/portal/useSign', () => ({
  useSign: (...args: unknown[]) => mockUseSign(...args),
}));

const mockLateMutate = vi.fn();
const mockUseSignExistingSheet = vi.fn();
vi.mock('@/hooks/portal/useSignExistingSheet', () => ({
  useSignExistingSheet: (...args: unknown[]) => mockUseSignExistingSheet(...args),
}));

const mockToastError = vi.fn();
const mockToastInfo = vi.fn();
vi.mock('react-toastify', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
    success: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Lightweight fake of react-signature-canvas (now consumed by the shared
// `SignatureInput`, not this file directly): exposes isEmpty/toDataURL/clear
// via ref, "signs" on mousedown of the rendered <canvas> stand-in. Also
// stubs getCanvas + toData/fromData so `SignatureInput`'s responsive-resize
// useEffect doesn't blow up when the modal mounts.
vi.mock('react-signature-canvas', () => {
  const MockSignatureCanvas = React.forwardRef((props: any, ref: React.Ref<unknown>) => {
    const emptyRef = React.useRef(true);
    const fakeCanvas = React.useRef<HTMLCanvasElement | null>(null);
    if (!fakeCanvas.current) {
      fakeCanvas.current = document.createElement('canvas');
    }
    React.useImperativeHandle(ref, () => ({
      isEmpty: () => emptyRef.current,
      clear: () => {
        emptyRef.current = true;
      },
      toDataURL: () => 'data:image/png;base64,FAKEPNGDATA',
      getCanvas: () => fakeCanvas.current!,
      toData: () => [],
      fromData: () => {},
    }));
    return React.createElement('canvas', {
      'data-testid': 'signature-canvas',
      onMouseDown: () => {
        emptyRef.current = false;
        props.onEnd?.();
      },
    });
  });
  return { default: MockSignatureCanvas };
});

const reviewedReports: SignatureModalReportGroup[] = [
  {
    otId: 'ot1',
    otConsecutivo: 'OT-0001',
    reports: [
      { _id: 'r1', consecutivo: 'R-0001' },
      { _id: 'r2', consecutivo: 'R-0002' },
    ],
  },
];

const signCanvas = () => fireEvent.mouseDown(screen.getByTestId('signature-canvas'));

const fillValidFields = () => {
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Juan Perez' } });
};

const renderModal = (props: Partial<React.ComponentProps<typeof SignatureModal>> = {}) => {
  const queryClient = new QueryClient();
  const onHide = props.onHide ?? vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <SignatureModal
        show
        onHide={onHide}
        token="tok-1"
        reviewedReports={reviewedReports}
        {...props}
      />
    </QueryClientProvider>
  );
  return { onHide, queryClient };
};

describe('SignatureModal', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockUseSign.mockReset();
    mockLateMutate.mockReset();
    mockUseSignExistingSheet.mockReset();
    mockToastError.mockReset();
    mockToastInfo.mockReset();
    mockNavigate.mockReset();
    mockUseSign.mockReturnValue({ mutate: mockMutate, isLoading: false });
    mockUseSignExistingSheet.mockReturnValue({ mutate: mockLateMutate, isLoading: false });
  });

  it('disables submit when the canvas is empty', () => {
    renderModal();

    fillValidFields();

    expect(screen.getByRole('button', { name: 'Firmar' })).toBeDisabled();
  });

  it('disables submit when signerName is missing', () => {
    renderModal();

    signCanvas();

    expect(screen.getByRole('button', { name: 'Firmar' })).toBeDisabled();
  });

  it('Cédula input was removed from the UI (2026-08-02)', () => {
    renderModal();

    expect(screen.queryByLabelText('Cédula')).not.toBeInTheDocument();
  });

  it('calls useSign().mutate with the expected payload on happy submit (no signerId)', () => {
    renderModal();

    signCanvas();
    fillValidFields();

    const submitButton = screen.getByRole('button', { name: 'Firmar' });
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockLateMutate).not.toHaveBeenCalled();
    const [payload] = mockMutate.mock.calls[0];
    expect(payload).toEqual({
      reportIds: ['r1', 'r2'],
      signature: {
        imagePng: 'FAKEPNGDATA',
        signerName: 'Juan Perez',
        cargo: undefined,
        observaciones: undefined,
      },
    });
  });

  it('carries observaciones into the sign payload when the client fills it', () => {
    renderModal();

    signCanvas();
    fillValidFields();
    fireEvent.change(screen.getByLabelText('Observaciones (opcional)'), {
      target: { value: 'Recibido con salvedad en equipo 3' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));

    const [payload] = mockMutate.mock.calls[0];
    expect(payload.signature.observaciones).toBe('Recibido con salvedad en equipo 3');
  });

  it('shows a toast listing the offending reports on SIGN_REQUIRES_REVIEW', () => {
    renderModal();

    signCanvas();
    fillValidFields();
    fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));

    const [, options] = mockMutate.mock.calls[0];
    act(() => {
      options.onError({
        response: {
          status: 400,
          data: { error: { code: 'SIGN_REQUIRES_REVIEW', details: { consecutivos: ['R-0003'] } } },
        },
      });
    });

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('R-0003')
    );
  });

  it('disables submit and shows the message on TOKEN_CREATOR_INVALID', () => {
    renderModal();

    signCanvas();
    fillValidFields();
    fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));

    const [, options] = mockMutate.mock.calls[0];
    act(() => {
      options.onError({
        response: {
          status: 409,
          data: { error: { code: 'TOKEN_CREATOR_INVALID' }, message: 'Ese acceso ya no puede firmar HTs.' },
        },
      });
    });

    expect(screen.getByText('Ese acceso ya no puede firmar HTs.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Firmar' })).toBeDisabled();
  });

  it('shows the invalid-signature message on INVALID_SIGNATURE_IMAGE (initial mode)', () => {
    renderModal();

    signCanvas();
    fillValidFields();
    fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));

    const [, options] = mockMutate.mock.calls[0];
    act(() => {
      options.onError({
        response: { status: 400, data: { error: { code: 'INVALID_SIGNATURE_IMAGE' } } },
      });
    });

    expect(
      screen.getByText('La firma no es válida. Vuelve a firmar o carga una imagen con más contenido.')
    ).toBeInTheDocument();
  });

  describe('mode="late"', () => {
    it('shows the late-sign title and hides the reviewed-reports summary', () => {
      renderModal({ mode: 'late', sheetId: 'sheet-1' });

      expect(screen.getByText('Firmar hoja de trabajo')).toBeInTheDocument();
      expect(screen.queryByText(/Se van a firmar/)).not.toBeInTheDocument();
    });

    it('calls useSignExistingSheet(token, sheetId) and mutates with a reportIds-less payload', () => {
      renderModal({ mode: 'late', sheetId: 'sheet-1' });

      expect(mockUseSignExistingSheet).toHaveBeenCalledWith('tok-1', 'sheet-1');

      signCanvas();
      fillValidFields();
      fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));

      expect(mockLateMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).not.toHaveBeenCalled();
      const [payload] = mockLateMutate.mock.calls[0];
      expect(payload).toEqual({
        signature: {
          imagePng: 'FAKEPNGDATA',
          signerName: 'Juan Perez',
          cargo: undefined,
          observaciones: undefined,
        },
      });
    });

    it('shows the invalid-signature message and keeps the modal open on 400 INVALID_SIGNATURE_IMAGE', () => {
      const { onHide } = renderModal({ mode: 'late', sheetId: 'sheet-1' });

      signCanvas();
      fillValidFields();
      fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));

      const [, options] = mockLateMutate.mock.calls[0];
      act(() => {
        options.onError({
          response: { status: 400, data: { error: { code: 'INVALID_SIGNATURE_IMAGE' } } },
        });
      });

      expect(
        screen.getByText('La firma no es válida. Vuelve a firmar o carga una imagen con más contenido.')
      ).toBeInTheDocument();
      expect(onHide).not.toHaveBeenCalled();
    });

    it('shows an info toast and closes on 409 SHEET_ALREADY_SIGNED', () => {
      const { onHide } = renderModal({ mode: 'late', sheetId: 'sheet-1' });

      signCanvas();
      fillValidFields();
      fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));

      const [, options] = mockLateMutate.mock.calls[0];
      act(() => {
        options.onError({
          response: { status: 409, data: { error: { code: 'SHEET_ALREADY_SIGNED' } } },
        });
      });

      expect(mockToastInfo).toHaveBeenCalledWith('Esta hoja ya tiene firma.');
      expect(onHide).toHaveBeenCalledTimes(1);
    });

    it('shows an error toast and closes on 404 SHEET_NOT_FOUND', () => {
      const { onHide } = renderModal({ mode: 'late', sheetId: 'sheet-1' });

      signCanvas();
      fillValidFields();
      fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));

      const [, options] = mockLateMutate.mock.calls[0];
      act(() => {
        options.onError({
          response: { status: 404, data: { error: { code: 'SHEET_NOT_FOUND' } } },
        });
      });

      expect(mockToastError).toHaveBeenCalledWith('La hoja no está disponible con este acceso.');
      expect(onHide).toHaveBeenCalledTimes(1);
    });
  });
});
