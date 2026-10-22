import React, { useEffect, useState } from 'react';
import { Alert, Badge, Modal, Pagination, Spinner, Table } from 'react-bootstrap';
import { useInventarioMovimientos } from '@/hooks/useInventarioMovimientos';
import {
  INVENTARIO_MOVIMIENTO_LABELS,
  type InventarioMovimientoTipo,
  type InventarioRepuesto,
} from '@/types/inventarioRepuesto.types';

const PAGE_SIZE = 20;

const VARIANT: Record<InventarioMovimientoTipo, string> = {
  entrada: 'success',
  salida: 'danger',
  ajuste: 'secondary',
};

interface InventarioHistorialModalProps {
  show: boolean;
  onHide: () => void;
  item: InventarioRepuesto | null;
}

const InventarioHistorialModal: React.FC<InventarioHistorialModalProps> = ({ show, onHide, item }) => {
  const [page, setPage] = useState(1);
  useEffect(() => {
    if (show) setPage(1);
  }, [show, item?._id]);

  const { data, isLoading, isError } = useInventarioMovimientos(
    { itemId: item?._id, page, limit: PAGE_SIZE },
    show && !!item?._id
  );
  const rows = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const total = data?.pagination?.total ?? rows.length;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Historial de movimientos{item ? ` — ${item.nombre}` : ''}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading && (
          <div className="text-center my-3">
            <Spinner animation="border" variant="primary" />
          </div>
        )}
        {isError && <Alert variant="danger">No fue posible cargar el historial.</Alert>}
        {!isLoading && !isError && rows.length === 0 && (
          <p className="text-center text-muted my-3 mb-0">Aún no hay movimientos para este ítem.</p>
        )}
        {rows.length > 0 && (
          <>
            <Table responsive hover size="sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Anterior</th>
                  <th>Resultante</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m._id}>
                    <td>{m.createdAt ? new Date(m.createdAt).toLocaleString('es-CO') : '-'}</td>
                    <td>
                      <Badge bg={VARIANT[m.tipo]}>{INVENTARIO_MOVIMIENTO_LABELS[m.tipo]}</Badge>
                    </td>
                    <td>{m.cantidad}</td>
                    <td>{m.stockAnterior}</td>
                    <td>{m.stockResultante}</td>
                    <td>{m.motivo || m.referenciaTipo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Mostrando {rows.length} de {total}
              </small>
              {totalPages > 1 && (
                <Pagination className="mb-0">
                  <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                  <Pagination.Item active>{page}</Pagination.Item>
                  <Pagination.Next
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </Pagination>
              )}
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default InventarioHistorialModal;
