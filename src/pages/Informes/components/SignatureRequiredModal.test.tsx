import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignatureRequiredModal } from './SignatureRequiredModal';

const mockMutateAsync = vi.fn();
const mockUseUpdateSignature = vi.fn();
vi.mock('@/hooks/useUsers', () => ({
  useUpdateSignature: (...args: unknown[]) => mockUseUpdateSignature(...args),
}));

const mockRefreshUser = vi.fn();
const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock('react-toastify', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

// Lightweight fake of react-signature-canvas consumed by the shared
// `SignatureInput` — "signs" on mousedown of the rendered <canvas> stand-in.
vi.mock('react-signature-canvas', () => {
  const MockSignatureCanvas = React.forwardRef((props: any, ref: React.Ref<unknown>) => {
    const emptyRef = React.useRef(true);
    const fakeCanvas = React.useRef<HTMLCanvasElement | null>(null);
    if (!fakeCanvas.current) fakeCanvas.current = document.createElement('canvas');
    React.useImperativeHandle(ref, () => ({
      isEmpty: () => emptyRef.current,
      clear: () => { emptyRef.current = true; },
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

const signCanvas = () => fireEvent.mouseDown(screen.getByTestId('signature-canvas'));

const renderModal = (props: Partial<React.ComponentProps<typeof SignatureRequiredModal>> = {}) => {
  const onHide = props.onHide ?? vi.fn();
  const onSaved = props.onSaved ?? vi.fn();
  render(<SignatureRequiredModal show onHide={onHide} onSaved={onSaved} {...props} />);
  return { onHide, onSaved };
};

describe('SignatureRequiredModal', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockUseUpdateSignature.mockReset();
    mockRefreshUser.mockReset();
    mockUseAuth.mockReset();
    mockToastError.mockReset();
    mockToastSuccess.mockReset();

    mockMutateAsync.mockResolvedValue({});
    mockUseUpdateSignature.mockReturnValue({ mutateAsync: mockMutateAsync, isLoading: false });
    mockUseAuth.mockReturnValue({ user: { _id: 'user-1' }, refreshUser: mockRefreshUser });
  });

  it('opens with an empty canvas and a disabled save button', () => {
    renderModal();
    expect(screen.getByTestId('signature-canvas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar firma/i })).toBeDisabled();
  });

  it('persists the signature, refreshes the auth cache, and fires onSaved on confirm', async () => {
    const { onSaved } = renderModal();

    signCanvas();
    const saveButton = screen.getByRole('button', { name: /guardar firma/i });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    // wait a tick for the async handler
    await new Promise((r) => setTimeout(r, 0));

    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: 'user-1',
      signatureData: 'data:image/png;base64,FAKEPNGDATA',
    });
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('aborts silently when the user cancels without saving', () => {
    const { onHide } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onHide).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
