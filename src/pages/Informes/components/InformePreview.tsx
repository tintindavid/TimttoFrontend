import React from 'react';
import { Card, Row, Col, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import {
  InformePayload,
  ReportRow,
  EquipoResumen,
  RepuestoRow,
} from '@/types/informe.types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    Realizado: 'success',
    Programado: 'warning',
    Cancelado: 'danger',
    Instalado: 'success',
    Solicitado: 'info',
  };
  return (
    <Badge bg={map[estado] || 'secondary'} className="text-uppercase fs-6" style={{ fontSize: '0.65rem' }}>
      {estado}
    </Badge>
  );
}

function cumplimientoVariant(pct: number): 'success' | 'warning' | 'danger' {
  if (pct >= 90) return 'success';
  if (pct >= 70) return 'warning';
  return 'danger';
}

// ─── Charts ──────────────────────────────────────────────────────────────────

const CumplimientoDonut: React.FC<{ realizados: number; programados: number }> = ({
  realizados,
  programados,
}) => {
  const pendientes = Math.max(0, programados - realizados);
  const data = {
    labels: ['Realizados', 'Pendientes'],
    datasets: [{
      data: [realizados, pendientes],
      backgroundColor: ['#27ae60', '#e0e0e0'],
      borderWidth: 0,
    }],
  };
  return (
    <Doughnut
      data={data}
      options={{
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed}`,
            },
          },
        },
      }}
    />
  );
};

const CumplimientoBarChart: React.FC<{ equipos: EquipoResumen[] }> = ({ equipos }) => {
  const labels = equipos.map((e) =>
    e.nombre.length > 22 ? `${e.nombre.substring(0, 20)}…` : e.nombre
  );
  const data = {
    labels,
    datasets: [{
      label: 'Cumplimiento %',
      data: equipos.map((e) => e.cumplimiento),
      backgroundColor: equipos.map((e) =>
        e.cumplimiento >= 90 ? '#27ae60' : e.cumplimiento >= 70 ? '#f39c12' : '#e74c3c'
      ),
      borderRadius: 4,
    }],
  };
  return (
    <Bar
      data={data}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: (v) => `${v}%` },
          },
          x: { ticks: { font: { size: 11 } } },
        },
      }}
    />
  );
};

// ─── Sub-sections ─────────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h5
    className="fw-bold text-uppercase mb-3 pb-2"
    style={{
      borderBottom: '3px solid #ff6b35',
      color: '#1a2332',
      letterSpacing: '0.5px',
    }}
  >
    {children}
  </h5>
);

const KpiCard: React.FC<{
  label: string;
  value: string | number;
  description?: string;
  border: string;
}> = ({ label, value, description, border }) => (
  <Card className="h-100" style={{ borderLeft: `4px solid ${border}` }}>
    <Card.Body>
      <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
        {label}
      </div>
      <div className="fw-bold mb-1" style={{ fontSize: '1.8rem', color: '#1a2332' }}>
        {value}
      </div>
      {description && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{description}</div>}
    </Card.Body>
  </Card>
);

const ReportsTable: React.FC<{ rows: ReportRow[]; showDiagnostico?: boolean }> = ({
  rows,
  showDiagnostico = false,
}) => {
  if (!rows.length) {
    return <p className="text-muted text-center fst-italic py-3">No hay registros en este periodo.</p>;
  }
  return (
    <div className="table-responsive">
      <Table striped bordered hover size="sm" className="align-middle">
        <thead className="table-dark" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
          <tr>
            <th>#</th>
            <th>Equipo</th>
            <th>Sede</th>
            <th>F. Programada</th>
            <th>F. Realizado</th>
            <th>Técnico</th>
            {showDiagnostico && <th>Diagnóstico</th>}
            <th>Estado</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.8rem' }}>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.consecutivo}</td>
              <td>
                <div className="fw-semibold">{r.equipoNombre}</div>
                {(r.modelo || r.serie || r.inventario) && (
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {[r.modelo && `Modelo: ${r.modelo}`, r.serie && `Serie: ${r.serie}`, r.inventario && `Inv: ${r.inventario}`].filter(Boolean).join(' | ')}
                  </div>
                )}
              </td>
              <td>{r.sede || '—'}</td>
              <td>{r.fechaProgramada || '—'}</td>
              <td>{r.fechaRealizado || '—'}</td>
              <td>{r.tecnico || '—'}</td>
              {showDiagnostico && <td>{r.diagnostico || '—'}</td>}
              <td>{estadoBadge(r.estado)}</td>
              <td>{r.duracion} min</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

// ─── Equipo grouping helper ───────────────────────────────────────────────────

function sortEquipos(equipos: EquipoResumen[]): EquipoResumen[] {
  return [...equipos].sort((a, b) => {
    const c1 = (a.sede || '(Sin sede)').localeCompare(b.sede || '(Sin sede)', 'es');
    if (c1) return c1;
    const c2 = (a.servicio || '(Sin servicio)').localeCompare(b.servicio || '(Sin servicio)', 'es');
    if (c2) return c2;
    return a.nombre.localeCompare(b.nombre, 'es');
  });
}

function groupEquipos(
  equipos: EquipoResumen[]
): Map<string, Map<string, EquipoResumen[]>> {
  const groups = new Map<string, Map<string, EquipoResumen[]>>();
  for (const eq of sortEquipos(equipos)) {
    const sede = eq.sede || '(Sin sede)';
    const servicio = eq.servicio || '(Sin servicio)';
    if (!groups.has(sede)) groups.set(sede, new Map());
    const sedeMap = groups.get(sede)!;
    if (!sedeMap.has(servicio)) sedeMap.set(servicio, []);
    sedeMap.get(servicio)!.push(eq);
  }
  return groups;
}

const COL_EQUIPOS = 9;

const EquiposTable: React.FC<{ equipos: EquipoResumen[] }> = ({ equipos }) => {
  if (!equipos.length) {
    return <p className="text-muted text-center fst-italic py-3">No hay equipos en este periodo.</p>;
  }
  const groups = groupEquipos(equipos);
  const rows: React.ReactNode[] = [];

  groups.forEach((servicioMap, sede) => {
    rows.push(
      <tr key={`sede-${sede}`}>
        <td
          colSpan={COL_EQUIPOS}
          className="fw-bold text-white text-uppercase"
          style={{ background: '#1a2332', padding: '6px 12px', fontSize: '0.72rem', letterSpacing: '1px' }}
        >
          📍 {sede}
        </td>
      </tr>
    );
    servicioMap.forEach((eqList, servicio) => {
      rows.push(
        <tr key={`svc-${sede}-${servicio}`}>
          <td
            colSpan={COL_EQUIPOS}
            className="fw-semibold"
            style={{ background: '#e8edf2', padding: '4px 12px 4px 24px', fontSize: '0.72rem', color: '#2c3e50' }}
          >
            ⚙ {servicio}
          </td>
        </tr>
      );
      eqList.forEach((eq) =>
        rows.push(
          <tr key={eq.equipoId}>
            <td>{eq.inventario || '—'}</td>
            <td>{eq.nombre}</td>
            <td>{eq.marca}</td>
            <td>{eq.sede || '—'}</td>
            <td>{eq.totalProgramados}</td>
            <td>{eq.totalRealizados}</td>
            <td>
              <ProgressBar
                now={eq.cumplimiento}
                label={`${eq.cumplimiento}%`}
                variant={cumplimientoVariant(eq.cumplimiento)}
                style={{ minWidth: '80px' }}
              />
            </td>
            <td>{formatCOP(eq.costoRepuestos)}</td>
            <td>{eq.estadoOperativo}</td>
          </tr>
        )
      );
    });
  });

  return (
    <div className="table-responsive">
      <Table bordered hover size="sm" className="align-middle">
        <thead className="table-dark" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
          <tr>
            <th>Inventario</th>
            <th>Equipo</th>
            <th>Marca</th>
            <th>Sede</th>
            <th>Prog.</th>
            <th>Real.</th>
            <th>Cumplimiento</th>
            <th>Costo Rep.</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.8rem' }}>{rows}</tbody>
      </Table>
    </div>
  );
};

const RepuestosTable: React.FC<{ repuestos: RepuestoRow[] }> = ({ repuestos }) => {
  if (!repuestos.length) {
    return <p className="text-muted text-center fst-italic py-3">No hay repuestos en este periodo.</p>;
  }
  return (
    <div className="table-responsive">
      <Table striped bordered hover size="sm" className="align-middle">
        <thead className="table-dark" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
          <tr>
            <th>Repuesto</th>
            <th>Equipo</th>
            <th>Cantidad</th>
            <th>Estado</th>
            <th>Precio Unit.</th>
            <th>Precio Total</th>
            <th>F. Solicitud</th>
            <th>F. Instalación</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.8rem' }}>
          {repuestos.map((r, i) => (
            <tr key={i}>
              <td>{r.nombre}</td>
              <td>{r.equipo || '—'}</td>
              <td>{r.cantidad}</td>
              <td>{estadoBadge(r.estado)}</td>
              <td>{formatCOP(r.precioUnitario)}</td>
              <td>{formatCOP(r.precioTotal)}</td>
              <td>{r.fechaSolicitud || '—'}</td>
              <td>{r.fechaInstalacion || '—'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface InformePreviewProps {
  payload: InformePayload;
}

export const InformePreview: React.FC<InformePreviewProps> = ({ payload }) => {
  const { meta, kpis, preventivos, correctivos, equipos, repuestos, costos, observaciones, observacionGeneral } = payload;

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* ── Header ── */}
      <div
        className="p-4 mb-4 text-white rounded"
        style={{ background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 100%)' }}
      >
        <Row className="align-items-center g-3">
          <Col>
            {meta.clienteLogo ? (
              <img src={meta.clienteLogo} alt={meta.clienteNombre} style={{ maxHeight: 60, maxWidth: 150 }} />
            ) : (
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{meta.clienteNombre}</div>
            )}
          </Col>
          <Col className="text-end">
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{meta.periodoLabel.toUpperCase()}</div>
            <div style={{ opacity: 0.85, fontSize: '0.85rem' }}>Informe Mensual de Mantenimiento</div>
          </Col>
        </Row>
        <Row className="mt-3 pt-3 g-3" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          {[
            ['Cliente', meta.clienteNombre],
            ['Ciudad', meta.clienteCiudad || '—'],
            ['Periodo', meta.periodoLabel],
            ['Generado', new Date(meta.fechaGeneracion).toLocaleDateString('es-CO')],
            ['Responsable', meta.responsableNombre || '—'],
          ].map(([label, value]) => (
            <Col key={label} xs="auto">
              <div style={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value}</div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ── KPIs ── */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={3}>
          <KpiCard
            label="Cumplimiento Preventivo"
            value={`${kpis.cumplimientoPreventivo}%`}
            description={`${kpis.totalRealizados} de ${kpis.totalProgramados} realizados`}
            border={kpis.cumplimientoPreventivo >= 90 ? '#27ae60' : kpis.cumplimientoPreventivo >= 70 ? '#f39c12' : '#e74c3c'}
          />
        </Col>
        <Col xs={12} md={3}>
          <KpiCard label="Mtto. Correctivos" value={kpis.totalCorrectivos} description="Intervenciones no programadas" border="#3498db" />
        </Col>
        <Col xs={12} md={3}>
          <KpiCard label="Repuestos Solicitados" value={kpis.totalRepuestosSolicitados} description={`${kpis.totalRepuestosInstalados} instalados`} border="#f39c12" />
        </Col>
        <Col xs={12} md={3}>
          <KpiCard label="Costo Repuestos" value={formatCOP(kpis.costoTotalRepuestos)} description="Solo piezas instaladas" border="#e74c3c" />
        </Col>
        <Col xs={12} md={3}>
          <KpiCard label="Horas de Servicio" value={`${kpis.horasServicio} h`} description="Tiempo total de intervención" border="#9b59b6" />
        </Col>
      </Row>

      {/* ── Resumen Ejecutivo ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <SectionTitle>Resumen Ejecutivo</SectionTitle>
          <p className="mb-3" style={{ lineHeight: 1.8 }}>
            Durante el periodo <strong>{meta.periodoLabel}</strong>, se registraron{' '}
            <strong>{kpis.totalProgramados} mantenimientos preventivos programados</strong>, de los cuales{' '}
            <strong>{kpis.totalRealizados} fueron realizados</strong>, alcanzando un cumplimiento del{' '}
            <strong>{kpis.cumplimientoPreventivo}%</strong>. Se atendieron además{' '}
            <strong>{kpis.totalCorrectivos} mantenimientos correctivos</strong>.
          </p>
          <Row className="g-3 align-items-center">
            <Col xs={12} md={8}>
              <Row className="g-3">
                {[
                  ['Prev. Programados', kpis.totalProgramados],
                  ['Prev. Realizados', kpis.totalRealizados],
                  ['Correctivos', kpis.totalCorrectivos],
                  ['Repuestos Solicitados', kpis.totalRepuestosSolicitados],
                ].map(([label, val]) => (
                  <Col key={String(label)} xs={6} md={3}>
                    <div className="text-center p-3 rounded border bg-light">
                      <div className="fw-bold" style={{ fontSize: '1.6rem', color: '#1a2332' }}>{val}</div>
                      <div className="text-muted text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>{label}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
            <Col xs={12} md={4}>
              <div style={{ maxWidth: 200, margin: '0 auto' }}>
                <CumplimientoDonut
                  realizados={kpis.totalRealizados}
                  programados={kpis.totalProgramados}
                />
                <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: '0.72rem' }}>
                  Cumplimiento preventivo
                </p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Mantenimientos Preventivos ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <SectionTitle>Mantenimientos Preventivos</SectionTitle>
          <ReportsTable rows={preventivos} />
        </Card.Body>
      </Card>

      {/* ── Mantenimientos Correctivos ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <SectionTitle>Mantenimientos Correctivos</SectionTitle>
          <ReportsTable rows={correctivos} showDiagnostico />
        </Card.Body>
      </Card>

      {/* ── Inventario de Equipos ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <SectionTitle>Inventario de Equipos</SectionTitle>
          {equipos.length > 0 && (
            <div className="mb-4" style={{ maxHeight: 260 }}>
              <CumplimientoBarChart equipos={sortEquipos(equipos)} />
            </div>
          )}
          <EquiposTable equipos={equipos} />
        </Card.Body>
      </Card>

      {/* ── Repuestos ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <SectionTitle>Repuestos y Materiales</SectionTitle>
          <RepuestosTable repuestos={repuestos} />
        </Card.Body>
      </Card>

      {/* ── Costos ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <SectionTitle>Análisis de Costos</SectionTitle>
          <div className="d-flex align-items-center justify-content-between p-3 rounded bg-light">
            <span className="text-muted fw-semibold">Costo Total Repuestos Instalados</span>
            <span className="fw-bold fs-5">{formatCOP(costos.repuestos)}</span>
          </div>
        </Card.Body>
      </Card>

      {/* ── Observaciones ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <SectionTitle>Observaciones</SectionTitle>
          {observacionGeneral && (
            <div
              className="mb-3 p-3"
              style={{ borderLeft: '5px solid #ff6b35', background: '#fff8f5', borderRadius: 6 }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ff6b35', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Observación General
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {observacionGeneral}
              </div>
            </div>
          )}
          {observaciones.length > 0 ? (
            <ul className="list-unstyled mb-0">
              {observaciones.map((obs, i) => (
                <li
                  key={i}
                  className="p-3 mb-2 rounded"
                  style={{ borderLeft: '4px solid #3498db', background: '#f8f9fa', fontSize: '0.875rem' }}
                >
                  {obs}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted fst-italic mb-0">Sin observaciones registradas en este periodo.</p>
          )}
        </Card.Body>
      </Card>

      {/* ── Footer ── */}
      <div className="p-4 rounded bg-light text-center text-muted" style={{ fontSize: '0.8rem' }}>
        Informe generado el {new Date(meta.fechaGeneracion).toLocaleString('es-CO')} — {meta.tenantNombre}
        <Row className="mt-4 g-4 justify-content-center">
          {[
            [meta.responsableNombre || 'Técnico Responsable', 'Responsable de Mantenimiento'],
            [meta.clienteNombre, 'Representante del Cliente'],
          ].map(([name, role]) => (
            <Col key={role} xs={12} md={5}>
              <div className="text-center">
                <div style={{ borderTop: '2px solid #2c3e50', margin: '40px 20px 8px 20px' }} />
                <div className="fw-semibold text-dark">{name}</div>
                <div className="text-muted">{role}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default InformePreview;
