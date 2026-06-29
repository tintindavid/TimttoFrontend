import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  ListGroup,
  Row,
  Spinner,
} from 'react-bootstrap';
import {
  FaArrowLeft,
  FaBan,
  FaClipboardList,
  FaFileAlt,
  FaPlus,
  FaUserPlus,
} from 'react-icons/fa';
import { useTicketDetail } from '@/hooks/useTickets';
import {
  CLOSING_REASON_LABELS,
  TICKET_SOURCE_LABELS,
  TICKET_SOURCE_VARIANTS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_VARIANTS,
  TICKET_URGENCY_LABELS,
  TICKET_URGENCY_VARIANTS,
  formatBatchId,
} from '@/constants/ticket.constants';
import AssignTicketModal from './components/AssignTicketModal';
import CancelTicketModal from './components/CancelTicketModal';
import AddNoteModal from './components/AddNoteModal';
import { TicketUserRef } from '@/types/ticket.types';

const renderName = (
  value: string | { _id?: string; nombre?: string; Razonsocial?: string; nombreSede?: string; fullName?: string; firstName?: string; lastName?: string; email?: string } | null | undefined,
): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return (
    value.Razonsocial ||
    value.nombre ||
    value.nombreSede ||
    value.fullName ||
    [value.firstName, value.lastName].filter(Boolean).join(' ') ||
    value.email ||
    ''
  );
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const formatMinutes = (m?: number | null): string => {
  if (m === null || m === undefined) return '—';
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return `${hours} h ${mins} min`;
};

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detailQuery = useTicketDetail(id);

  const [showAssign, setShowAssign] = useState<boolean>(false);
  const [showCancel, setShowCancel] = useState<boolean>(false);
  const [showAddNote, setShowAddNote] = useState<boolean>(false);

  if (detailQuery.isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data?.data) {
    return (
      <div className="container-fluid py-3">
        <Alert variant="danger">
          No fue posible cargar el ticket: {detailQuery.error?.message ?? 'No encontrado'}
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/tickets')}>
          <FaArrowLeft className="me-2" />
          Volver
        </Button>
      </div>
    );
  }

  const ticket = detailQuery.data.data;

  console.log('Ticket detail:', ticket);
  const isPendiente = ticket.status === 'pendiente';
  const canCancel = isPendiente && !ticket.workOrderId;
  const assignee = ticket.assignedTo as TicketUserRef | string | null | undefined;

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <Button variant="link" className="p-0" onClick={() => navigate('/tickets')}>
          <FaArrowLeft className="me-2" />
          Volver al listado
        </Button>

        <div className="d-flex gap-2">
          {isPendiente && (
            <Button variant="outline-secondary" size="sm" onClick={() => setShowAssign(true)}>
              <FaUserPlus className="me-1" />
              Asignar
            </Button>
          )}
          <Button variant="outline-primary" size="sm" onClick={() => setShowAddNote(true)}>
            <FaPlus className="me-1" />
            Agregar nota
          </Button>
          {canCancel && (
            <Button variant="outline-danger" size="sm" onClick={() => setShowCancel(true)}>
              <FaBan className="me-1" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <h4 className="m-0 me-2">{ticket.consecutivo}</h4>
            <Badge bg={TICKET_STATUS_VARIANTS[ticket.status]}>{TICKET_STATUS_LABELS[ticket.status]}</Badge>
            <Badge bg={TICKET_URGENCY_VARIANTS[ticket.urgency]}>{TICKET_URGENCY_LABELS[ticket.urgency]}</Badge>
            <Badge bg={TICKET_SOURCE_VARIANTS[ticket.source]}>{TICKET_SOURCE_LABELS[ticket.source]}</Badge>
            {ticket.batchId && (
              <Link to={`/tickets/batch/${ticket.batchId}`} className="text-decoration-none">
                <Badge bg="light" text="dark" title={ticket.batchId}>
                  {formatBatchId(ticket.batchId)}
                </Badge>
              </Link>
            )}
          </div>

          <Row className="small text-muted">
            <Col md={4}>
              <div>
                <strong>Creado:</strong> {formatDate(ticket.createdAt)}
              </div>
            </Col>
            <Col md={4}>
              <div>
                <strong>Primera respuesta:</strong> {formatMinutes(ticket.responseTimeMinutes)}
              </div>
            </Col>
            <Col md={4}>
              <div>
                <strong>Resolución:</strong> {formatMinutes(ticket.resolutionTimeMinutes)}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header>Solicitante</Card.Header>
            <Card.Body>
              <div><strong>{ticket.requestedBy?.name || '—'}</strong></div>
              <div className="text-muted small">{ticket.requestedBy?.position || ''}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-3">
            <Card.Header>Contexto</Card.Header>
            <Card.Body className="small">
              <div><strong>Cliente:</strong> {renderName(ticket.ClienteId) || '—'}</div>
              <div><strong>Sede:</strong> {renderName(ticket.sedeId) || '—'}</div>
              <div><strong>Servicio:</strong> {renderName(ticket.servicioId) || '—'}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-3">
        <Card.Header>Equipo</Card.Header>
        <Card.Body>
          {ticket.equipoSnapshot ? (
            <div className="small">
              <div><strong>{ticket.equipoSnapshot.itemNombre || ticket.equipoSnapshot.marca || 'Equipo'}</strong></div>
              {ticket.equipoSnapshot.marca && <div>Marca: {ticket.equipoSnapshot.marca}</div>}
              {ticket.equipoSnapshot.modelo && <div>Modelo: {ticket.equipoSnapshot.modelo}</div>}
              {ticket.equipoSnapshot.serie && <div>Serie: {ticket.equipoSnapshot.serie}</div>}
              {ticket.equipoSnapshot.inventario && <div>Inventario: {ticket.equipoSnapshot.inventario}</div>}
              {ticket.equipoSnapshot.ubicacion && <div>Ubicación: {ticket.equipoSnapshot.ubicacion}</div>}
              <Link to={`/equipo-items/${ticket.equipoId}`} className="small mt-2 d-inline-block">
                Ver detalle del equipo
              </Link>
            </div>
          ) : (
            <Link to={`/equipo-items/${ticket.equipoId}`}>Ver equipo</Link>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Observaciones</Card.Header>
        <Card.Body>
          <div className="mb-2">
            <strong>Observación específica del equipo</strong>
            <p className="mb-0">{ticket.observation || <span className="text-muted">Sin observación.</span>}</p>
          </div>
          <hr />
          <div>
            <strong>Observación general del batch</strong>
            <p className="mb-0">{ticket.generalObservation || <span className="text-muted">Sin observación general.</span>}</p>
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Asociaciones</Card.Header>
        <Card.Body className="small">
          <Row>
            <Col md={6}>
              <strong>OT:</strong>{' '}
              {ticket.workOrderId ? (
                <Link to={`/maintenance-orders/${ticket.workOrderId}`}>
                  <FaClipboardList className="me-1" />
                  Ver OT
                </Link>
              ) : (
                <span className="text-muted">Sin OT.</span>
              )}
            </Col>
            <Col md={6}>
              <strong>Report:</strong>{' '}
              {ticket.reportId ? (
                <Link to={`/reports/${ticket.reportId._id}/view`}>
                  <FaFileAlt className="me-1" />
                  Ver Report
                </Link>
              ) : (
                <span className="text-muted">Sin report.</span>
              )}
            </Col>
          </Row>
          <Row className="mt-2">
            <Col md={6}>
              <strong>Asignado a:</strong> {renderName(assignee) || <span className="text-muted">Sin asignar.</span>}
            </Col>
            <Col md={6}>
              <strong>Asignado en:</strong> {formatDate(ticket.assignedAt)}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Notas internas ({ticket.internalNotes?.length ?? 0})</Card.Header>
        {ticket.internalNotes && ticket.internalNotes.length > 0 ? (
          <ListGroup variant="flush">
            {[...ticket.internalNotes].reverse().map((n, idx) => (
              <ListGroup.Item key={idx}>
                <div className="small text-muted">
                  {formatDate(n.addedAt)} — {typeof n.addedBy === 'string' ? n.addedBy : ''}
                </div>
                <div>{n.note}</div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <Card.Body className="text-muted small">Sin notas todavía.</Card.Body>
        )}
      </Card>

      {ticket.closingReason && (
        <Card className="mb-3 border-success">
          <Card.Header className="bg-success text-white">
            Cierre — {CLOSING_REASON_LABELS[ticket.closingReason]}
          </Card.Header>
          <Card.Body className="small">
            <div><strong>Fecha:</strong> {formatDate(ticket.closedAt)}</div>
            <div><strong>Por:</strong> {renderName(ticket.closedBy) || '—'}</div>
            <div className="mt-2">
              <strong>Observación de cierre:</strong>
              <p className="mb-0">{ticket.closingObservation || <span className="text-muted">—</span>}</p>
            </div>
          </Card.Body>
        </Card>
      )}

      <AssignTicketModal show={showAssign} onHide={() => setShowAssign(false)} ticket={ticket} />
      <CancelTicketModal show={showCancel} onHide={() => setShowCancel(false)} ticket={ticket} />
      <AddNoteModal show={showAddNote} onHide={() => setShowAddNote(false)} ticket={ticket} />
    </div>
  );
};

export default TicketDetailPage;
