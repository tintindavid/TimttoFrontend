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

// Some OSes report an empty MIME for DOCX/XLSX; fall back to the extension.
const EXT_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const getExtension = (name: string): string => {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
};

const HTTP_URL = /^https?:\/\//i;

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
  const [linkDraft, setLinkDraft] = React.useState<string>(value.link ?? '');

  const reject = (input: HTMLInputElement, msg: string) => {
    setErr(msg);
    input.value = '';
    onChange({ mode: 'file' });
  };

  const onFile = (input: HTMLInputElement) => {
    setErr(null);
    const f = input.files?.[0];
    if (!f) return;
    const effectiveType = f.type || EXT_TO_MIME[getExtension(f.name)] || '';
    if (!ALLOWED_MIME.includes(effectiveType)) {
      reject(input, 'Tipo de archivo no permitido.');
      return;
    }
    if (f.size > MAX_SIZE) {
      reject(input, 'El archivo excede 10 MB.');
      return;
    }
    onChange({ mode: 'file', file: f });
  };

  const onLink = (text: string) => {
    setLinkDraft(text);
    if (text === '') {
      setErr(null);
      onChange({ mode: 'link' });
      return;
    }
    if (!HTTP_URL.test(text)) {
      setErr('El enlace debe iniciar con http:// o https://');
      onChange({ mode: 'link' });
      return;
    }
    setErr(null);
    onChange({ mode: 'link', link: text });
  };

  const setMode = (mode: EvidenciaValue['mode']) => {
    setErr(null);
    if (mode === 'link') setLinkDraft('');
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
          onChange={(e) => onFile(e.target as HTMLInputElement)}
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
          value={linkDraft}
          isInvalid={err !== null}
          onChange={(e) => onLink(e.target.value)}
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
