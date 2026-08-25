import React from 'react';
import { Form } from 'react-bootstrap';
import { EstadoOperativo, EstadoOperativoValues } from '@/constants/estadoOperativo';

interface Props {
  value?: EstadoOperativo;
  onChange: (value: EstadoOperativo) => void;
  /** When set and different from `value`, show the motivo textarea. */
  currentValue?: EstadoOperativo;
  /** Show the motivo textarea (only visible when value !== currentValue). */
  withMotivo?: boolean;
  motivo?: string;
  onMotivoChange?: (m: string) => void;
  disabled?: boolean;
  id?: string;
}

const MOTIVO_MAX_LENGTH = 500;

/**
 * Shared `EstadoOperativo` select used by every equipo create/edit surface
 * (`EquipoForm`, `EditEquipoModal`, `EquipoBulkUpload` preview, `EquipoItemForm`).
 */
export const EstadoOperativoSelect: React.FC<Props> = ({
  value,
  onChange,
  currentValue,
  withMotivo = false,
  motivo = '',
  onMotivoChange,
  disabled = false,
  id = 'estado-operativo-select',
}) => {
  const showMotivo = withMotivo && currentValue !== undefined && value !== currentValue;

  return (
    <>
      <Form.Group className="mb-3" controlId={id}>
        <Form.Label>Estado Operativo</Form.Label>
        <Form.Select
          value={value || ''}
          onChange={(e) => onChange(e.target.value as EstadoOperativo)}
          disabled={disabled}
        >
          {EstadoOperativoValues.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {showMotivo && (
        <Form.Group className="mb-3" controlId={`${id}-motivo`}>
          <Form.Label>Motivo del cambio (opcional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            maxLength={MOTIVO_MAX_LENGTH}
            value={motivo}
            onChange={(e) => onMotivoChange?.(e.target.value)}
            disabled={disabled}
            placeholder="Ej: Falla intermitente detectada en verificación"
          />
          <Form.Text className="text-muted">
            {motivo.length}/{MOTIVO_MAX_LENGTH} caracteres
          </Form.Text>
        </Form.Group>
      )}
    </>
  );
};

export default EstadoOperativoSelect;
