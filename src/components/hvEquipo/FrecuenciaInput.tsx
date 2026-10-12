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

const FrecuenciaInput: React.FC<Props> = ({ value, onChange }) => {
  const [err, setErr] = React.useState<string | null>(null);

  const onMeses = (raw: string) => {
    if (raw.trim() === '') {
      setErr('Indica cada cuántos meses se repite.');
      onChange({ esUnica: false, meses: undefined });
      return;
    }
    const n = Math.trunc(Number(raw));
    if (!Number.isFinite(n) || n < 1) {
      setErr('Los meses deben ser un entero mayor o igual a 1.');
      onChange({ esUnica: false, meses: undefined });
      return;
    }
    setErr(null);
    onChange({ esUnica: false, meses: n });
  };

  return (
    <div className="border rounded p-3">
      <strong>Frecuencia</strong>
      <Form.Check
        type="radio"
        id="freq-recurrente"
        name="freq-mode"
        label="Esta actividad se repite"
        checked={!value.esUnica}
        onChange={() => {
          setErr(null);
          onChange({ esUnica: false, meses: value.meses ?? 12 });
        }}
      />
      {!value.esUnica && (
        <InputGroup className="mt-2">
          <InputGroup.Text>cada</InputGroup.Text>
          <Form.Control
            type="number"
            min={1}
            aria-label="Meses entre repeticiones"
            value={value.meses ?? ''}
            isInvalid={err !== null}
            onChange={(e) => onMeses(e.target.value)}
          />
          <InputGroup.Text>meses</InputGroup.Text>
        </InputGroup>
      )}
      {err && !value.esUnica && (
        <div className="text-danger small mt-1" role="alert">{err}</div>
      )}
      <Form.Check
        type="radio"
        id="freq-unica"
        name="freq-mode"
        label="Actividad única"
        checked={value.esUnica}
        onChange={() => {
          setErr(null);
          onChange({ esUnica: true });
        }}
      />
    </div>
  );
};

export default FrecuenciaInput;
