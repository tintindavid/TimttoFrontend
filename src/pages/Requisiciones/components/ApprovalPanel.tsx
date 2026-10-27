import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, ListGroup, ProgressBar, Spinner } from 'react-bootstrap';
import { PERMISSIONS } from '@/constants/permissions';
import { useHasPermission } from '@/hooks/usePermission';
import { useGetPresupuestoResumen } from '@/hooks/usePresupuestosArea';
import ReasignarModal from './ReasignarModal';
import ReqHelp from '../help/ReqHelp';
import type { PresupuestoResumen, Requisicion } from '@/types/requisicion.types';
import {
  NIVEL_ESTADO_VARIANT,
  budgetPeriods,
  formatDateTime,
  formatMoney,
  getNivelActual,
  isPreviousRound,
  refId,
  userRefName,
} from '@/utils/requisicion.utils';

const APROBADOR_TIPO_LABELS: Record<string, string> = {
  jefe_area: 'Jefe de área',
  rol: 'Rol',
  usuarios: 'Usuarios definidos',
};

interface BudgetProps {
  areaId: string;
}

/** Informative budget summary of the requisicion's area: the current month when configured, else the year. */
export const AreaBudgetSummary: React.FC<BudgetProps> = ({ areaId }) => {
  const { mes, anio } = budgetPeriods();
  const month = useGetPresupuestoResumen({ areaId, periodo: mes }, !!areaId);
  const year = useGetPresupuestoResumen({ areaId, periodo: anio }, !!areaId);

  if (month.isLoading || year.isLoading) {
    return <Spinner size="sm" animation="border" aria-label="Cargando presupuesto" />;
  }

  if (month.isError && year.isError) {
    return <p className="text-muted mb-0">No fue posible cargar el presupuesto del área.</p>;
  }

  const monthData = month.data?.data;
  const yearData = year.data?.data;
  const resumen: PresupuestoResumen | undefined = monthData?.configurado ? monthData : yearData?.configurado ? yearData : undefined;

  if (!resumen) {
    return <p className="text-muted mb-0">El área no tiene presupuesto configurado para el período actual.</p>;
  }

  const porcentaje = resumen.porcentaje ?? 0;
  const barVariant = resumen.sobrepasado ? 'danger' : resumen.alerta ? 'warning' : 'success';

  return (
    <div data-testid="budget-summary">
      <div className="small text-muted mb-1">Período {resumen.periodo}</div>
      <ProgressBar
        now={Math.min(porcentaje, 100)}
        variant={barVariant}
        label={`${porcentaje}%`}
        aria-label="Uso del presupuesto del área"
        className="mb-2"
      />
      <dl className="row mb-2 small">
        <dt className="col-6">Presupuesto</dt>
        <dd className="col-6 text-end">{formatMoney(resumen.monto, resumen.moneda)}</dd>
        <dt className="col-6">Consumido</dt>
        <dd className="col-6 text-end">{formatMoney(resumen.consumido, resumen.moneda)}</dd>
        <dt className="col-6">Comprometido</dt>
        <dd className="col-6 text-end">{formatMoney(resumen.comprometido, resumen.moneda)}</dd>
        <dt className="col-6">Disponible</dt>
        <dd className="col-6 text-end">{formatMoney(resumen.disponible, resumen.moneda)}</dd>
      </dl>
      {resumen.sobrepasado && (
        <Alert variant="danger" className="py-2 mb-0">
          El área superó su presupuesto. Puedes aprobar de todas formas: el presupuesto es informativo.
        </Alert>
      )}
      {!resumen.sobrepasado && resumen.alerta && (
        <Alert variant="warning" className="py-2 mb-0">
          El área alcanzó el umbral de alerta del presupuesto ({resumen.umbralAlerta ?? '—'}%).
        </Alert>
      )}
    </div>
  );
};

interface Props {
  requisicion: Requisicion;
}

/** Approval levels (frozen at submission) with their state, plus the area budget the approver should consider. */
const ApprovalPanel: React.FC<Props> = ({ requisicion }) => {
  const rawNiveles = requisicion.aprobacion?.niveles;
  const niveles = useMemo(() => [...(rawNiveles ?? [])].sort((a, b) => a.orden - b.orden), [rawNiveles]);
  const actual = getNivelActual(requisicion);
  const canManageAll = useHasPermission(PERMISSIONS.REQUISICIONES_MANAGE_ALL);
  const [showReasignar, setShowReasignar] = useState(false);
  // A reopened / retired Borrador keeps its old levels: they are history of the previous round, not active.
  const previousRound = isPreviousRound(requisicion);
  const pendientes = useMemo(() => niveles.filter((n) => n.estado === 'Pendiente'), [niveles]);
  const canReasignar = canManageAll && requisicion.estado === 'En_Aprobacion' && pendientes.length > 0;
  const showBudget = ['Enviada', 'En_Aprobacion', 'Aprobada', 'Rechazada'].includes(requisicion.estado);

  return (
    <Card className="tt-card mb-3">
      <Card.Header as="h6" className="mb-0">
        Aprobación
        <ReqHelp id="detalle.aprobacion" />
      </Card.Header>
      <Card.Body>
        {niveles.length === 0 ? (
          <p className="text-muted mb-0">
            {requisicion.estado === 'Borrador'
              ? 'Los niveles de aprobación se definen al enviar la requisición.'
              : 'Esta requisición no tiene niveles de aprobación.'}
          </p>
        ) : (
          <>
          <div className="text-muted small text-uppercase mb-1">
            Niveles
            <ReqHelp id="detalle.niveles" />
          </div>
          {previousRound && (
            <Alert variant="secondary" className="py-2" data-testid="previous-round">
              Ronda anterior (historial): estos niveles ya no están activos. Se definirán de nuevo al enviar la requisición.
            </Alert>
          )}
          <ListGroup
            variant="flush"
            className={`mb-3${previousRound ? ' opacity-50' : ''}`}
            aria-label={previousRound ? 'Niveles de la ronda anterior' : 'Niveles de aprobación'}
          >
            {niveles.map((nivel) => {
              const isCurrent = !previousRound && requisicion.estado === 'En_Aprobacion' && actual?.orden === nivel.orden && nivel.estado === 'Pendiente';
              const names = (nivel.aprobadorIds ?? []).map((a) => userRefName(a));
              return (
                <ListGroup.Item key={nivel.orden} className="px-0" data-testid="nivel-row">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>
                        Nivel {nivel.orden}
                        {nivel.nombre ? ` · ${nivel.nombre}` : ''}
                      </strong>
                      {isCurrent && (
                        <Badge bg="primary" className="ms-2">
                          Nivel actual
                        </Badge>
                      )}
                      <div className="small text-muted">
                        {APROBADOR_TIPO_LABELS[nivel.aprobadorTipo] ?? nivel.aprobadorTipo}
                        {names.length > 0 ? `: ${names.join(', ')}` : ''}
                      </div>
                      {nivel.estado !== 'Pendiente' && nivel.decididoPor && (
                        <div className="small text-muted">
                          {userRefName(nivel.decididoPor)} · {formatDateTime(nivel.fecha)}
                        </div>
                      )}
                      {nivel.observacion && <div className="small fst-italic">“{nivel.observacion}”</div>}
                    </div>
                    <Badge bg={NIVEL_ESTADO_VARIANT[nivel.estado] ?? 'secondary'}>{nivel.estado}</Badge>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
          </>
        )}

        {canReasignar && (
          <div className="d-flex align-items-center gap-1 mb-3">
            <Button variant="outline-primary" size="sm" onClick={() => setShowReasignar(true)}>
              Reasignar aprobadores
            </Button>
            <ReqHelp id="accion.reasignar" className="ms-0" placement="bottom" />
          </div>
        )}

        {showBudget && (
          <>
            <h6 className="text-muted text-uppercase small">
              Presupuesto del área
              <ReqHelp id="detalle.presupuesto" />
            </h6>
            <AreaBudgetSummary areaId={refId(requisicion.areaId)} />
          </>
        )}
      </Card.Body>
      {canReasignar && (
        <ReasignarModal
          show={showReasignar}
          requisicion={requisicion}
          niveles={pendientes}
          onHide={() => setShowReasignar(false)}
        />
      )}
    </Card>
  );
};

export default ApprovalPanel;
