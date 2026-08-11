import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Alert, Form, Row, Col } from 'react-bootstrap';
import SignatureInput, { SignatureInputHandle } from '@/components/common/SignatureInput';

export interface InPlaceSignSectionHandle {
  /** Base64 PNG (no prefix). Null when the signature is empty. */
  getPngBase64: () => string | null;
  /** True if any required field is missing or the signature is empty. */
  hasErrors: () => boolean;
  /** Current form values (post-trim) for the parent submit handler. */
  values: () => { recibe: string; cargo: string; observaciones: string };
  /** Reset canvas + fields. */
  reset: () => void;
}

interface Props {
  /** Fires on any input/signature change so the parent can enable/disable submit. */
  onChange?: () => void;
}

/**
 * Extracted from the former inline block in WorkSheets.tsx so both the
 * "En Sitio" tab of the create modal and the fallback "Firmar en sitio"
 * modal for EnviadaAFirmar sheets can reuse the same UI. Behaviorally
 * identical to what it replaced.
 */
export const InPlaceSignSection = forwardRef<InPlaceSignSectionHandle, Props>(
  ({ onChange }, ref) => {
    const [recibeNombre, setRecibeNombre] = useState('');
    const [recibeCargo, setRecibeCargo] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const sigRef = useRef<SignatureInputHandle>(null);
    const [hasSignature, setHasSignature] = useState(false);

    const emit = () => onChange?.();

    const handleSignatureChange = () => {
      setHasSignature(!(sigRef.current?.isEmpty() ?? true));
      emit();
    };

    useImperativeHandle(
      ref,
      () => ({
        getPngBase64: () => sigRef.current?.getPngBase64() || null,
        hasErrors: () =>
          !recibeNombre.trim() || !recibeCargo.trim() || (sigRef.current?.isEmpty() ?? true),
        values: () => ({
          recibe: recibeNombre.trim(),
          cargo: recibeCargo.trim(),
          observaciones: observaciones.trim(),
        }),
        reset: () => {
          setRecibeNombre('');
          setRecibeCargo('');
          setObservaciones('');
          sigRef.current?.clear();
          setHasSignature(false);
        },
      }),
      [recibeNombre, recibeCargo, observaciones, hasSignature]
    );

    return (
      <div>
        <Alert variant="info">
          Complete los siguientes datos y firme para cerrar la hoja de trabajo.
        </Alert>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Recibe <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre de quien recibe"
                  value={recibeNombre}
                  onChange={(e) => {
                    setRecibeNombre(e.target.value);
                    emit();
                  }}
                  required
                />
                <Form.Text className="text-muted">Nombre completo de la persona que recibe</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Cargo <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Cargo de quien recibe"
                  value={recibeCargo}
                  onChange={(e) => {
                    setRecibeCargo(e.target.value);
                    emit();
                  }}
                  required
                />
                <Form.Text className="text-muted">Cargo o posición en la empresa</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Observaciones (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              maxLength={2000}
              value={observaciones}
              onChange={(e) => {
                setObservaciones(e.target.value);
                emit();
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Firma <span className="text-danger">*</span>
            </Form.Label>
            <SignatureInput ref={sigRef} onChange={handleSignatureChange} />
          </Form.Group>
        </Form>
      </div>
    );
  }
);

InPlaceSignSection.displayName = 'InPlaceSignSection';

export default InPlaceSignSection;
