import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  ListGroup,
  Modal,
  OverlayTrigger,
  Row,
  Spinner,
  Table,
  Tooltip,
} from 'react-bootstrap';
import { FaCog, FaInfoCircle, FaPlus, FaTrash } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  VerificationMeasurement,
  verificationParamsService,
} from '@/services/verificationParams.service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
);

export interface VerificationTolerance {
  _id?: string;
  magnitud: string;
  unidad?: string;
  umbralAlertaPct: number;
  umbralFueraToleranciaPct: number;
}

interface Props {
  equipoId: string;
  tolerances: VerificationTolerance[];
  onTolerancesChange?: (next: VerificationTolerance[]) => Promise<void> | void;
  canEditTolerances?: boolean;
}

const DEFAULT_TOLERANCE = { umbralAlertaPct: 2, umbralFueraToleranciaPct: 5 };

/** Deterministic distinct colours for series without a design system palette. */
const COLORS = ['#0d6efd', '#dc3545', '#198754', '#fd7e14', '#6f42c1', '#20c997', '#ffc107', '#0dcaf0'];

function toleranceFor(tolerances: VerificationTolerance[], magnitud: string) {
  return tolerances.find((t) => t.magnitud.toLowerCase() === magnitud.toLowerCase()) || {
    magnitud,
    umbralAlertaPct: DEFAULT_TOLERANCE.umbralAlertaPct,
    umbralFueraToleranciaPct: DEFAULT_TOLERANCE.umbralFueraToleranciaPct,
  };
}

/**
 * Classify a measurement against the reference value using the configured
 * tolerance for the magnitude. Returns null when we lack a reference (can't
 * compute a deviation percentage).
 */
function classify(
  medido: number,
  referencia: number | null,
  tol: { umbralAlertaPct: number; umbralFueraToleranciaPct: number },
): { status: 'estable' | 'alerta' | 'fuera'; deviationPct: number } | null {
  if (referencia === null || referencia === 0) return null;
  const deviationPct = Math.abs((medido - referencia) / referencia) * 100;
  if (deviationPct >= tol.umbralFueraToleranciaPct) return { status: 'fuera', deviationPct };
  if (deviationPct >= tol.umbralAlertaPct) return { status: 'alerta', deviationPct };
  return { status: 'estable', deviationPct };
}

const statusBadge = (status: 'estable' | 'alerta' | 'fuera' | null) => {
  if (status === 'estable') return <Badge bg="success">Estable</Badge>;
  if (status === 'alerta') return <Badge bg="warning" text="dark">Alerta</Badge>;
  if (status === 'fuera') return <Badge bg="danger">Fuera de tolerancia</Badge>;
  return <Badge bg="secondary">Sin referencia</Badge>;
};

const InfoPopover: React.FC<{ show: boolean; onHide: () => void }> = ({ show, onHide }) => (
  <Modal show={show} onHide={onHide} size="lg" centered scrollable>
    <Modal.Header closeButton>
      <Modal.Title>
        <FaInfoCircle className="me-2 text-primary" />
        Cómo interpretar la trazabilidad de parámetros
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h6>¿Qué se grafica?</h6>
      <p className="mb-3">
        Cada línea del gráfico representa un <strong>punto de referencia</strong> (patrón) para una magnitud
        del equipo. El eje X es el tiempo (fecha de cada reporte); el eje Y es el valor medido en ese punto.
        La línea discontinua a la altura del valor de referencia sirve como referencia visual de dónde
        <em> debería </em> estar la medición.
      </p>

      <h6>Bandas de clasificación</h6>
      <ul>
        <li><strong>Estable:</strong> desviación absoluta menor al umbral de alerta configurado por magnitud.</li>
        <li><strong>Alerta:</strong> entre el umbral de alerta y el umbral de "fuera de tolerancia". Requiere revisión preventiva.</li>
        <li><strong>Fuera de tolerancia:</strong> supera el umbral crítico. Se recomienda calibración externa antes del próximo uso clínico.</li>
      </ul>
      <p className="text-muted small">
        Los umbrales por defecto son 2% (alerta) y 5% (fuera de tolerancia). Se pueden ajustar por magnitud
        desde el botón <strong>Configurar tolerancias</strong> en esta misma vista.
      </p>

      <h6>Interpretación clínica y regulatoria</h6>
      <p>
        Este seguimiento se enmarca en actividades de <strong>tecnovigilancia</strong> y verificación
        periódica de dispositivos médicos:
      </p>
      <ul>
        <li>
          <strong>Circular INVIMA (Colombia)</strong> sobre tecnovigilancia — obligación de identificar
          y reportar comportamientos anómalos de dispositivos médicos.
        </li>
        <li>
          <strong>ISO 13485</strong> — control de dispositivos de medición y verificación en el sistema
          de calidad.
        </li>
        <li>
          <strong>JCGM 100:2008 (GUM)</strong> — expresión de la incertidumbre de medición; los umbrales
          de tolerancia deben ser consistentes con la incertidumbre del patrón usado.
        </li>
        <li>
          Buenas prácticas: si un mismo punto de referencia queda en <strong>Alerta</strong> o
          <strong> Fuera de tolerancia</strong> en <strong>3 verificaciones consecutivas</strong>, escalar
          a calibración externa antes de continuar operando el equipo.
        </li>
      </ul>

      <h6>Uso del gráfico</h6>
      <ul>
        <li>Hover sobre un punto muestra: fecha, valor medido, valor de referencia, desviación (%) y patrón usado.</li>
        <li>Clic en la leyenda oculta / muestra una serie para aislar tendencias.</li>
        <li>El panel inferior lista la última medición por punto para revisión rápida durante auditorías.</li>
      </ul>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="outline-secondary" onClick={onHide}>Cerrar</Button>
    </Modal.Footer>
  </Modal>
);

interface TolerancesModalProps {
  show: boolean;
  onHide: () => void;
  magnitudes: string[];
  current: VerificationTolerance[];
  onSave: (next: VerificationTolerance[]) => Promise<void>;
}

const TolerancesModal: React.FC<TolerancesModalProps> = ({ show, onHide, magnitudes, current, onSave }) => {
  const [rows, setRows] = useState<VerificationTolerance[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    // Prefill with current + any magnitudes that appear in data but aren't
    // configured yet, so the user only edits from an accurate starting point.
    const known = new Map(current.map((t) => [t.magnitud.toLowerCase(), t]));
    const merged: VerificationTolerance[] = [...current];
    magnitudes.forEach((m) => {
      if (!known.has(m.toLowerCase())) {
        merged.push({ magnitud: m, umbralAlertaPct: 2, umbralFueraToleranciaPct: 5 });
      }
    });
    setRows(merged);
  }, [show, current, magnitudes]);

  const updateRow = (index: number, field: keyof VerificationTolerance, value: string | number) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));
  const addRow = () => setRows((prev) => [...prev, { magnitud: '', umbralAlertaPct: 2, umbralFueraToleranciaPct: 5 }]);

  const submit = async () => {
    const cleaned = rows
      .map((row) => ({
        ...row,
        magnitud: row.magnitud.trim(),
        umbralAlertaPct: Number(row.umbralAlertaPct),
        umbralFueraToleranciaPct: Number(row.umbralFueraToleranciaPct),
      }))
      .filter((row) => row.magnitud.length > 0);
    setSaving(true);
    try {
      await onSave(cleaned);
      onHide();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaCog className="me-2" />
          Configurar tolerancias por magnitud
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted">
          El umbral de alerta debe ser menor al umbral de fuera de tolerancia. Ambos son porcentajes de
          desviación absoluta respecto al valor de referencia.
        </p>
        <Table bordered size="sm" className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Magnitud</th>
              <th style={{ width: 100 }}>Unidad</th>
              <th style={{ width: 140 }}>Alerta (%)</th>
              <th style={{ width: 180 }}>Fuera tolerancia (%)</th>
              <th style={{ width: 48 }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted">Aún no hay magnitudes configuradas.</td></tr>
            )}
            {rows.map((row, index) => (
              <tr key={row._id || `new-${index}`}>
                <td>
                  <Form.Control
                    size="sm"
                    value={row.magnitud}
                    onChange={(e) => updateRow(index, 'magnitud', e.target.value)}
                    placeholder="Ej. Presión, Flujo…"
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={row.unidad || ''}
                    onChange={(e) => updateRow(index, 'unidad', e.target.value)}
                    placeholder="mmHg, L/min…"
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    value={row.umbralAlertaPct}
                    onChange={(e) => updateRow(index, 'umbralAlertaPct', e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    value={row.umbralFueraToleranciaPct}
                    onChange={(e) => updateRow(index, 'umbralFueraToleranciaPct', e.target.value)}
                  />
                </td>
                <td className="text-center">
                  <Button variant="outline-danger" size="sm" onClick={() => removeRow(index)} aria-label="Eliminar fila">
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Button variant="outline-primary" size="sm" onClick={addRow}>
          <FaPlus className="me-1" /> Agregar magnitud
        </Button>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={saving}>Cancelar</Button>
        <Button variant="primary" onClick={submit} disabled={saving}>
          {saving ? <><Spinner as="span" size="sm" animation="border" className="me-1" /> Guardando…</> : 'Guardar tolerancias'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const VerificationTrendsTab: React.FC<Props> = ({
  equipoId,
  tolerances,
  onTolerancesChange,
  canEditTolerances = true,
}) => {
  const [measurements, setMeasurements] = useState<VerificationMeasurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showTolerances, setShowTolerances] = useState(false);

  useEffect(() => {
    if (!equipoId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    verificationParamsService.history(equipoId)
      .then((result) => { if (!cancelled) setMeasurements(result.measurements || []); })
      .catch((err) => {
        console.error('Error loading verification history:', err);
        if (!cancelled) setError('No fue posible cargar el historial de parámetros.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [equipoId]);

  /**
   * Group measurements by (magnitud, unidad) — measuring 50 °C and 50 °F on the
   * same equipment must produce two separate charts because the values are on
   * different scales. Inside each group, split by valorReferencia to produce
   * one line per reference point over time.
   */
  const byMagnitud = useMemo(() => {
    const result: Record<string, {
      magnitud: string;
      unidad: string;
      byRef: Record<string, VerificationMeasurement[]>;
    }> = {};
    measurements.forEach((m) => {
      const magnitud = m.magnitud || 'Sin magnitud';
      const unidad = m.unidad || '';
      // Composite key so different units of the same magnitud don't collide.
      const groupKey = `${magnitud} | ${unidad}`;
      if (!result[groupKey]) result[groupKey] = { magnitud, unidad, byRef: {} };
      const refKey = m.valorReferencia === null ? 'sin-ref' : String(m.valorReferencia);
      if (!result[groupKey].byRef[refKey]) result[groupKey].byRef[refKey] = [];
      result[groupKey].byRef[refKey].push(m);
    });
    return result;
  }, [measurements]);

  const magnitudesInData = useMemo(
    () => Array.from(new Set(Object.values(byMagnitud).map((b) => b.magnitud))),
    [byMagnitud],
  );

  const handleSaveTolerances = async (next: VerificationTolerance[]) => {
    if (onTolerancesChange) await onTolerancesChange(next);
  };

  if (!equipoId) return null;

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">Trazabilidad de parámetros</h5>
            <OverlayTrigger placement="right" overlay={<Tooltip id="vp-info-tt">Cómo interpretar los resultados</Tooltip>}>
              <Button
                variant="link"
                size="sm"
                className="p-0 text-primary"
                onClick={() => setShowInfo(true)}
                aria-label="Información"
              >
                <FaInfoCircle size={22} />
              </Button>
            </OverlayTrigger>
          </div>
          {canEditTolerances && (
            <Button variant="outline-primary" size="sm" onClick={() => setShowTolerances(true)}>
              <FaCog className="me-1" /> Configurar tolerancias
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {loading && (
            <div className="text-center py-4"><Spinner animation="border" /><div className="text-muted mt-2">Cargando…</div></div>
          )}
          {error && <Alert variant="danger">{error}</Alert>}

          {!loading && !error && Object.keys(byMagnitud).length === 0 && (
            <Alert variant="info" className="mb-0">
              Aún no hay mediciones de parámetros registradas para este equipo. Regístralas desde el tab
              <strong> Ver. Parámetros</strong> de cualquier reporte.
            </Alert>
          )}

          {!loading && !error && Object.entries(byMagnitud).map(([groupKey, bucket]) => {
            const { magnitud } = bucket;
            const tol = toleranceFor(tolerances, magnitud);
            // Chronologically-sorted unique labels shared across all series of
            // this magnitud so the X axis stays consistent regardless of which
            // reference points were measured on which date.
            const allTimestamps = Array.from(new Set(
              Object.values(bucket.byRef).flat().map((m) => new Date(m.fecha).getTime()),
            )).sort((a, b) => a - b);
            const labels = allTimestamps.map((ts) => new Date(ts).toLocaleDateString('es-CO'));

            const referenceLines: { label: string; ref: number | null; data: (number | null)[]; measurements: (VerificationMeasurement | null)[] }[] = Object
              .entries(bucket.byRef)
              .map(([refKey, list], idx) => {
                const ref = refKey === 'sin-ref' ? null : Number(refKey);
                const byTs = new Map(list.map((m) => [new Date(m.fecha).getTime(), m]));
                const data = allTimestamps.map((ts) => {
                  const m = byTs.get(ts);
                  return m ? m.valorMedido : null;
                });
                const meas = allTimestamps.map((ts) => byTs.get(ts) || null);
                return {
                  label: ref === null ? 'Sin referencia' : `Ref: ${ref} ${bucket.unidad}`,
                  ref,
                  data,
                  measurements: meas,
                  color: COLORS[idx % COLORS.length],
                } as any;
              });

            const datasets: any[] = [];
            referenceLines.forEach((line, idx) => {
              datasets.push({
                label: line.label,
                data: line.data,
                borderColor: (line as any).color,
                backgroundColor: (line as any).color,
                spanGaps: true,
                tension: 0.15,
                pointRadius: 4,
                pointHoverRadius: 6,
                meta: { ref: line.ref, unidad: bucket.unidad, measurements: line.measurements },
              });
              // Horizontal reference dashed line (only when reference is known).
              if (line.ref !== null) {
                datasets.push({
                  label: `Ref target ${line.ref}`,
                  data: labels.map(() => line.ref),
                  borderColor: (line as any).color,
                  borderDash: [4, 4],
                  borderWidth: 1,
                  pointRadius: 0,
                  fill: false,
                  legendHidden: true,
                });
              }
            });

            const chartData = { labels, datasets };
            const chartOptions: any = {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'nearest', intersect: false },
              plugins: {
                legend: {
                  labels: {
                    filter: (item: any, data: any) => !data.datasets[item.datasetIndex]?.legendHidden,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (ctx: any) => {
                      const ds = ctx.dataset;
                      if (ds.legendHidden) return null;
                      const meas = ds.meta?.measurements?.[ctx.dataIndex] as VerificationMeasurement | null;
                      if (!meas) return `${ds.label}: sin dato`;
                      const parts = [
                        `Medido: ${meas.valorMedido} ${meas.unidad || ''}`.trim(),
                      ];
                      if (meas.valorReferencia !== null) {
                        const c = classify(meas.valorMedido, meas.valorReferencia, tol);
                        parts.push(`Ref: ${meas.valorReferencia} ${meas.unidad || ''}`.trim());
                        if (c) parts.push(`Desviación: ${c.deviationPct.toFixed(2)}% (${c.status})`);
                      }
                      if (meas.patron) parts.push(`Patrón: ${meas.patron}`);
                      if (meas.consecutivo) parts.push(`Reporte: ${meas.consecutivo}`);
                      return parts;
                    },
                  },
                },
              },
              scales: {
                y: { title: { display: true, text: bucket.unidad || 'Valor' } },
                x: { title: { display: true, text: 'Fecha' } },
              },
            };

            // Latest measurement per reference point + KPI summary.
            const latestPerRef = Object.entries(bucket.byRef).map(([refKey, list]) => {
              const sorted = [...list].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
              const latest = sorted[sorted.length - 1];
              const c = classify(latest.valorMedido, latest.valorReferencia, tol);
              return { refKey, latest, classification: c };
            });
            const fueraCount = latestPerRef.filter((r) => r.classification?.status === 'fuera').length;
            const alertaCount = latestPerRef.filter((r) => r.classification?.status === 'alerta').length;
            const magnitudStatus = fueraCount > 0 ? 'fuera' : alertaCount > 0 ? 'alerta' : 'estable';

            return (
              <div key={groupKey} className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">
                    {magnitud} {bucket.unidad && <small className="text-muted">({bucket.unidad})</small>}
                  </h6>
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">
                      Umbral alerta {tol.umbralAlertaPct}% · Fuera {tol.umbralFueraToleranciaPct}%
                    </small>
                    {statusBadge(magnitudStatus as any)}
                  </div>
                </div>
                <div style={{ height: '320px' }}>
                  <Line data={chartData} options={chartOptions} />
                </div>

                <div className="mt-3">
                  <small className="text-muted d-block mb-2 fw-semibold">Última medición por punto de referencia</small>
                  <ListGroup>
                    {latestPerRef.map(({ refKey, latest, classification }) => (
                      <ListGroup.Item key={refKey} className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                          <strong>{refKey === 'sin-ref' ? 'Sin referencia' : `Ref: ${refKey} ${bucket.unidad}`}</strong>
                          <div className="small text-muted">
                            {new Date(latest.fecha).toLocaleDateString('es-CO')} · Medido {latest.valorMedido} {latest.unidad || ''}
                            {latest.patron && ` · Patrón ${latest.patron}`}
                            {latest.consecutivo && ` · ${latest.consecutivo}`}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {classification && (
                            <small className="text-muted">Δ {classification.deviationPct.toFixed(2)}%</small>
                          )}
                          {statusBadge(classification?.status ?? null)}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              </div>
            );
          })}
        </Card.Body>
      </Card>

      <InfoPopover show={showInfo} onHide={() => setShowInfo(false)} />
      <TolerancesModal
        show={showTolerances}
        onHide={() => setShowTolerances(false)}
        magnitudes={magnitudesInData}
        current={tolerances}
        onSave={handleSaveTolerances}
      />
    </>
  );
};

export default VerificationTrendsTab;
