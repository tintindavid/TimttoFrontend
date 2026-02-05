import React from 'react';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { OT } from '@/types/ot.types';
import { FaCalendar, FaUser, FaCog, FaExclamationTriangle } from 'react-icons/fa';

interface OtHeaderProps {
  ot: OT;
  equiposProcesados: number;
  totalEquipos: number;
}

const OtHeader: React.FC<OtHeaderProps> = ({ ot, equiposProcesados, totalEquipos }) => {
  const progreso = totalEquipos > 0 ? Math.round((equiposProcesados / totalEquipos) * 100) : 0;
  
 console.log('Rendering OtHeader with OT:', ot);
  const getUrgenciaColor = (urgencia?: string) => {
    switch (urgencia) {
      case 'Crítica': return 'danger';
      case 'Alta': return 'warning';
      case 'Normal': return 'success';
      default: return 'secondary';
    }
  };

  const getEstadoColor = (estado?: string) => {
    switch (estado) {
      case 'Completada': return 'success';
      case 'En_Progreso': return 'warning';
      case 'Pendiente': return 'info';
      case 'Cancelada': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Card className="mb-4 border-primary">
      <Card.Header className="bg-primary text-white">
        <h4 className="mb-0">
          🔧 Orden de Trabajo #{ot.Consecutivo || 'N/A'}
        </h4>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <h6 className="text-muted mb-1">
                <FaUser className="me-2" />
                Cliente
              </h6>
              <h5>{ot.ClienteId?.Razonsocial || 'No especificado'}</h5>
              <small className="text-muted">
                {ot.ClienteId?.Ciudad} • {ot.ClienteId?.Email}
              </small>
            </div>

            <Row>
              <Col md={6}>
                <div className="mb-2">
                  <small className="text-muted d-block">
                    <FaCog className="me-1" />
                    Tipo de Mantenimiento
                  </small>
                  <Badge bg="primary" className="fs-6">
                    {ot.TipoServicio || 'No especificado'}
                  </Badge>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-2">
                  <small className="text-muted d-block">
                    <FaExclamationTriangle className="me-1" />
                    Urgencia
                  </small>
                  <Badge bg={getUrgenciaColor(ot.OtPrioridad)} className="fs-6">
                    {ot.OtPrioridad || 'Normal'}
                  </Badge>
                </div>
              </Col>
            </Row>

            <div className="mb-2">
              <small className="text-muted d-block">
                <FaCalendar className="me-1" />
                Fecha de Creación
              </small>
              <span>
                {ot.FechaCreacion 
                  ? new Date(ot.FechaCreacion).toLocaleDateString('es-ES')
                  : 'No especificada'
                }
              </span>
            </div>
          </Col>

          <Col md={6}>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-muted mb-0">Estado de la OT</h6>
                <Badge bg={getEstadoColor(ot.EstadoOt)} className="fs-6">
                  {ot.EstadoOt || 'Pendiente'}
                </Badge>
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-muted mb-0">Progreso de Equipos</h6>
                <small className="text-muted">
                  {equiposProcesados}/{totalEquipos} equipos
                </small>
              </div>
              <ProgressBar 
                now={progreso} 
                label={`${progreso}%`}
                variant={progreso === 100 ? 'success' : progreso > 50 ? 'warning' : 'info'}
                style={{ height: '25px' }}
              />
              <small className="text-muted">
                {totalEquipos - equiposProcesados} equipos pendientes
              </small>
            </div>

            {ot.ResponsableId && (
              <div className="mb-2">
                <small className="text-muted d-block">Responsable</small>
                <span>{ot.ResponsableId}</span>
              </div>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default OtHeader;