import React from 'react';
import { Badge, Button, Form, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaClipboardCheck,
  FaEye,
  FaUser,
  FaUserPlus,
  FaTools,
  FaBan,
} from 'react-icons/fa';
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
import { Ticket } from '@/types/ticket.types';

interface TicketListItemProps {
  ticket: Ticket;
  selectable?: boolean;
  selected?: boolean;
  selectable_disabled?: boolean;
  onToggleSelect?: (ticketId: string) => void;
  onAssign?: (ticket: Ticket) => void;
  onCancel?: (ticket: Ticket) => void;
}

const formatElapsed = (createdAt: string): string => {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return '';
  const diffMs = Date.now() - created;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
};

const renderName = (
  value:
    | string
    | { _id?: string; nombre?: string; Razonsocial?: string; nombreSede?: string; fullName?: string; firstName?: string; lastName?: string }
    | null
    | undefined
): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return (
    value.Razonsocial ||
    value.nombre ||
    value.nombreSede ||
    value.fullName ||
    [value.firstName, value.lastName].filter(Boolean).join(' ') ||
    ''
  );
};

const TicketListItem: React.FC<TicketListItemProps> = ({
  ticket,
  selectable = false,
  selected = false,
  selectable_disabled = false,
  onToggleSelect,
  onAssign,
  onCancel,
}) => {
  const navigate = useNavigate();

  const clienteName = renderName(ticket.ClienteId);
  const servicioName = renderName(ticket.servicioId);
  const sedeName = renderName(ticket.sedeId);
  const assigneeName = renderName(ticket.assignedTo);

  const itemNombre =
    ticket.equipoSnapshot?.itemNombre ||
    ticket.equipoSnapshot?.marca ||
    'Equipo';
  const inventario = ticket.equipoSnapshot?.inventario || '';

  return (
    <ListGroup.Item className="px-3 py-3">
      <div className="d-flex align-items-start gap-3">
        {selectable && (
          <Form.Check
            type="checkbox"
            checked={selected}
            disabled={selectable_disabled}
            aria-label={`Seleccionar ticket ${ticket.consecutivo}`}
            onChange={() => onToggleSelect?.(ticket._id)}
          />
        )}

        <div className="flex-grow-1">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <span className="fw-bold text-primary">{ticket.consecutivo}</span>
            <Badge bg={TICKET_STATUS_VARIANTS[ticket.status]}>
              {TICKET_STATUS_LABELS[ticket.status]}
            </Badge>
            <Badge bg={TICKET_URGENCY_VARIANTS[ticket.urgency]}>
              {TICKET_URGENCY_LABELS[ticket.urgency]}
            </Badge>
            <Badge bg={TICKET_SOURCE_VARIANTS[ticket.source]}>
              {TICKET_SOURCE_LABELS[ticket.source]}
            </Badge>
            {ticket.batchId && (
              <Badge bg="light" text="dark" title={ticket.batchId}>
                {formatBatchId(ticket.batchId)}
              </Badge>
            )}
            {typeof ticket.internalNotesCount === 'number' &&
              ticket.internalNotesCount > 0 && (
                <Badge bg="dark" pill>
                  {ticket.internalNotesCount} notas
                </Badge>
              )}
          </div>

          <div className="mb-1">
            <strong>{itemNombre}</strong>
            {inventario && <span className="text-muted ms-2">· {inventario}</span>}
          </div>

          <div className="small text-muted">
            {clienteName && <span>{clienteName}</span>}
            {sedeName && <span> · {sedeName}</span>}
            {servicioName && <span> · {servicioName}</span>}
          </div>

          <div className="d-flex flex-wrap align-items-center gap-3 small text-muted mt-2">
            <span>
              <FaUser className="me-1" aria-hidden />
              {ticket.requestedBy?.name || 'Solicitante'}
              {ticket.requestedBy?.position
                ? ` · ${ticket.requestedBy.position}`
                : ''}
            </span>
            <span>
              <FaCalendarAlt className="me-1" aria-hidden />
              {formatElapsed(ticket.createdAt)}
            </span>
            {assigneeName && (
              <span>
                <FaTools className="me-1" aria-hidden />
                {assigneeName}
              </span>
            )}
            {ticket.closingReason && (
              <span>
                <FaClipboardCheck className="me-1" aria-hidden />
                {CLOSING_REASON_LABELS[ticket.closingReason]}
              </span>
            )}
          </div>
        </div>

        <div className="d-flex flex-column gap-2">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => navigate(`/tickets/${ticket._id}`)}
            aria-label={`Ver detalle ${ticket.consecutivo}`}
          >
            <FaEye className="me-1" />
            Ver
          </Button>
          {ticket.status === 'pendiente' && onAssign && (
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => onAssign(ticket)}
              aria-label={`Asignar ${ticket.consecutivo}`}
            >
              <FaUserPlus className="me-1" />
              Asignar
            </Button>
          )}
          {ticket.status === 'pendiente' &&
            !ticket.workOrderId &&
            onCancel && (
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => onCancel(ticket)}
                aria-label={`Cancelar ${ticket.consecutivo}`}
              >
                <FaBan className="me-1" />
                Cancelar
              </Button>
            )}
        </div>
      </div>
    </ListGroup.Item>
  );
};

export default TicketListItem;
