import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FaBoxOpen, FaFilter, FaCheckSquare, FaEye, FaExclamationTriangle, FaClock, FaCalendarCheck } from 'react-icons/fa';
import { MESES } from '@/types/cronograma.types';
import { CronogramaStats } from '@/types/cronograma.types';

interface CronogramaStatsCardProps {
  stats: CronogramaStats;
}

/**
 * Componente para mostrar estadísticas del cronograma
 */
export const CronogramaStatsCard: React.FC<CronogramaStatsCardProps> = ({ stats }) => {
  const tarjetasBase = (
    <Row className="g-3 mb-3">
      <Col md={3}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Body className="d-flex align-items-center">
            <div className="stats-icon bg-primary bg-opacity-10 rounded p-3 me-3">
              <FaBoxOpen className="text-primary" size={24} />
            </div>
            <div>
              <div className="text-muted small">Total Equipos</div>
              <h4 className="mb-0">{stats.totalEquipos}</h4>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col md={3}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Body className="d-flex align-items-center">
            <div className="stats-icon bg-info bg-opacity-10 rounded p-3 me-3">
              <FaFilter className="text-info" size={24} />
            </div>
            <div>
              <div className="text-muted small">Equipos Filtrados</div>
              <h4 className="mb-0">{stats.equiposVisibles}</h4>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col md={3}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Body className="d-flex align-items-center">
            <div className="stats-icon bg-success bg-opacity-10 rounded p-3 me-3">
              <FaCheckSquare className="text-success" size={24} />
            </div>
            <div>
              <div className="text-muted small">Equipos Seleccionados</div>
              <h4 className="mb-0">{stats.equiposSeleccionados}</h4>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col md={3}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Body className="d-flex align-items-center">
            <div className="stats-icon bg-warning bg-opacity-10 rounded p-3 me-3">
              <FaEye className="text-warning" size={24} />
            </div>
            <div>
              <div className="text-muted small">Visibles Selecc.</div>
              <h4 className="mb-0">{stats.equiposVisiblesSeleccionados}</h4>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const hayExternas = stats.equiposPorMesExterno !== undefined;
  if (!hayExternas) return tarjetasBase;

  const totalExternos = MESES.reduce((acc, mes) => acc + (stats.equiposPorMesExterno?.[mes] ?? 0), 0);
  const totalPreventivos = MESES.reduce((acc, mes) => acc + (stats.equiposPorMes?.[mes] ?? 0), 0);

  return (
    <>
      {tarjetasBase}
      <Row className="g-3 mb-3" data-testid="stats-externas">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon bg-success bg-opacity-10 rounded p-3 me-3">
                <FaCalendarCheck className="text-success" size={24} />
              </div>
              <div>
                <div className="text-muted small">Programaciones preventivas</div>
                <h4 className="mb-0">{totalPreventivos}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon bg-info bg-opacity-10 rounded p-3 me-3">
                <FaCalendarCheck className="text-info" size={24} />
              </div>
              <div>
                <div className="text-muted small">Programaciones externas</div>
                <h4 className="mb-0">{totalExternos}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon bg-danger bg-opacity-10 rounded p-3 me-3">
                <FaExclamationTriangle className="text-danger" size={24} />
              </div>
              <div>
                <div className="text-muted small">Externas vencidas</div>
                <h4 className="mb-0" data-testid="externas-vencidas">{stats.externasVencidas ?? 0}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon bg-warning bg-opacity-10 rounded p-3 me-3">
                <FaClock className="text-warning" size={24} />
              </div>
              <div>
                <div className="text-muted small">Externas por vencer (30 días)</div>
                <h4 className="mb-0" data-testid="externas-por-vencer">{stats.externasPorVencer ?? 0}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};
