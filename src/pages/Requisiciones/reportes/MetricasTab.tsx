import React, { useState } from 'react';
import { Alert, Button, Card, Col, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap';
import { useGetAreas } from '@/hooks/useAreas';
import { useGetTiposRequisicion } from '@/hooks/useTiposRequisicion';
import { useGetMetricas } from '@/hooks/useRequisicionReportes';
import { REQUISICION_ESTADO_LABELS } from '@/types/requisicion.types';
import {
  METRICA_CICLO_KEYS,
  METRICA_CICLO_LABELS,
  type Metricas,
  type MetricasFiltros,
} from '@/types/requisicionReportes.types';
import { formatMoney } from '@/utils/requisicion.utils';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { formatHoras, formatPorcentaje } from '@/utils/requisicionReportes.utils';
import ReqHelp from '../help/ReqHelp';
import ChartCard from './ChartCard';

const groupByMoneda = <T extends { moneda: string }>(rows: T[]): Array<[string, T[]]> => {
  const groups = new Map<string, T[]>();
  rows.forEach((row) => groups.set(row.moneda, [...(groups.get(row.moneda) ?? []), row]));
  return Array.from(groups.entries());
};

const Kpi: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <Card className="tt-card h-100" data-testid="metricas-kpi">
    <Card.Body>
      <div className="fs-4 fw-semibold">{value}</div>
      <div className="text-muted small">{label}</div>
      {hint && <div className="text-muted small">{hint}</div>}
    </Card.Body>
  </Card>
);

const MetricasResultado: React.FC<{ metricas: Metricas }> = ({ metricas }) => {
  const { tasaRechazo, sinEstimar, devolucionesEntregables } = metricas;
  // The backend ratio (0..1) is the single source; with nothing sent there is no rate to show.
  const tasa = tasaRechazo.enviadas > 0 ? tasaRechazo.tasa : null;
  const estados = metricas.porEstado.filter((e) => e.count > 0);
  const ciclosConDatos = METRICA_CICLO_KEYS.filter((key) => metricas.ciclos[key].n > 0);
  const sinDatos = metricas.total === 0;

  return (
    <>
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Kpi label="Requisiciones en el periodo" value={String(metricas.total)} />
        </Col>
        <Col xs={6} md={3}>
          <Kpi
            label="Tasa de rechazo"
            value={formatPorcentaje(tasa)}
            hint={`${tasaRechazo.rechazadas} rechazadas de ${tasaRechazo.enviadas} enviadas`}
          />
        </Col>
        <Col xs={6} md={3}>
          <Kpi label="Sin estimar" value={String(sinEstimar.requisiciones)} hint="Requisiciones sin monto estimado" />
        </Col>
        <Col xs={6} md={3}>
          <Kpi
            label="Devoluciones de entregables"
            value={String(devolucionesEntregables.total)}
            hint={`En ${devolucionesEntregables.requisiciones} requisiciones`}
          />
        </Col>
        {metricas.valorComprado.map((v) => (
          <Col key={v.moneda} xs={6} md={3}>
            <Kpi label={`Valor comprado (${v.moneda})`} value={formatMoney(v.total, v.moneda)} hint={`${v.ordenes} órdenes de compra`} />
          </Col>
        ))}
      </Row>

      {sinDatos ? (
        <Alert variant="light" data-testid="metricas-vacio">
          No hay requisiciones en el periodo y con los filtros elegidos.
        </Alert>
      ) : (
        <Row className="g-3 mb-4">
          <Col lg={6}>
            <ChartCard
              testId="chart-estados"
              title="Requisiciones por estado"
              description="Cantidad de requisiciones en cada estado."
              horizontal
              categoryHeader="Estado"
              labels={estados.map((e) => REQUISICION_ESTADO_LABELS[e.estado] ?? e.estado)}
              series={[{ label: 'Requisiciones', values: estados.map((e) => e.count) }]}
            />
          </Col>
          <Col lg={6}>
            {ciclosConDatos.length === 0 ? (
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="fs-6 text-muted">Tiempos de ciclo</Card.Title>
                  <div className="text-muted text-center py-4">Aún no hay etapas completadas en el periodo.</div>
                </Card.Body>
              </Card>
            ) : (
              <ChartCard
                testId="chart-ciclos"
                title="Tiempos de ciclo (mediana y P90)"
                description="Horas de cada etapa del proceso: la mediana y el percentil 90."
                horizontal
                axisLabel="Horas"
                categoryHeader="Etapa"
                labels={ciclosConDatos.map((key) => `${METRICA_CICLO_LABELS[key]} (n=${metricas.ciclos[key].n})`)}
                series={[
                  { label: 'Mediana', values: ciclosConDatos.map((key) => metricas.ciclos[key].medianaHoras) },
                  { label: 'P90', values: ciclosConDatos.map((key) => metricas.ciclos[key].p90Horas) },
                ]}
                formatValue={formatHoras}
              />
            )}
          </Col>
          {metricas.estimadoVsReal.map((fila) => (
            <Col key={fila.moneda} lg={6}>
              <ChartCard
                testId={`chart-estimado-${fila.moneda}`}
                title={`Estimado vs. real (${fila.moneda})`}
                description={`Monto estimado contra monto real de ${fila.requisiciones} requisiciones; exceso total ${formatMoney(fila.exceso, fila.moneda)}.`}
                categoryHeader="Moneda"
                labels={[fila.moneda]}
                series={[
                  { label: 'Estimado', values: [fila.estimado] },
                  { label: 'Real', values: [fila.real] },
                  { label: 'Exceso', values: [fila.exceso] },
                ]}
                formatValue={(value) => formatMoney(value, fila.moneda)}
              />
            </Col>
          ))}
        </Row>
      )}

      <Row className="g-3">
        <Col lg={6}>
          <Card className="tt-card h-100">
            <Card.Body>
              <Card.Title className="fs-6 text-muted">Principales proveedores (top 10 por moneda)</Card.Title>
              {metricas.topProveedores.length === 0 ? (
                <p className="text-muted mb-0">Sin compras en el periodo.</p>
              ) : (
                groupByMoneda(metricas.topProveedores).map(([moneda, rows]) => (
                  <div key={moneda} className="table-responsive mb-2">
                    <Table size="sm" aria-label={`Principales proveedores en ${moneda}`}>
                      <thead>
                        <tr>
                          <th scope="col">Proveedor ({moneda})</th>
                          <th scope="col" className="text-end">Valor</th>
                          <th scope="col" className="text-end">Órdenes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={`${row.proveedorId}-${moneda}`}>
                            <td>{row.nombre}</td>
                            <td className="text-end text-nowrap">{formatMoney(row.valor, moneda)}</td>
                            <td className="text-end">{row.ordenes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="tt-card h-100">
            <Card.Body>
              <Card.Title className="fs-6 text-muted">Principales áreas (top 10 por moneda)</Card.Title>
              {metricas.topAreas.length === 0 ? (
                <p className="text-muted mb-0">Sin compras en el periodo.</p>
              ) : (
                groupByMoneda(metricas.topAreas).map(([moneda, rows]) => (
                  <div key={moneda} className="table-responsive mb-2">
                    <Table size="sm" aria-label={`Principales áreas en ${moneda}`}>
                      <thead>
                        <tr>
                          <th scope="col">Área ({moneda})</th>
                          <th scope="col" className="text-end">Valor</th>
                          <th scope="col" className="text-end">Requisiciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={`${row.areaId}-${moneda}`}>
                            <td>{row.nombre}</td>
                            <td className="text-end text-nowrap">{formatMoney(row.valor, moneda)}</td>
                            <td className="text-end">{row.requisiciones}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

/** Metrics tab (requisiciones:reports): filters, KPI tiles, charts and their equivalent tables. */
const MetricasTab: React.FC = () => {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [areaId, setAreaId] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [applied, setApplied] = useState<MetricasFiltros>({});

  const { data: areasResponse } = useGetAreas({ limit: 100 });
  const { data: tiposResponse } = useGetTiposRequisicion({ limit: 100 });
  const { data, isLoading, isError, error, isFetching } = useGetMetricas(applied);

  const rangoInvalido = !!desde && !!hasta && desde > hasta;
  const areas = areasResponse?.data ?? [];
  const tipos = tiposResponse?.data ?? [];

  const aplicar = (event: React.FormEvent) => {
    event.preventDefault();
    if (rangoInvalido) return;
    setApplied({
      desde: desde || undefined,
      hasta: hasta || undefined,
      areaId: areaId || undefined,
      tipoId: tipoId || undefined,
    });
  };

  return (
    <>
      <Form onSubmit={aplicar} className="mb-3" aria-label="Filtros de métricas">
        <Row className="g-2 align-items-center">
          <Col md={3}>
            <InputGroup>
              <InputGroup.Text>Desde</InputGroup.Text>
              <Form.Control type="date" aria-label="Métricas desde" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </InputGroup>
          </Col>
          <Col md={3}>
            <InputGroup>
              <InputGroup.Text>Hasta</InputGroup.Text>
              <Form.Control
                type="date"
                aria-label="Métricas hasta"
                value={hasta}
                min={desde || undefined}
                isInvalid={rangoInvalido}
                onChange={(e) => setHasta(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={2}>
            <Form.Select aria-label="Métricas por área" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.nombre}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select aria-label="Métricas por tipo" value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
              <option value="">Todos los tipos</option>
              {tipos.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.nombre}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2} className="d-flex align-items-center gap-1">
            <Button type="submit" variant="primary" disabled={rangoInvalido || isFetching}>
              Aplicar
            </Button>
            <ReqHelp id="reportes.metricas" className="ms-0" />
          </Col>
        </Row>
        {rangoInvalido && (
          <div className="text-danger small mt-1" role="alert">
            La fecha "Desde" no puede ser posterior a "Hasta".
          </div>
        )}
      </Form>

      {data?.data?.rango && (
        <p className="text-muted small" data-testid="metricas-rango">
          Periodo: {data.data.rango.desde.slice(0, 10)} a {data.data.rango.hasta.slice(0, 10)}
        </p>
      )}

      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" aria-label="Cargando métricas" />
        </div>
      )}
      {isError && <Alert variant="danger">{getRequisicionErrorMessage(error, 'No fue posible cargar las métricas.')}</Alert>}
      {data?.data && <MetricasResultado metricas={data.data} />}
    </>
  );
};

export default MetricasTab;
