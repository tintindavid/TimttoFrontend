import React from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';

interface Props {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  children: React.ReactNode;
}

/** Frame shared by every dashboard card: owns its own spinner and error + retry state. */
const DashboardCardShell: React.FC<Props> = ({ title, subtitle, isLoading, isError, onRetry, children }) => (
  <Card className="tt-card h-100">
    <Card.Body>
      <Card.Title className="fs-6 mb-1">{title}</Card.Title>
      {subtitle && <div className="text-muted small mb-2">{subtitle}</div>}
      {isLoading ? (
        <div className="d-flex justify-content-center py-4">
          <Spinner animation="border" size="sm" variant="primary" role="status">
            <span className="visually-hidden">{`Cargando ${title}`}</span>
          </Spinner>
        </div>
      ) : isError ? (
        <Alert variant="danger" className="mb-0 d-flex justify-content-between align-items-center">
          <span>{`No se pudo cargar "${title}".`}</span>
          <Button size="sm" variant="outline-danger" onClick={onRetry} aria-label={`Reintentar ${title}`}>
            Reintentar
          </Button>
        </Alert>
      ) : (
        children
      )}
    </Card.Body>
  </Card>
);

export default DashboardCardShell;
