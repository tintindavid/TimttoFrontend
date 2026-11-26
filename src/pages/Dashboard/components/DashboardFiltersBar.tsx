import React from 'react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useCustomers } from '@/hooks/useCustomers';
import { useSedes } from '@/hooks/useSedes';
import { useServicios } from '@/hooks/useServicios';
import { useUsers } from '@/hooks/useUsers';
import { TIPOS_MTTO } from '@/types/dashboard.types';
import type { DashboardFilters, DashboardPeriodo } from '@/types/dashboard.types';

interface Props {
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  onReset: () => void;
  /** Options queries are fired only when the dashboard itself is active (tenant resolved). */
  enabled?: boolean;
  showTecnico?: boolean;
}

const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

const DashboardFiltersBar: React.FC<Props> = ({ filters, onChange, onReset, enabled = true, showTecnico = true }) => {
  const clientes = useCustomers({ limit: 100 }, { enabled });
  const sedes = useSedes({ limit: 100, ...(filters.clienteId ? { Cliente: filters.clienteId } : {}) }, { enabled });
  const servicios = useServicios(
    { limit: 100, ...(filters.clienteId ? { Cliente: filters.clienteId } : {}) },
    { enabled }
  );
  const users = useUsers({ limit: 100 });

  const sedeList = (sedes.data?.data ?? []).filter((s) => !filters.clienteId || s.Cliente === filters.clienteId);
  const servicioList = (servicios.data?.data ?? []).filter((s) => !filters.clienteId || s.Cliente === filters.clienteId);

  return (
    <Card className="tt-card mb-3">
      <Card.Body>
        <Form onSubmit={(e) => e.preventDefault()} aria-label="Filtros del dashboard">
          <Row className="g-2">
            <Col md={3}>
              <Form.Group controlId="dash-periodo">
                <Form.Label className="small mb-1">Período</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.periodo}
                  onChange={(e) => onChange({ periodo: e.target.value as DashboardPeriodo })}
                >
                  <option value="mes_actual">Mes actual</option>
                  <option value="mes_anterior">Mes anterior</option>
                  <option value="rango">Rango de fechas</option>
                  <option value="anio">Año</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {filters.periodo === 'rango' && (
              <>
                <Col md={2}>
                  <Form.Group controlId="dash-desde">
                    <Form.Label className="small mb-1">Desde</Form.Label>
                    <Form.Control
                      size="sm"
                      type="date"
                      value={filters.desde ?? ''}
                      onChange={(e) => onChange({ desde: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group controlId="dash-hasta">
                    <Form.Label className="small mb-1">Hasta</Form.Label>
                    <Form.Control
                      size="sm"
                      type="date"
                      value={filters.hasta ?? ''}
                      onChange={(e) => onChange({ hasta: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </>
            )}
            {filters.periodo === 'anio' && (
              <Col md={2}>
                <Form.Group controlId="dash-anio">
                  <Form.Label className="small mb-1">Año</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.anio ?? String(currentYear)}
                    onChange={(e) => onChange({ anio: e.target.value })}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col md={3}>
              <Form.Group controlId="dash-cliente">
                <Form.Label className="small mb-1">Cliente</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.clienteId ?? ''}
                  onChange={(e) => onChange({ clienteId: e.target.value })}
                >
                  <option value="">Todos</option>
                  {(clientes.data?.data ?? []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.Razonsocial}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="dash-sede">
                <Form.Label className="small mb-1">Sede</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.sedeId ?? ''}
                  onChange={(e) => onChange({ sedeId: e.target.value })}
                >
                  <option value="">Todas</option>
                  {sedeList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.nombreSede}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="dash-servicio">
                <Form.Label className="small mb-1">Servicio</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.servicioId ?? ''}
                  onChange={(e) => onChange({ servicioId: e.target.value })}
                >
                  <option value="">Todos</option>
                  {servicioList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="dash-tipo">
                <Form.Label className="small mb-1">Tipo de mantenimiento</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.tipoMtto ?? ''}
                  onChange={(e) => onChange({ tipoMtto: e.target.value })}
                >
                  <option value="">Todos</option>
                  {TIPOS_MTTO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            {showTecnico && (
              <Col md={3}>
                <Form.Group controlId="dash-tecnico">
                  <Form.Label className="small mb-1">Técnico</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.tecnicoId ?? ''}
                    onChange={(e) => onChange({ tecnicoId: e.target.value })}
                  >
                    <option value="">Todos</option>
                    {(users.data?.data ?? []).map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col md="auto" className="d-flex align-items-end">
              <Button size="sm" variant="outline-secondary" onClick={onReset}>
                Limpiar filtros
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default DashboardFiltersBar;
