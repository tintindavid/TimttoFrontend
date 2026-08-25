import React from 'react';
import { Badge, Card, Col, Row, Table } from 'react-bootstrap';

import {
  InformePorOtPayload,
  InformeSeccion,
  ObservacionReporte,
  ReporteOtRow,
  RepuestoConsolidadoRow,
} from '@/types/informe.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDateEs(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('es-CO') : '—';
}

function formatPct(pct: number | null): string {
  return pct == null ? '—' : `${pct}%`;
}

function cumplimientoVariant(pct: number | null): 'success' | 'warning' | 'danger' | 'secondary' {
  if (pct == null) return 'secondary';
  if (pct >= 90) return 'success';
  if (pct >= 60) return 'warning';
  return 'danger';
}

const ESTADO_REPORTE_VARIANT: Record<string, string> = {
  Cumplido: 'success',
  Pendiente: 'warning',
  Cancelado: 'danger',
};

function estadoReporteBadge(estado: string) {
  return (
    <Badge bg={ESTADO_REPORTE_VARIANT[estado] || 'secondary'} style={{ fontSize: '0.65rem' }}>
      {estado}
    </Badge>
  );
}

const ESTADO_OPERATIVO_VARIANT: Record<string, string> = {
  Operativo: 'success',
  'Fuera de Servicio': 'danger',
};

function estadoOperativoBadge(estado: string) {
  return (
    <Badge bg={ESTADO_OPERATIVO_VARIANT[estado] || 'secondary'} style={{ fontSize: '0.65rem' }}>
      {estado}
    </Badge>
  );
}

/** Sedes alphabetical, then servicios alphabetical within each sede (defensive — spec requires the backend to already sort). */
function sortSecciones(secciones: InformeSeccion[]): InformeSeccion[] {
  return [...secciones].sort((a, b) => {
    const c1 = a.sede.localeCompare(b.sede, 'es');
    if (c1) return c1;
    return a.servicio.localeCompare(b.servicio, 'es');
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h5
    className="fw-bold text-uppercase mb-3 pb-2"
    style={{ borderBottom: '3px solid #ff6b35', color: '#1a2332', letterSpacing: '0.5px' }}
  >
    {children}
  </h5>
);

const KpiCard: React.FC<{ label: string; value: string | number; border: string }> = ({
  label,
  value,
  border,
}) => (
  <Card className="h-100" style={{ borderLeft: `4px solid ${border}` }}>
    <Card.Body>
      <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
        {label}
      </div>
      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1a2332' }}>{value}</div>
    </Card.Body>
  </Card>
);

const OtsHeaderTable: React.FC<{ payload: InformePorOtPayload }> = ({ payload }) => (
  <div className="table-responsive">
    <Table striped bordered hover size="sm" className="align-middle mb-0">
      <thead className="table-dark" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
        <tr>
          <th>Consecutivo</th>
          <th>Tipo Servicio</th>
          <th>Fecha Creación</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody style={{ fontSize: '0.8rem' }}>
        {payload.meta.otsSeleccionadas.map((ot) => (
          <tr key={ot.otId}>
            <td>{ot.consecutivo}</td>
            <td>{ot.tipoServicio || '—'}</td>
            <td>{formatDateEs(ot.fechaCreacion)}</td>
            <td>{ot.estadoOt || '—'}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
);

/** Hide count cards whose value is 0 to keep the informe clean and avoid confusing the client. */
function buildKpiCards(kpis: InformePorOtPayload['kpis']): { label: string; value: string | number; border: string }[] {
  const cards: { label: string; value: string | number; border: string; hideIfZero?: boolean }[] = [
    { label: 'Cumplimiento', value: formatPct(kpis.cumplimientoPct), border: kpis.cumplimientoPct == null ? '#95a5a6' : kpis.cumplimientoPct >= 90 ? '#27ae60' : kpis.cumplimientoPct >= 60 ? '#f39c12' : '#e74c3c' },
    { label: 'Total Reportes', value: kpis.totalReportes, border: '#3498db', hideIfZero: true },
    { label: 'Cumplidos', value: kpis.cumplidos, border: '#27ae60', hideIfZero: true },
    { label: 'Pendientes', value: kpis.pendientes, border: '#f39c12', hideIfZero: true },
    { label: 'Cancelados', value: kpis.cancelados, border: '#95a5a6', hideIfZero: true },
    { label: 'Correctivos', value: kpis.correctivos, border: '#9b59b6', hideIfZero: true },
    { label: 'Repuestos Instalados', value: kpis.repuestosInstalados, border: '#f39c12', hideIfZero: true },
    { label: 'Costo Total', value: formatCOP(kpis.costoTotal), border: '#e74c3c', hideIfZero: kpis.costoTotal === 0 },
    { label: 'Horas de Servicio', value: `${kpis.horasServicio} h`, border: '#2c3e50', hideIfZero: kpis.horasServicio === 0 },
  ];
  return cards.filter((c) => !(c.hideIfZero && (c.value === 0 || c.value === '0'))).map(({ hideIfZero, ...rest }) => rest);
}

const ClienteInfoCard: React.FC<{ meta: InformePorOtPayload['meta'] }> = ({ meta }) => (
  <Card className="mb-4 shadow-sm">
    <Card.Body>
      <SectionTitle>Información del Cliente</SectionTitle>
      <Row className="g-2" style={{ fontSize: '0.85rem' }}>
        <Col md={6}><strong>Cliente:</strong> {meta.clienteNombre || '—'}</Col>
        <Col md={6}><strong>NIT:</strong> {meta.clienteNit || '—'}</Col>
        <Col md={6}><strong>Ciudad:</strong> {[meta.clienteCiudad, meta.clienteDepartamento].filter(Boolean).join(', ') || '—'}</Col>
        <Col md={6}><strong>Dirección:</strong> {meta.clienteDireccion || '—'}</Col>
        <Col md={6}><strong>Teléfono:</strong> {meta.clienteTelefono || '—'}</Col>
        <Col md={6}><strong>Email:</strong> {meta.clienteEmail || '—'}</Col>
        <Col md={6}><strong>Contacto:</strong> {meta.clienteContacto || '—'}</Col>
      </Row>
    </Card.Body>
  </Card>
);

const EquiposTable: React.FC<{ reportes: ReporteOtRow[] }> = ({ reportes }) => {
  if (!reportes.length) {
    return <p className="text-muted text-center fst-italic py-3">No hay equipos en esta sección.</p>;
  }
  return (
    <div className="table-responsive">
      <Table bordered hover size="sm" className="align-middle">
        <thead className="table-dark" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
          <tr>
            <th>Reporte</th>
            <th>OT</th>
            <th>Equipo</th>
            <th>Serie / Inventario</th>
            <th>Ubicación</th>
            <th>Estado Operativo</th>
            <th>Estado del reporte</th>
            <th>F. Programada</th>
            <th>F. Realizado</th>
            <th>Técnico</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.78rem' }}>
          {reportes.map((r) => (
            <tr key={r.reporteId}>
              <td className="fw-semibold">{r.consecutivo}</td>
              <td>{r.otConsecutivo}</td>
              <td>
                <div className="fw-semibold">{r.equipoNombre}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  {[r.marca, r.modelo].filter(Boolean).join(' — ') || '—'}
                </div>
              </td>
              <td>{[r.serie, r.inventario].filter(Boolean).join(' / ') || '—'}</td>
              <td>{r.ubicacion || '—'}</td>
              <td>{estadoOperativoBadge(r.estadoOperativo)}</td>
              <td>{estadoReporteBadge(r.estadoReporte)}</td>
              <td>{formatDateEs(r.fechaProgramada)}</td>
              <td>{formatDateEs(r.fechaRealizado)}</td>
              <td>{r.tecnico || '—'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

const RepuestosConsolidadosTable: React.FC<{ repuestos: RepuestoConsolidadoRow[] }> = ({ repuestos }) => {
  if (!repuestos.length) return null;
  return (
    <>
      <h6 className="fw-bold mt-3 mb-2">Repuestos</h6>
      <div className="table-responsive">
        <Table striped bordered hover size="sm" className="align-middle">
          <thead className="table-dark" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
            <tr>
              <th>Reporte</th>
              <th>Equipo</th>
              <th>Repuesto</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Precio</th>
              <th>Fecha</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.78rem' }}>
            {repuestos.map((r, i) => (
              <tr key={i}>
                <td>{r.reporteConsecutivo}</td>
                <td>{r.equipo}</td>
                <td>{r.repuesto}</td>
                <td>{r.cantidad}</td>
                <td>{r.estado}</td>
                <td>{formatCOP(r.precio)}</td>
                <td>{formatDateEs(r.fecha)}</td>
                <td style={{ fontSize: '0.7rem' }}>{r.observacion || '—'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
};

const SeccionBlock: React.FC<{ seccion: InformeSeccion }> = ({ seccion }) => (
  <Card className="mb-3 shadow-sm">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">
          {seccion.sede} / {seccion.servicio}
        </h6>
        <Badge bg={cumplimientoVariant(seccion.cumplimientoPct)}>{formatPct(seccion.cumplimientoPct)}</Badge>
      </div>
      <EquiposTable reportes={seccion.reportes} />
      <RepuestosConsolidadosTable repuestos={seccion.repuestos} />
    </Card.Body>
  </Card>
);

const ObservacionesSection: React.FC<{
  observacionesReportes: ObservacionReporte[];
  observacionGeneral: string;
}> = ({ observacionesReportes, observacionGeneral }) => (
  <Card className="mb-4 shadow-sm">
    <Card.Body>
      <SectionTitle>Observaciones</SectionTitle>
      {observacionesReportes.length > 0 ? (
        <ul className="list-unstyled mb-3">
          {observacionesReportes.map((obs, i) => (
            <li key={i} className="mb-2" style={{ fontSize: '0.875rem' }}>
              {/* `obs.consecutivo` already carries the "R" prefix (e.g. 'R000112') per spec example. */}
              <strong>{obs.consecutivo}</strong>{' '}
              <em>&quot;{obs.estadoOperativo}&quot;</em>: {obs.observacion}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted fst-italic mb-3">Sin observaciones de reportes registradas.</p>
      )}
      {observacionGeneral && (
        <p className="mb-0" style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
          {observacionGeneral}
        </p>
      )}
    </Card.Body>
  </Card>
);

// ─── Main component ───────────────────────────────────────────────────────────

export interface InformePorOtPreviewProps {
  payload: InformePorOtPayload;
}

export const InformePorOtPreview: React.FC<InformePorOtPreviewProps> = ({ payload }) => {
  const { meta, kpis, secciones, observacionesReportes, observacionGeneral } = payload;
  // Defensive — spec requires the backend to omit empty sections already.
  const visibleSecciones = sortSecciones(secciones).filter((s) => s.reportes.length > 0);

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* ── Tenant header (mirrors the individual report PDF header) ── */}
      <div
        className="p-3 mb-3 rounded d-flex align-items-center justify-content-between"
        style={{ background: '#ffffff', border: '2px solid #1a2332' }}
      >
        <div style={{ width: 150 }}>
          {meta.tenantLogo ? (
            <img src={meta.tenantLogo} alt={meta.tenantNombre} style={{ maxHeight: 60, maxWidth: 150 }} />
          ) : null}
        </div>
        <div className="text-center">
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a2332', letterSpacing: '0.5px' }}>
            {meta.tenantNombre || 'TIMTTO'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6c757d', letterSpacing: '2px' }}>ESPECIALISTAS EN BIOINGENIERÍA</div>
          <hr className="my-2" />
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a2332', letterSpacing: '1px' }}>
            INFORME DE CUMPLIMIENTO POR ORDEN DE TRABAJO
          </div>
        </div>
        <div style={{ width: 150 }} className="text-end">
          {meta.clienteLogo ? (
            <img src={meta.clienteLogo} alt={meta.clienteNombre} style={{ maxHeight: 60, maxWidth: 150 }} />
          ) : null}
        </div>
      </div>

      {/* ── Cliente info card (full detail, like the individual report PDF) ── */}
      <ClienteInfoCard meta={meta} />

      {/* ── OTs seleccionadas ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <SectionTitle>OTs Incluidas en el Informe</SectionTitle>
          <OtsHeaderTable payload={payload} />
        </Card.Body>
      </Card>

      {/* ── KPIs — hide count cards when value=0 to avoid confusing the client ── */}
      <Row className="g-3 mb-4">
        {buildKpiCards(kpis).map((c) => (
          <Col xs={6} md={3} key={c.label}>
            <KpiCard label={c.label} value={c.value} border={c.border} />
          </Col>
        ))}
      </Row>

      {/* ── Secciones Sede → Servicio ── */}
      {visibleSecciones.map((seccion) => (
        <SeccionBlock key={`${seccion.sede}__${seccion.servicio}`} seccion={seccion} />
      ))}

      {/* ── Observaciones ── */}
      <ObservacionesSection observacionesReportes={observacionesReportes} observacionGeneral={observacionGeneral} />

      {/* ── Footer ── */}
      <div className="p-4 rounded bg-light text-center text-muted" style={{ fontSize: '0.8rem' }}>
        {meta.responsableFirmaUrl && (
          <div className="mb-2">
            <img src={meta.responsableFirmaUrl} alt="Firma del responsable" style={{ maxHeight: 60 }} />
          </div>
        )}
        <div className="fw-semibold text-dark">{meta.responsableNombre || 'Técnico Responsable'}</div>
        <div>Informe generado el {new Date(meta.fechaGeneracion).toLocaleString('es-CO')} — {meta.tenantNombre}</div>
      </div>
    </div>
  );
};

export default InformePorOtPreview;
