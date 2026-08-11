import React from 'react';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { FaBan, FaEnvelope, FaPlus, FaTrash } from 'react-icons/fa';
import { ClientAccessToken, ClientAccessTokenOtSummary } from '@/types/clientAccessToken.types';
import CopyLinkButton from './CopyLinkButton';

interface TokenListProps {
  tokens: ClientAccessToken[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRevoke: (token: ClientAccessToken) => void;
  onDelete: (token: ClientAccessToken) => void;
  onAddOts?: (token: ClientAccessToken) => void;
  onSendLink?: (token: ClientAccessToken) => void;
}

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

const renderOtsSummary = (otIds: ClientAccessToken['otIds']): string => {
  if (!otIds || otIds.length === 0) return '—';
  const first = otIds[0];
  if (typeof first === 'string') {
    return `${otIds.length} OT${otIds.length > 1 ? 's' : ''}`;
  }
  const summaries = otIds as ClientAccessTokenOtSummary[];
  return summaries.map((ot) => ot.Consecutivo || ot._id).join(', ');
};

/**
 * React-Bootstrap `Table` listing `ClientAccessToken` documents for a client.
 * Columns per spec 8.1: Fecha, OTs, Estado, Accesos, Último acceso, Acciones.
 */
const formatRelative = (iso?: string | null): string => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return '';
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'hace instantes';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `hace ${diffD} d`;
  const diffMo = Math.round(diffD / 30);
  return `hace ${diffMo} mes${diffMo > 1 ? 'es' : ''}`;
};

const TokenList: React.FC<TokenListProps> = ({
  tokens,
  isLoading,
  isError,
  errorMessage,
  onRevoke,
  onDelete,
  onAddOts,
  onSendLink,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" aria-label="Cargando accesos" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger">
        Error al cargar los accesos del cliente{errorMessage ? `: ${errorMessage}` : '.'}
      </Alert>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center text-muted py-4">
          Este cliente no tiene accesos generados todavía.
        </Card.Body>
      </Card>
    );
  }

  return (
    <Table responsive bordered hover className="bg-white mb-0">
      <thead className="table-light">
        <tr>
          <th>Fecha</th>
          <th>OTs</th>
          <th>Estado</th>
          <th>Accesos</th>
          <th>Último acceso</th>
          <th className="text-end">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((t) => {
          const history = t.emailHistory;
          const sendCount = history?.sendCount ?? 0;
          return (
            <tr key={t._id}>
              <td className="small">{formatDate(t.createdAt)}</td>
              <td className="small">
                {renderOtsSummary(t.otIds)}
                {sendCount > 0 && (
                  <div className="text-muted small mt-1">
                    <FaEnvelope className="me-1" />
                    {sendCount} envío{sendCount > 1 ? 's' : ''}
                    {history?.lastEmail ? ` · último a ${history.lastEmail}` : ''}
                    {history?.lastSentAt ? ` · ${formatRelative(history.lastSentAt)}` : ''}
                  </div>
                )}
              </td>
              <td>
                <Badge bg={t.status === 'active' ? 'success' : 'secondary'}>
                  {t.status === 'active' ? 'Activo' : 'Revocado'}
                </Badge>
              </td>
              <td>{t.accessCount ?? 0}</td>
              <td className="small text-muted">{formatDate(t.lastAccessedAt)}</td>
              <td className="text-end">
                {t.status === 'active' ? (
                  <>
                    <CopyLinkButton token={t.token} className="me-1" />
                    {onAddOts && (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-1"
                        onClick={() => onAddOts(t)}
                        title="Añadir OTs"
                        aria-label="Añadir OTs"
                      >
                        <FaPlus />
                      </Button>
                    )}
                    {onSendLink && (
                      <Button
                        size="sm"
                        variant="outline-info"
                        className="me-1"
                        onClick={() => onSendLink(t)}
                        title="Enviar link por correo"
                        aria-label="Enviar link por correo"
                      >
                        <FaEnvelope />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline-warning"
                      className="me-1"
                      onClick={() => onRevoke(t)}
                      title="Revocar acceso"
                      aria-label="Revocar acceso"
                    >
                      <FaBan />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => onDelete(t)}
                    title="Eliminar acceso"
                    aria-label="Eliminar acceso"
                  >
                    <FaTrash />
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default TokenList;
