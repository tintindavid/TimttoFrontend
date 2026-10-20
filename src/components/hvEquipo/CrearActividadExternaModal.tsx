import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { TIPOS_ACTIVIDAD, ESTADOS_FINAL_LABELS } from '@/constants/actividadExterna';
import type { CreateActividadDto } from '@/types/actividadExterna.types';
import { EstadoOperativoValues, EstadoOperativoDefault } from '@/constants/estadoOperativo';
import EvidenciaInput, { type EvidenciaValue } from './EvidenciaInput';
import FrecuenciaInput from './FrecuenciaInput';
import ProveedorSelect from './ProveedorSelect';

interface Props {
  show: boolean;
  onClose: () => void;
  onNext: (dto: CreateActividadDto, file?: File) => void;
  initial?: Partial<CreateActividadDto>;
  /** Current operative state of the equipment, preselected in the form. */
  estadoActual?: string;
  /** The type (and the custom type text) come from a chain and cannot be changed (quick load from the schedule). */
  tipoFijo?: boolean;
}

const DEFAULT_DATA: Partial<CreateActividadDto> = {
  estadoFinal: 'aprobada',
  frecuencia: { esUnica: false, meses: 12 },
};

const CrearActividadExternaModal: React.FC<Props> = ({ show, onClose, onNext, initial, estadoActual, tipoFijo = false }) => {
  const estadoInicial = (EstadoOperativoValues as readonly string[]).includes(estadoActual ?? '')
    ? (estadoActual as string)
    : EstadoOperativoDefault;
  const [data, setData] = useState<Partial<CreateActividadDto>>({ ...DEFAULT_DATA, estadoOperativo: estadoInicial, ...initial });
  const [evidencia, setEvidencia] = useState<EvidenciaValue>({ mode: 'none' });
  const [err, setErr] = useState<string | null>(null);
  const todayISO = new Date().toISOString().slice(0, 10);

  const update = (patch: Partial<CreateActividadDto>) => setData((d) => ({ ...d, ...patch }));

  const submit = () => {
    const trimmed: Partial<CreateActividadDto> = {
      ...data,
      consecutivoExterno: data.consecutivoExterno?.trim(),
      proveedor: data.proveedorId ? undefined : data.proveedor?.trim(),
      observacion: data.observacion?.trim() || undefined,
      tipoCustom: data.tipo === 'otro' ? data.tipoCustom?.trim() : undefined,
      estadoFinalCustom: data.estadoFinal === 'otro' ? data.estadoFinalCustom?.trim() : undefined,
    };
    const required: (keyof CreateActividadDto)[] = ['tipo', 'consecutivoExterno', 'fecha', 'estadoOperativo', 'estadoFinal'];
    for (const k of required) {
      if (!trimmed[k]) {
        setErr('Completa los campos obligatorios.');
        return;
      }
    }
    if (!trimmed.proveedorId && !trimmed.proveedor) {
      setErr('Selecciona un proveedor o escribe el nombre.');
      return;
    }
    if (trimmed.tipo === 'otro' && !trimmed.tipoCustom) {
      setErr('Especifica el tipo de actividad cuando seleccionas "Otro".');
      return;
    }
    if (trimmed.estadoFinal === 'otro' && !trimmed.estadoFinalCustom) {
      setErr('Especifica el estado final cuando seleccionas "Otro".');
      return;
    }
    if (evidencia.mode === 'file' && !evidencia.file) {
      setErr('Selecciona un archivo o cambia a sin evidencia.');
      return;
    }
    if (evidencia.mode === 'link' && !evidencia.link) {
      setErr('Ingresa un enlace válido o cambia a sin evidencia.');
      return;
    }
    const frecuencia = data.frecuencia ?? { esUnica: false, meses: undefined };
    if (!frecuencia.esUnica && (frecuencia.meses === undefined || frecuencia.meses < 1)) {
      setErr('Indica cada cuántos meses se repite la actividad (mínimo 1) o márcala como única.');
      return;
    }
    setErr(null);
    const dto: CreateActividadDto = {
      ...(trimmed as CreateActividadDto),
      frecuencia: frecuencia.esUnica ? { esUnica: true } : { esUnica: false, meses: frecuencia.meses },
      enlace: evidencia.mode === 'link' ? evidencia.link : undefined,
    };
    onNext(dto, evidencia.mode === 'file' ? evidencia.file : undefined);
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Agregar actividad externa</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3" controlId="act-tipo">
          <Form.Label>Tipo de actividad *</Form.Label>
          <Form.Select
            value={data.tipo ?? ''}
            disabled={tipoFijo}
            onChange={(e) => update({ tipo: e.target.value as CreateActividadDto['tipo'] })}
          >
            <option value="">— seleccionar —</option>
            {TIPOS_ACTIVIDAD.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Form.Select>
        </Form.Group>
        {data.tipo === 'otro' && (
          <Form.Group className="mb-3" controlId="act-tipo-custom">
            <Form.Label>Especifica cuál *</Form.Label>
            <Form.Control value={data.tipoCustom ?? ''} disabled={tipoFijo} onChange={(e) => update({ tipoCustom: e.target.value })} />
          </Form.Group>
        )}
        <Row>
          <Col>
            <Form.Group className="mb-3" controlId="act-consecutivo">
              <Form.Label>Consecutivo *</Form.Label>
              <Form.Control
                value={data.consecutivoExterno ?? ''}
                onChange={(e) => update({ consecutivoExterno: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-3" controlId="act-fecha">
              <Form.Label>Fecha *</Form.Label>
              <Form.Control type="date" max={todayISO} value={data.fecha ?? ''} onChange={(e) => update({ fecha: e.target.value })} />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col>
            <ProveedorSelect
              value={{ proveedorId: data.proveedorId, proveedor: data.proveedor }}
              onChange={(v) => update({ proveedorId: v.proveedorId, proveedor: v.proveedor })}
            />
          </Col>
          <Col>
            <Form.Group className="mb-3" controlId="act-estado">
              <Form.Label>Resultado *</Form.Label>
              <Form.Select
                value={data.estadoFinal ?? ''}
                onChange={(e) => update({ estadoFinal: e.target.value as CreateActividadDto['estadoFinal'] })}
              >
                {Object.entries(ESTADOS_FINAL_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3" controlId="act-estado-operativo">
          <Form.Label>Estado operativo *</Form.Label>
          <Form.Select
            value={data.estadoOperativo ?? ''}
            onChange={(e) => update({ estadoOperativo: e.target.value })}
          >
            {EstadoOperativoValues.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">Estado en que queda el equipo; pasa a ser su estado actual si es el último servicio.</Form.Text>
        </Form.Group>
        {data.estadoFinal === 'otro' && (
          <Form.Group className="mb-3" controlId="act-estado-custom">
            <Form.Label>Especifica el resultado *</Form.Label>
            <Form.Control
              value={data.estadoFinalCustom ?? ''}
              onChange={(e) => update({ estadoFinalCustom: e.target.value })}
            />
          </Form.Group>
        )}
        <Form.Group className="mb-3" controlId="act-observacion">
          <Form.Label>Observación</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={data.observacion ?? ''}
            onChange={(e) => update({ observacion: e.target.value })}
          />
        </Form.Group>
        <div className="mb-3">
          <EvidenciaInput value={evidencia} onChange={setEvidencia} />
        </div>
        <div className="mb-3">
          <FrecuenciaInput
            value={data.frecuencia ?? { esUnica: false, meses: 12 }}
            onChange={(f) => update({ frecuencia: f })}
            sinUnica={tipoFijo}
          />
        </div>
        {err && <div className="text-danger small" role="alert">{err}</div>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={submit}>Continuar →</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CrearActividadExternaModal;
