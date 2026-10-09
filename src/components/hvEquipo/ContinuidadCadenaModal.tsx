import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import type { CadenaActividad, CreateActividadDto } from '@/types/actividadExterna.types';

interface Props {
  show: boolean;
  cadenasCandidatas: CadenaActividad[];
  datosPaso1: CreateActividadDto;
  onBack: () => void;
  onConfirm: (cadenaIdSucesion?: string) => void;
}

const diffDays = (iso?: string | null): number | null => {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
};

const ContinuidadCadenaModal: React.FC<Props> = ({ show, cadenasCandidatas, datosPaso1, onBack, onConfirm }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedCadena = selected && selected !== 'new' ? cadenasCandidatas.find(c => c._id === selected) : undefined;
  const frecDistinta = !!selectedCadena && selectedCadena.frecuenciaMeses !== datosPaso1.frecuencia.meses;

  return (
    <Modal show={show} onHide={onBack} size="lg">
      <Modal.Header>
        <Modal.Title>¿Esta actividad continúa un cronograma existente?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Encontramos {cadenasCandidatas.length} cadena(s) vigente(s) del mismo tipo. Elige si esta nueva actividad
          les da continuidad, o si pertenece a una línea nueva.
        </p>
        {cadenasCandidatas.map(c => {
          const vencidaDias = diffDays(c.fechaProxima);
          const vencida = vencidaDias != null && vencidaDias > 0;
          return (
            <Form.Check
              key={c._id}
              type="radio"
              name="cadena"
              id={`cadena-${c._id}`}
              label={
                <span>
                  <strong>{c.tipo}{c.tipoCustom ? ` · ${c.tipoCustom}` : ''}</strong> — frecuencia {c.frecuenciaMeses}m — próxima {c.fechaProxima ?? '—'}{' '}
                  {vencida
                    ? <em className="text-warning">(vencida {vencidaDias}d)</em>
                    : <em className="text-success">(al día)</em>}
                </span>
              }
              checked={selected === c._id}
              onChange={() => setSelected(c._id)}
            />
          );
        })}
        <Form.Check
          type="radio"
          name="cadena"
          id="cadena-new"
          label="Es una cadena nueva (otra magnitud, otro propósito, etc.)"
          checked={selected === 'new'}
          onChange={() => setSelected('new')}
        />

        {frecDistinta && (
          <Alert variant="warning" className="mt-3">
            La frecuencia que indicaste ({datosPaso1.frecuencia.meses} meses) no coincide con la de esta cadena ({selectedCadena?.frecuenciaMeses} meses). Si confirmas la continuidad, la cadena pasará a {datosPaso1.frecuencia.meses} meses.
          </Alert>
        )}
        {selectedCadena && (
          <Alert variant="info" className="mt-3">
            ⓘ Al guardar: la actividad anterior quedará cerrada y esta tomará su lugar como vigente.
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onBack}>← Atrás</Button>
        <Button
          variant="primary"
          disabled={!selected}
          onClick={() => onConfirm(selected === 'new' || !selected ? undefined : selected)}
        >
          Confirmar y guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ContinuidadCadenaModal;
