import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Table,
  Form,
  Button,
  Spinner,
  Alert,
  Badge,
  Pagination,
} from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useGetPlatformAudit } from '@/hooks/usePlatformAudit';
import type { PlatformAuditAction, PlatformAuditListParams } from '@/types';
import AuditRowDetail from './AuditRowDetail';

const ACTION_LABELS: Record<PlatformAuditAction, string> = {
  TENANT_CREATED: 'Tenant creado',
  TENANT_UPDATED: 'Tenant actualizado',
  TENANT_SUSPENDED: 'Tenant suspendido',
  TENANT_REACTIVATED: 'Tenant reactivado',
  TENANT_SOFT_DELETED: 'Tenant eliminado',
  USER_PASSWORD_RESET: 'Reset de contraseña',
  VIEW_AS_ENTERED: 'View-as entrado',
  VIEW_AS_EXITED: 'View-as salido',
};

const ACTION_VARIANTS: Record<PlatformAuditAction, string> = {
  TENANT_CREATED: 'success',
  TENANT_UPDATED: 'primary',
  TENANT_SUSPENDED: 'warning',
  TENANT_REACTIVATED: 'info',
  TENANT_SOFT_DELETED: 'danger',
  USER_PASSWORD_RESET: 'secondary',
  VIEW_AS_ENTERED: 'dark',
  VIEW_AS_EXITED: 'dark',
};

const LIMIT = 25;
const ALL_ACTIONS: PlatformAuditAction[] = [
  'TENANT_CREATED',
  'TENANT_UPDATED',
  'TENANT_SUSPENDED',
  'TENANT_REACTIVATED',
  'TENANT_SOFT_DELETED',
  'USER_PASSWORD_RESET',
  'VIEW_AS_ENTERED',
  'VIEW_AS_EXITED',
];

const PlatformAuditPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<PlatformAuditAction | ''>('');
  const [targetTenantId, setTargetTenantId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Draft values applied on form submit
  const [draftTargetTenantId, setDraftTargetTenantId] = useState('');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');

  const queryParams: PlatformAuditListParams = {
    page,
    limit: LIMIT,
    action: actionFilter || undefined,
    targetTenantId: targetTenantId || undefined,
    from: from || undefined,
    to: to || undefined,
  };

  const { data, isLoading, isError } = useGetPlatformAudit(queryParams);

  const totalPages = data?.pagination?.pages ?? 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTargetTenantId(draftTargetTenantId);
    setFrom(draftFrom);
    setTo(draftTo);
    setPage(1);
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionFilter(e.target.value as PlatformAuditAction | '');
    setPage(1);
  };

  return (
    <Container fluid>
      {/* Header */}
      <Row className="align-items-center mb-4">
        <Col>
          <h4 className="mb-0">Auditoría de plataforma</h4>
          <small className="text-muted">
            Registro inmutable de acciones administrativas. TTL: 2 años.
          </small>
        </Col>
      </Row>

      {/* Filters */}
      <Form onSubmit={handleSearchSubmit}>
        <Row className="mb-3 g-2">
          <Col xs={12} md={3}>
            <Form.Select
              value={actionFilter}
              onChange={handleActionChange}
              aria-label="Filtrar por acción"
            >
              <option value="">Todas las acciones</option>
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a]}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={2}>
            <Form.Control
              placeholder="Target Tenant ID"
              value={draftTargetTenantId}
              onChange={(e) => setDraftTargetTenantId(e.target.value)}
              aria-label="Filtrar por tenant objetivo"
            />
          </Col>
          <Col xs={12} md={2}>
            <Form.Control
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              aria-label="Fecha desde"
            />
          </Col>
          <Col xs={12} md={2}>
            <Form.Control
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              aria-label="Fecha hasta"
            />
          </Col>
          <Col xs={12} md={2}>
            <Button
              type="submit"
              variant="outline-secondary"
              className="w-100"
              aria-label="Aplicar filtros de auditoría"
            >
              <FaSearch aria-hidden="true" className="me-1" />
              Filtrar
            </Button>
          </Col>
        </Row>
      </Form>

      {/* States */}
      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" aria-label="Cargando registros de auditoría" />
        </div>
      )}

      {isError && (
        <Alert variant="danger">
          Error al cargar el log de auditoría. Intenta de nuevo.
        </Alert>
      )}

      {!isLoading && !isError && data && data.data.length === 0 && (
        <Alert variant="info">No se encontraron registros con los filtros aplicados.</Alert>
      )}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <Table hover responsive aria-label="Log de auditoría de plataforma">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Acción</th>
                <th>Target</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((log) => (
                <tr key={log._id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {new Date(log.timestamp).toLocaleString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {log.actorEmail}
                  </td>
                  <td>
                    <Badge bg={ACTION_VARIANTS[log.action]}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {log.targetTenantId && (
                      <span>
                        <code>{log.targetTenantId}</code>
                      </span>
                    )}
                    {log.targetId && (
                      <small className="text-muted d-block">ID: {log.targetId}</small>
                    )}
                  </td>
                  <td>
                    <AuditRowDetail log={log} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.Prev
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Página anterior"
                />
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Pagination.Item
                    key={p}
                    active={p === page}
                    onClick={() => setPage(p)}
                    aria-label={`Página ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Página siguiente"
                />
              </Pagination>
            </div>
          )}

          <small className="text-muted d-block text-center">
            Total: {data.pagination.total} registro{data.pagination.total !== 1 ? 's' : ''}
          </small>
        </>
      )}
    </Container>
  );
};

export default PlatformAuditPage;
