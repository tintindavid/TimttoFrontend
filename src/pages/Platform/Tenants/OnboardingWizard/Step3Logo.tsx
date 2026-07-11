import React, { useState, useRef } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Step3Props {
  defaultFile?: File;
  onNext: (logoFile?: File) => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Step3Logo: React.FC<Step3Props> = ({ defaultFile, onNext, onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(defaultFile);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultFile ? URL.createObjectURL(defaultFile) : null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke the previous object URL to avoid memory leaks
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(undefined);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <h5 className="mb-3">Paso 3 — Logo de la empresa (opcional)</h5>

      <Alert variant="info" className="mb-4">
        El logo es opcional. Puedes saltarte este paso y subirlo más tarde desde el perfil
        del tenant.
      </Alert>

      <Form.Group className="mb-4">
        <Form.Label htmlFor="logo-upload">Seleccionar imagen</Form.Label>
        <Form.Control
          id="logo-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileChange}
          ref={inputRef}
          aria-describedby="logo-help"
        />
        <Form.Text id="logo-help" muted>
          Formatos aceptados: PNG, JPG, WEBP, SVG. Tamaño recomendado: máximo 2 MB.
        </Form.Text>
      </Form.Group>

      {/* Preview */}
      {previewUrl && selectedFile && (
        <div className="mb-4">
          <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
            Vista previa — {selectedFile.name} (
            {(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
          <img
            src={previewUrl}
            alt="Vista previa del logo"
            style={{ maxHeight: '120px', maxWidth: '300px', objectFit: 'contain', border: '1px solid #dee2e6', borderRadius: '4px', padding: '8px' }}
          />
          <div className="mt-2">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleRemove}
              aria-label="Quitar logo seleccionado"
            >
              Quitar logo
            </Button>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between mt-4">
        <Button variant="secondary" onClick={onBack}>
          ← Anterior
        </Button>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            onClick={() => onNext(undefined)}
            aria-label="Continuar sin logo"
          >
            Omitir logo
          </Button>
          <Button
            variant="primary"
            onClick={() => onNext(selectedFile)}
            aria-label="Continuar con logo seleccionado"
          >
            Siguiente →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step3Logo;
