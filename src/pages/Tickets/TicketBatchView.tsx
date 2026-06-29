import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, ListGroup, Spinner } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import { useTicketsByBatch } from '@/hooks/useTickets';
import { formatBatchId } from '@/constants/ticket.constants';
import TicketListItem from './components/TicketListItem';

const TicketBatchView: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const batchQuery = useTicketsByBatch(batchId);

  if (batchQuery.isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (batchQuery.isError || !batchQuery.data?.data) {
    return (
      <div className="container-fluid py-3">
        <Alert variant="danger">
          No fue posible cargar el batch: {batchQuery.error?.message ?? 'No encontrado'}
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/tickets')}>
          <FaArrowLeft className="me-2" />
          Volver
        </Button>
      </div>
    );
  }

  const batch = batchQuery.data.data;

  return (
    <div className="container-fluid py-3">
      <div className="mb-3">
        <Button variant="link" className="p-0" onClick={() => navigate('/tickets')}>
          <FaArrowLeft className="me-2" />
          Volver al listado
        </Button>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <h4 className="m-0">Batch {formatBatchId(batch.batchId)}</h4>
          <div className="small text-muted mt-1">
            {batch.count} tickets creados en la misma operación. ID completo:{' '}
            <code>{batch.batchId}</code>
          </div>
        </Card.Body>
      </Card>

      {batch.tickets.length === 0 ? (
        <Card>
          <Card.Body className="text-center text-muted py-5">
            Sin tickets en este batch.
          </Card.Body>
        </Card>
      ) : (
        <ListGroup>
          {batch.tickets.map((t) => (
            <TicketListItem key={t._id} ticket={t} />
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default TicketBatchView;
