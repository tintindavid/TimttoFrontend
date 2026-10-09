import React from 'react';
import { Form } from 'react-bootstrap';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export interface EvidenciaValue {
  mode: 'file' | 'link' | 'none';
  file?: File;
  link?: string;
}

interface Props {
  value: EvidenciaValue;
  onChange: (v: EvidenciaValue) => void;
}

const EvidenciaInput: React.FC<Props> = ({ value, onChange }) => {
  const [err, setErr] = React.useState<string | null>(null);

  const onFile = (f: File | null) => {
    setErr(null);
    if (!f) return;
    if (!ALLOWED_MIME.includes(f.type)) {
      setErr('Tipo de archivo no permitido.');
      return;
    }
    if (f.size > MAX_SIZE) {
      setErr('El archivo excede 10 MB.');
      return;
    }
    onChange({ mode: 'file', file: f });
  };

  const setMode = (mode: EvidenciaValue['mode']) => {
    setErr(null);
    onChange({ mode });
  };

  return (
    <div className="border rounded p-3">
      <strong>Evidencia</strong>
      <Form.Check
        type="radio"
        id="evidencia-file"
        name="evidencia-mode"
        label="Archivo adjunto"
        checked={value.mode === 'file'}
        onChange={() => setMode('file')}
      />
      {value.mode === 'file' && (
        <Form.Control
          type="file"
          aria-label="Seleccionar archivo de evidencia"
          accept={ALLOWED_MIME.join(',')}
          onChange={(e) => onFile((e.target as HTMLInputElement).files?.[0] ?? null)}
        />
      )}
      <Form.Check
        type="radio"
        id="evidencia-link"
        name="evidencia-mode"
        label="Enlace externo"
        checked={value.mode === 'link'}
        onChange={() => setMode('link')}
      />
      {value.mode === 'link' && (
        <Form.Control
          type="url"
          aria-label="Enlace de evidencia"
          placeholder="https://..."
          value={value.link ?? ''}
          onChange={(e) => onChange({ mode: 'link', link: e.target.value })}
        />
      )}
      <Form.Check
        type="radio"
        id="evidencia-none"
        name="evidencia-mode"
        label="Sin evidencia"
        checked={value.mode === 'none'}
        onChange={() => setMode('none')}
      />
      {err && <div className="text-danger small mt-1" role="alert">{err}</div>}
    </div>
  );
};

export default EvidenciaInput;
