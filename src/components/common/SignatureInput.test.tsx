import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignatureInput, { SignatureInputHandle } from './SignatureInput';

// Lightweight fake of react-signature-canvas (same shape as
// `SignatureModal.test.tsx`'s mock): exposes isEmpty/toDataURL/clear via
// ref, "signs" on mousedown of the rendered <canvas> stand-in, and stubs
// getCanvas/toData/fromData so the resize `useEffect` doesn't blow up.
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

// Controllable fake of `Image` so upload-driven decode/validation is
// deterministic in jsdom (which never actually loads `blob:` URLs).
let mockImageWidth = 100;
let mockImageHeight = 50;

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 0;
  height = 0;

  set src(_value: string) {
    this.width = mockImageWidth;
    this.height = mockImageHeight;
    // Simulate the async decode of a real Image element.
    Promise.resolve().then(() => this.onload?.());
  }
}

const makeFile = (name: string, type: string, sizeBytes: number): File => {
  const file = new File(['fake-bytes'], name, { type });
  Object.defineProperty(file, 'size', { value: sizeBytes, configurable: true });
  return file;
};

beforeEach(() => {
  mockImageWidth = 100;
  mockImageHeight = 50;
  vi.stubGlobal('Image', MockImage as unknown as typeof Image);
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(
    () => 'data:image/png;base64,iVBORw0KGgoUPLOADED'
  );
});

const uploadTab = () => screen.getByRole('tab', { name: 'Cargar imagen' });
const drawTab = () => screen.getByRole('tab', { name: 'Dibujar' });
const fileInput = () => screen.getByLabelText(/Selecciona una imagen/i);

describe('SignatureInput', () => {
  it('starts empty on both sources', () => {
    const ref = React.createRef<SignatureInputHandle>();
    render(<SignatureInput ref={ref} />);

    expect(ref.current?.isEmpty()).toBe(true);
    expect(ref.current?.getPngBase64()).toBeNull();
  });

  it('drawing on the canvas fills getPngBase64 with the stroke data', () => {
    const ref = React.createRef<SignatureInputHandle>();
    render(<SignatureInput ref={ref} />);

    fireEvent.mouseDown(screen.getByTestId('signature-canvas'));

    expect(ref.current?.isEmpty()).toBe(false);
    expect(ref.current?.getPngBase64()).toBe('FAKEPNGDATA');
  });

  it('uploading a JPG re-encodes to a base64 PNG', async () => {
    const ref = React.createRef<SignatureInputHandle>();
    render(<SignatureInput ref={ref} />);

    fireEvent.click(uploadTab());
    fireEvent.change(fileInput(), {
      target: { files: [makeFile('firma.jpg', 'image/jpeg', 1024)] },
    });

    await waitFor(() => expect(ref.current?.getPngBase64()).not.toBeNull());
    expect(ref.current?.getPngBase64()).toMatch(/^iVBORw0KGgo/);
    expect(ref.current?.isEmpty()).toBe(false);
  });

  it('rejects a file larger than 2 MB and keeps the signature empty', () => {
    const ref = React.createRef<SignatureInputHandle>();
    render(<SignatureInput ref={ref} />);

    fireEvent.click(uploadTab());
    fireEvent.change(fileInput(), {
      target: { files: [makeFile('firma-grande.png', 'image/png', 3 * 1024 * 1024)] },
    });

    expect(screen.getByText('La imagen no puede superar 2 MB.')).toBeInTheDocument();
    expect(ref.current?.isEmpty()).toBe(true);
    expect(ref.current?.getPngBase64()).toBeNull();
  });

  it('rejects an image whose dimensions exceed 4000x4000', async () => {
    mockImageWidth = 5000;
    mockImageHeight = 100;
    const ref = React.createRef<SignatureInputHandle>();
    render(<SignatureInput ref={ref} />);

    fireEvent.click(uploadTab());
    fireEvent.change(fileInput(), {
      target: { files: [makeFile('firma-ancha.png', 'image/png', 1024)] },
    });

    await waitFor(() =>
      expect(
        screen.getByText('Las dimensiones exceden 4000×4000 pixeles.')
      ).toBeInTheDocument()
    );
    expect(ref.current?.isEmpty()).toBe(true);
  });

  it('switching to "Cargar imagen" clears prior canvas strokes', () => {
    const ref = React.createRef<SignatureInputHandle>();
    render(<SignatureInput ref={ref} />);

    fireEvent.mouseDown(screen.getByTestId('signature-canvas'));
    expect(ref.current?.isEmpty()).toBe(false);

    fireEvent.click(uploadTab());

    expect(ref.current?.isEmpty()).toBe(true);
  });

  it('switching back to "Dibujar" discards the uploaded image', async () => {
    const ref = React.createRef<SignatureInputHandle>();
    render(<SignatureInput ref={ref} />);

    fireEvent.click(uploadTab());
    fireEvent.change(fileInput(), {
      target: { files: [makeFile('firma.png', 'image/png', 1024)] },
    });
    await waitFor(() => expect(ref.current?.isEmpty()).toBe(false));

    fireEvent.click(drawTab());

    expect(ref.current?.isEmpty()).toBe(true);
    expect(ref.current?.getPngBase64()).toBeNull();
  });

  it('clear() resets both the canvas and the uploaded image', async () => {
    const ref = React.createRef<SignatureInputHandle>();
    render(<SignatureInput ref={ref} />);

    fireEvent.click(uploadTab());
    fireEvent.change(fileInput(), {
      target: { files: [makeFile('firma.png', 'image/png', 1024)] },
    });
    await waitFor(() => expect(ref.current?.isEmpty()).toBe(false));

    // `clear()` triggers React state updates; wrap so React 18's automatic
    // batching flushes the render (and re-memoizes the imperative handle
    // against the new `uploadedImage`/`canvasEmpty`) before the assertions.
    act(() => {
      ref.current?.clear();
    });

    expect(ref.current?.isEmpty()).toBe(true);
    expect(ref.current?.getPngBase64()).toBeNull();
  });
});
