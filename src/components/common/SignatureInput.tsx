import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Alert, Form, Tab, Tabs, Button } from 'react-bootstrap';
import SignatureCanvas from 'react-signature-canvas';

export interface SignatureInputProps {
  /** Fired whenever the pending signature (canvas or upload) changes, so the parent can re-evaluate `canSubmit`. */
  onChange?: () => void;
}

export interface SignatureInputHandle {
  /** Base64 PNG (no `data:image/png;base64,` prefix) of the active source, or `null` if nothing was captured. */
  getPngBase64: () => string | null;
  /** True when neither the canvas nor the uploaded image hold a signature. */
  isEmpty: () => boolean;
  /** Clears both sources (canvas strokes + uploaded image). */
  clear: () => void;
}

type SignatureSource = 'draw' | 'upload';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_DIMENSION_PX = 4000;
const PNG_PREFIX_RE = /^data:image\/png;base64,/;

/**
 * Shared signature-capture surface used by the portal `SignatureModal`
 * (initial + late sign) and the admin "Crear Hoja de Trabajo" modal.
 *
 * Two mutually exclusive sources — "last input wins" (D8 of
 * `portal-signature-flow/design.md`): switching from "Dibujar" to "Cargar
 * imagen" clears any drawn strokes; switching back clears the uploaded
 * image. `getPngBase64()` always returns whichever source is currently
 * active, re-encoded as base64 PNG regardless of the original upload
 * format (D5).
 */
const SignatureInput = forwardRef<SignatureInputHandle, SignatureInputProps>(
  ({ onChange }, ref) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const canvasWrapper = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<SignatureSource>('draw');
    const [canvasEmpty, setCanvasEmpty] = useState(true);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Same canvas-resize logic as the former inline block in
    // `SignatureModal.tsx`: syncs the canvas internal resolution with its
    // rendered size + device pixel ratio so pointer coordinates and drawn
    // pixels stay aligned (HiDPI). Re-runs whenever the "Dibujar" tab
    // becomes active (covers both first mount and switching back from
    // "Cargar imagen") and on viewport resize while active.
    useEffect(() => {
      if (activeTab !== 'draw') return undefined;
      const resize = () => {
        const wrapper = canvasWrapper.current;
        const canvas = sigCanvas.current?.getCanvas();
        if (!wrapper || !canvas) return;
        const rect = wrapper.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        // Save existing strokes so a resize doesn't erase them.
        const data = sigCanvas.current?.toData();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        const ctx = canvas.getContext('2d');
        ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
        if (data && data.length > 0) {
          sigCanvas.current?.fromData(data);
        }
      };
      // Delay one frame so any parent transition (e.g. a Modal opening) has
      // laid out the wrapper.
      const raf = requestAnimationFrame(resize);
      window.addEventListener('resize', resize);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }, [activeTab]);

    // Emit `onChange` from a post-render effect so the parent, when it reads
    // `signatureRef.current?.isEmpty()`, sees the freshly-memoized imperative
    // handle (which depends on `activeTab`/`uploadedImage`). Firing `onChange`
    // synchronously from the individual event handlers races the state
    // commit — parent would read stale values and never enable the submit
    // button after an image upload.
    useEffect(() => {
      onChange?.();
      // Intentionally NOT depending on `onChange` — parent reference churn
      // must not re-fire this effect.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, uploadedImage, canvasEmpty]);

    const handleEnd = () => {
      setCanvasEmpty(Boolean(sigCanvas.current?.isEmpty()));
    };

    const handleClearCanvas = () => {
      sigCanvas.current?.clear();
      setCanvasEmpty(true);
    };

    const resetFileInput = () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTabSelect = (key: string | null) => {
      if (!key || key === activeTab) return;
      if (activeTab === 'draw' && key === 'upload') {
        // Leaving "Dibujar": strokes are discarded (last input wins).
        sigCanvas.current?.clear();
        setCanvasEmpty(true);
      } else if (activeTab === 'upload' && key === 'draw') {
        // Leaving "Cargar imagen": the uploaded image is discarded.
        setUploadedImage(null);
        setUploadError(null);
        resetFileInput();
      }
      setActiveTab(key as SignatureSource);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadError(null);

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadError('La imagen no puede superar 2 MB.');
        setUploadedImage(null);
        resetFileInput();
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        if (img.width > MAX_DIMENSION_PX || img.height > MAX_DIMENSION_PX) {
          setUploadError('Las dimensiones exceden 4000×4000 pixeles.');
          setUploadedImage(null);
          URL.revokeObjectURL(objectUrl);
          resetFileInput();
          return;
        }

        // Re-encode to PNG uniformly regardless of the source format (D5).
        const offscreen = document.createElement('canvas');
        offscreen.width = img.width;
        offscreen.height = img.height;
        const ctx = offscreen.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const pngDataUrl = offscreen.toDataURL('image/png');

        setUploadedImage(pngDataUrl);
        URL.revokeObjectURL(objectUrl);
      };

      img.onerror = () => {
        setUploadError('No fue posible cargar la imagen.');
        setUploadedImage(null);
        URL.revokeObjectURL(objectUrl);
        resetFileInput();
      };

      img.src = objectUrl;
    };

    useImperativeHandle(
      ref,
      () => ({
        getPngBase64: () => {
          if (activeTab === 'upload') {
            return uploadedImage ? uploadedImage.replace(PNG_PREFIX_RE, '') : null;
          }
          if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            return sigCanvas.current.toDataURL('image/png').replace(PNG_PREFIX_RE, '');
          }
          return null;
        },
        isEmpty: () => {
          if (activeTab === 'upload') return !uploadedImage;
          return Boolean(sigCanvas.current?.isEmpty() ?? true);
        },
        clear: () => {
          sigCanvas.current?.clear();
          setCanvasEmpty(true);
          setUploadedImage(null);
          setUploadError(null);
          resetFileInput();
        },
      }),
      [activeTab, uploadedImage]
    );

    return (
      <div>
        <Tabs
          id="signature-input-tabs"
          activeKey={activeTab}
          onSelect={handleTabSelect}
          className="mb-2"
        >
          <Tab eventKey="draw" title="Dibujar">
            <div
              ref={canvasWrapper}
              className="border rounded mt-2"
              style={{ touchAction: 'none', height: 200, width: '100%' }}
            >
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                onEnd={handleEnd}
                canvasProps={{ 'aria-label': 'Área de firma' }}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <Button variant="link" className="p-0" onClick={handleClearCanvas}>
                Limpiar firma
              </Button>
              <small className="text-muted">
                {canvasEmpty ? 'Canvas vacío' : 'Firma capturada'}
              </small>
            </div>
          </Tab>
          <Tab eventKey="upload" title="Cargar imagen">
            <Form.Group className="mt-2" controlId="signatureUpload">
              <Form.Label>Selecciona una imagen (PNG o JPG, máx. 2 MB)</Form.Label>
              <Form.Control
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleFileChange}
              />
            </Form.Group>
            {uploadError && (
              <Alert variant="danger" className="mt-2 mb-0">
                {uploadError}
              </Alert>
            )}
            {uploadedImage && (
              <div className="mt-2 text-center border rounded p-2">
                <img
                  src={uploadedImage}
                  alt="Vista previa de la firma cargada"
                  style={{ maxHeight: 200 }}
                />
              </div>
            )}
          </Tab>
        </Tabs>
      </div>
    );
  }
);

SignatureInput.displayName = 'SignatureInput';

export default SignatureInput;
