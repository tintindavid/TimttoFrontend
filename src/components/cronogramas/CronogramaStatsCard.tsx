import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FaBoxOpen, FaFilter, FaCheckSquare, FaEye } from 'react-icons/fa';
import { CronogramaStats } from '@/types/cronograma.types';

interface CronogramaStatsCardProps {
  stats: CronogramaStats;
}

/**
 * Componente para mostrar estadísticas del cronograma
 */
export const CronogramaStatsCard: React.FC<CronogramaStatsCardProps> = ({ stats }) => {
  return (
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
};
