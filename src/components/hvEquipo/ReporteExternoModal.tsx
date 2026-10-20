import React, { useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { useCreateReporteExterno } from '@/hooks/useReporteExterno';
import {
  ESTADOS_OPERATIVOS,
  type CreateReporteExternoDto,
  type EstadoOperativoExterno,
  type TipoMttoExterno,
} from '@/services/reporteExterno.service';
import type { VerificationParam } from '@/types/reporte.types';
import VerificationParamsEditor from '@/components/ots/VerificationParamsEditor';
import EvidenciaInput, { type EvidenciaValue } from './EvidenciaInput';
import ProveedorSelect, { type ProveedorValue } from './ProveedorSelect';
import MesesProgramadosBar from './MesesProgramadosBar';

interface Props {
  show: boolean;
  /** Preventive adds the verification-parameters section; corrective does not. */
  tipoMtto: TipoMttoExterno;
  equipoId: string;
  /** Current operative state of the equipment, preselected in the form. */
  estadoActual?: string;
  /** Scheduled months of the equipment and the maintenance already done, shown as a guide (preventive only). */
  mesesMtto?: string[];
  mesesRealizados?: { mes: string; fecha?: string }[];
  /** Initial service date (YYYY-MM-DD), e.g. the month of the schedule cell it was opened from. Never later than today. */
  fechaInicial?: string;
  onClose: () => void;
  /** Called after a successful save with the warnings returned by the server. */
  onSaved?: (warnings: string[]) => void;
}

const errorText = (err: unknown): string => {
  const e = err as { response?: { data?: { message?: string; error?: { code?: string } } }; message?: string };
  const code = e?.response?.data?.error?.code;
  if (code === 'CAPABILITY_DISABLED') return 'Tu organización no tiene habilitado el registro de servicios de terceros.';
  if (code === 'FORBIDDEN') return 'No tienes permiso para registrar servicios.';
  return e?.response?.data?.message || e?.message || 'No se pudo registrar el servicio.';
};

const HTTP_URL = /^https?:\/\//i;

/**
 * Registers a maintenance performed by a third party (reportes-externos-mp-mc). The TIMTTO consecutive is
 * assigned by the server on save; the third party's own document number is a separate, optional field.
 */
const ReporteExternoModal: React.FC<Props> = ({ show, tipoMtto, equipoId, estadoActual, mesesMtto, mesesRealizados, fechaInicial, onClose, onSaved }) => {
  const createMutation = useCreateReporteExterno(equipoId);
  // Local calendar day (not UTC): after 19:00 in Colombia the UTC day is already tomorrow.
  const todayISO = (() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  })();
  const esPreventivo = tipoMtto === 'Preventivo';

  const initialEstado = (ESTADOS_OPERATIVOS as string[]).includes(estadoActual ?? '')
    ? (estadoActual as EstadoOperativoExterno)
    : 'Operativo';

  const [fecha, setFecha] = useState(fechaInicial && fechaInicial <= todayISO ? fechaInicial : todayISO);
  const [estadoOperativo, setEstadoOperativo] = useState<EstadoOperativoExterno>(initialEstado);
  const [proveedor, setProveedor] = useState<ProveedorValue>({});
  const [consecutivoDocumento, setConsecutivoDocumento] = useState('');
  const [observacion, setObservacion] = useState('');
  const [evidencia, setEvidencia] = useState<EvidenciaValue>({ mode: 'none' });
  const [parametros, setParametros] = useState<VerificationParam[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const titulo = esPreventivo ? 'Adicionar mantenimiento preventivo externo' : 'Adicionar mantenimiento correctivo externo';

  const submit = async () => {
    if (!fecha) {
      setErr('Indica la fecha del servicio.');
      return;
    }
    if (fecha > todayISO) {
      setErr('La fecha del servicio no puede ser futura.');
      return;
    }
    const nombre = proveedor.proveedor?.trim();
    if (!proveedor.proveedorId && !nombre) {
      setErr('Selecciona un proveedor o escribe el nombre.');
      return;
    }
    if (evidencia.mode === 'file' && !evidencia.file) {
      setErr('Selecciona un archivo o cambia a sin adjunto.');
      return;
    }
    if (evidencia.mode === 'link' && !(evidencia.link && HTTP_URL.test(evidencia.link))) {
      setErr('Ingresa un enlace válido (http o https) o cambia a sin adjunto.');
      return;
    }
    setErr(null);

    const dto: CreateReporteExternoDto = {
      tipoMtto,
      fecha,
      estadoOperativo,
      ...(proveedor.proveedorId ? { proveedorId: proveedor.proveedorId } : { proveedor: nombre }),
      consecutivoDocumento: consecutivoDocumento.trim() || undefined,
      observacion: observacion.trim() || undefined,
      enlace: evidencia.mode === 'link' ? evidencia.link : undefined,
      ...(esPreventivo ? { verificationParam: parametros } : {}),
    };

    try {
      const res = await createMutation.mutateAsync({ dto, file: evidencia.mode === 'file' ? evidencia.file : undefined });
      onSaved?.(res.warnings ?? []);
    } catch (error) {
      setErr(errorText(error));
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{titulo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small">
          Registra un servicio realizado por un tercero. Quedará en el historial del equipo como un reporte externo.
        </p>
        {err && <Alert variant="danger" role="alert">{err}</Alert>}
        {esPreventivo && <MesesProgramadosBar meses={mesesMtto} realizados={mesesRealizados} fecha={fecha} />}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="rep-ext-consecutivo">
              <Form.Label>Consecutivo</Form.Label>
              <Form.Control value="Se asigna al guardar" readOnly disabled />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="rep-ext-doc">
              <Form.Label>N.º de documento del tercero</Form.Label>
              <Form.Control
                value={consecutivoDocumento}
                maxLength={100}
                placeholder="Certificado o informe del proveedor"
                onChange={(e) => setConsecutivoDocumento(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="rep-ext-fecha">
              <Form.Label>Fecha del servicio *</Form.Label>
              <Form.Control type="date" max={todayISO} value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="rep-ext-estado">
              <Form.Label>Estado operativo *</Form.Label>
              <Form.Select value={estadoOperativo} onChange={(e) => setEstadoOperativo(e.target.value as EstadoOperativoExterno)}>
                {ESTADOS_OPERATIVOS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <ProveedorSelect controlId="rep-ext-proveedor" value={proveedor} onChange={setProveedor} />
        <Form.Group className="mb-3" controlId="rep-ext-observacion">
          <Form.Label>Observación</Form.Label>
          <Form.Control as="textarea" rows={2} maxLength={2000} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
        </Form.Group>
        <div className="mb-3">
          <EvidenciaInput value={evidencia} onChange={setEvidencia} />
        </div>
        {esPreventivo && (
          <div className="mb-2" data-testid="seccion-verificacion">
            <h6 className="mb-2">Verificación de parámetros</h6>
            <VerificationParamsEditor mode="draft" value={[]} equipoId={equipoId} onChange={setParametros} />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={createMutation.isLoading}>Cancelar</Button>
        <Button variant="primary" onClick={submit} disabled={createMutation.isLoading}>
          {createMutation.isLoading ? (<><Spinner size="sm" animation="border" className="me-1" /> Guardando…</>) : 'Guardar servicio'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReporteExternoModal;
