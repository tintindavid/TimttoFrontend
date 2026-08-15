import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Pagination, Row, Spinner, Table } from 'react-bootstrap';
import { useMarkAllAsRead, useMarkAsRead, useNotifications } from '@/hooks/useNotifications';

// This is a chronological feed (read/unread status, no "name" field to search
// by), not a CRUD catalog — table-listing-standards' search/sort requirements
// don't apply here (same exemption category as audit-log listings).
const PAGE_SIZE = 20;

const NotificationsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [unreadOnly]);

  const { data, isLoading, isError } = useNotifications({
    page,
    limit: PAGE_SIZE,
    unread: unreadOnly || undefined,
  });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const items = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const totalCount = data?.pagination?.total ?? 0;

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Notificaciones</h1>
          <p className="text-muted mb-0">Historial de notificaciones recibidas</p>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isLoading}
          >
            Marcar todas como leídas
          </Button>
        </Col>
      </Row>

      <Form.Check
        type="switch"
        id="unread-only-toggle"
        label="Mostrar solo no leídas"
        checked={unreadOnly}
        onChange={(event) => setUnreadOnly(event.target.checked)}
        className="mb-3"
      />

      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" aria-label="Cargando notificaciones" />
        </div>
      )}

      {isError && <Alert variant="danger">No fue posible cargar las notificaciones.</Alert>}

      {!isLoading && !isError && (
        <>
          <Card className="tt-card mb-3">
            <Card.Body>
              {items.length === 0 ? (
                <p className="text-center text-muted my-3 mb-0">
                  {unreadOnly ? 'No tienes notificaciones sin leer.' : 'Aún no tienes notificaciones.'}
                </p>
              ) : (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Título</th>
                      <th>Mensaje</th>
                      <th>Fecha</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id} className={item.readAt ? '' : 'fw-semibold'}>
                        <td>
                          {item.readAt ? (
                            <Badge bg="secondary">Leída</Badge>
                          ) : (
                            <Badge bg="primary">Nueva</Badge>
                          )}
                        </td>
                        <td>{item.title}</td>
                        <td>{item.body}</td>
                        <td>{new Date(item.createdAt).toLocaleString('es-CO')}</td>
                        <td>
                          {!item.readAt && (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => markAsRead.mutate(item._id)}
                              disabled={markAsRead.isLoading}
                            >
                              Marcar como leída
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Mostrando {items.length} de {totalCount}
            </small>
            {totalPages > 1 && (
              <Pagination className="mb-0">
                <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <Pagination.Item key={pageNumber} active={pageNumber === page} onClick={() => setPage(pageNumber)}>
                    {pageNumber}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </Pagination>
            )}
          </div>
        </>
      )}
    </Container>
  );
};

export default NotificationsPage;
