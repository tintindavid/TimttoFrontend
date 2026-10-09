import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';

export interface FrecuenciaValue {
  meses?: number;
  esUnica: boolean;
}

interface Props {
  value: FrecuenciaValue;
  onChange: (v: FrecuenciaValue) => void;
}

const FrecuenciaInput: React.FC<Props> = ({ value, onChange }) => (
  <div className="border rounded p-3">
    <strong>Frecuencia</strong>
    <Form.Check
      type="radio"
      id="freq-recurrente"
      name="freq-mode"
      label="Esta actividad se repite"
      checked={!value.esUnica}
      onChange={() => onChange({ esUnica: false, meses: value.meses ?? 12 })}
    />
    {!value.esUnica && (
      <InputGroup className="mt-2">
        <InputGroup.Text>cada</InputGroup.Text>
        <Form.Control
          type="number"
          min={1}
          aria-label="Meses entre repeticiones"
          value={value.meses ?? ''}
          onChange={(e) => onChange({ esUnica: false, meses: Number(e.target.value) })}
        />
        <InputGroup.Text>meses</InputGroup.Text>
      </InputGroup>
    )}
    <Form.Check
      type="radio"
      id="freq-unica"
      name="freq-mode"
      label="Actividad única"
      checked={value.esUnica}
      onChange={() => onChange({ esUnica: true })}
    />
  </div>
);

export default FrecuenciaInput;
