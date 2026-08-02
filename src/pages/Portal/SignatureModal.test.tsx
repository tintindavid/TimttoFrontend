import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import SignatureModal, { SignatureModalReportGroup } from './SignatureModal';

const mockMutate = vi.fn();
const mockUseSign = vi.fn();
vi.mock('@/hooks/portal/useSign', () => ({
  useSign: (...args: unknown[]) => mockUseSign(...args),
}));

const mockToastError = vi.fn();
vi.mock('react-toastify', () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args), success: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Lightweight fake of react-signature-canvas: exposes isEmpty/toDataURL/clear
// via ref, "signs" on mousedown of the rendered <canvas> stand-in. Also
// stubs getCanvas + toData/fromData so the responsive-resize useEffect in
// SignatureModal doesn't blow up when the modal mounts.
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

describe('SignatureModal', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockUseSign.mockReset();
    mockToastError.mockReset();
    mockNavigate.mockReset();
    mockUseSign.mockReturnValue({ mutate: mockMutate, isLoading: false });
  });

  it('disables submit when the canvas is empty', () => {
    render(
      <SignatureModal show onHide={vi.fn()} token="tok-1" reviewedReports={reviewedReports} />
    );

    fillValidFields();

    expect(screen.getByRole('button', { name: 'Firmar' })).toBeDisabled();
  });

  it('disables submit when signerName is missing', () => {
    render(
      <SignatureModal show onHide={vi.fn()} token="tok-1" reviewedReports={reviewedReports} />
    );

    signCanvas();

    expect(screen.getByRole('button', { name: 'Firmar' })).toBeDisabled();
  });

  it('Cédula input was removed from the UI (2026-08-02)', () => {
    render(
      <SignatureModal show onHide={vi.fn()} token="tok-1" reviewedReports={reviewedReports} />
    );

    expect(screen.queryByLabelText('Cédula')).not.toBeInTheDocument();
  });

  it('calls useSign().mutate with the expected payload on happy submit (no signerId)', () => {
    render(
      <SignatureModal show onHide={vi.fn()} token="tok-1" reviewedReports={reviewedReports} />
    );

    signCanvas();
    fillValidFields();

    const submitButton = screen.getByRole('button', { name: 'Firmar' });
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    expect(mockMutate).toHaveBeenCalledTimes(1);
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
    render(
      <SignatureModal show onHide={vi.fn()} token="tok-1" reviewedReports={reviewedReports} />
    );

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
    render(
      <SignatureModal show onHide={vi.fn()} token="tok-1" reviewedReports={reviewedReports} />
    );

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
    render(
      <SignatureModal show onHide={vi.fn()} token="tok-1" reviewedReports={reviewedReports} />
    );

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
});
