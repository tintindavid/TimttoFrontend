import React from 'react';
import { Alert, Badge, Card, ListGroup, Spinner } from 'react-bootstrap';
import { usePublicTicketsList } from '@/hooks/usePublicTicket';
import {
  CLOSING_REASON_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_VARIANTS,
  TICKET_URGENCY_LABELS,
  TICKET_URGENCY_VARIANTS,
} from '@/constants/ticket.constants';
import { PublicTicket } from '@/types/ticket.types';

const formatDate = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const PublicTicketsList: React.FC = () => {
  const listQuery = usePublicTicketsList();

  if (listQuery.isLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
      </div>
    );
  }

  if (listQuery.isError) {
    return <Alert variant="danger">Error al cargar tickets: {listQuery.error?.message}</Alert>;
  }

  const tickets = (listQuery.data?.data ?? []) as PublicTicket[];

  if (tickets.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center text-muted py-4">
          No hay solicitudes en los últimos 30 días.
        </Card.Body>
      </Card>
    );
  }

  return (
    <ListGroup>
      {tickets.map((t) => (
        <ListGroup.Item key={t._id} className="px-3 py-3">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <strong className="text-primary">{t.consecutivo}</strong>
                <Badge bg={TICKET_STATUS_VARIANTS[t.status]}>
                  {TICKET_STATUS_LABELS[t.status]}
                </Badge>
                <Badge bg={TICKET_URGENCY_VARIANTS[t.urgency]}>
                  {TICKET_URGENCY_LABELS[t.urgency]}
                </Badge>
              </div>
              {t.equipoSnapshot && (
                <div className="small">
                  <strong>{t.equipoSnapshot.itemNombre || t.equipoSnapshot.marca || 'Equipo'}</strong>
                  {t.equipoSnapshot.inventario && (
                    <span className="text-muted ms-2">· {t.equipoSnapshot.inventario}</span>
                  )}
                </div>
              )}
              {t.observation && <div className="small text-muted mt-1">{t.observation}</div>}
              {t.closingReason && (
                <div className="small text-muted mt-1">
                  Cierre: {CLOSING_REASON_LABELS[t.closingReason]}
                  {t.closingObservation ? ` — ${t.closingObservation}` : ''}
                </div>
              )}
            </div>
            <div className="text-end small text-muted">
              <div>Creado</div>
              <div>{formatDate(t.createdAt)}</div>
            </div>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default PublicTicketsList;
