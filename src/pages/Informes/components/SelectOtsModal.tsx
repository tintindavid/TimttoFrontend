import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, OverlayTrigger, Spinner, Table, Tooltip } from 'react-bootstrap';

import { useOTs } from '@/hooks/useOTs';
import { OT } from '@/types/ot.types';

export interface SelectOtsModalProps {
  show: boolean;
  onHide: () => void;
  /** Preserved when the modal is reopened via "Editar selección". */
  initialSelected: Set<string>;
  clienteId: string;
  onConfirm: (selectedIds: string[]) => void;
}

const CANCELADA_TOOLTIP = 'Los reportes de OTs canceladas no cuentan para el % de cumplimiento';

function sortByFechaCreacionDesc(a: OT, b: OT): number {
  const da = a.FechaCreacion ? new Date(a.FechaCreacion).getTime() : 0;
  const db = b.FechaCreacion ? new Date(b.FechaCreacion).getTime() : 0;
  return db - da;
}

/**
 * Checkbox list of a client's OTs for the "Informe por OT" tab
 * (informe-por-ot spec: cliente → modal → edit selection). Canceladas are
 * listed (not hidden) with a warning badge + tooltip.
 */
export const SelectOtsModal: React.FC<SelectOtsModalProps> = ({
  show,
  onHide,
  initialSelected,
  clienteId,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (show) {
      setSelected(new Set(initialSelected));
      setSearch('');
    }
    // Only re-sync when the modal opens — editing the parent's selection
    // reference on every keystroke would reset local checkbox state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const { data, isLoading, isError } = useOTs(
    show && clienteId ? { ClienteId: clienteId, page: 1, limit: 500 } : undefined,
  );

  const allOts: OT[] = useMemo(
    () => [...((data?.data as OT[]) ?? [])].sort(sortByFechaCreacionDesc),
    [data],
  );

  const visibleOts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allOts;
    return allOts.filter((ot) => (ot.Consecutivo || '').toLowerCase().includes(term));
  }, [allOts, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = visibleOts.length > 0 && visibleOts.every((ot) => selected.has(String(ot._id)));

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleOts.forEach((ot) => next.delete(String(ot._id)));
      } else {
        visibleOts.forEach((ot) => next.add(String(ot._id)));
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Seleccionar OTs</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          type="search"
          placeholder="Buscar por consecutivo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar OT por consecutivo"
          className="mb-3"
        />

        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" aria-label="Cargando OTs" />
          </div>
        ) : isError ? (
          <Alert variant="danger" className="mb-0">
            Error al cargar las OTs del cliente.
          </Alert>
        ) : visibleOts.length === 0 ? (
          <Alert variant="info" className="mb-0">
            No hay OTs para este cliente.
          </Alert>
        ) : (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <Table hover size="sm" className="align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <Form.Check
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Seleccionar todas las visibles"
                    />
                  </th>
                  <th>Consecutivo</th>
                  <th>Fecha creación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibleOts.map((ot) => {
                  const id = String(ot._id);
                  const isCancelada = ot.EstadoOt === 'Cancelada';
                  return (
                    <tr key={id} onClick={() => toggle(id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selected.has(id)}
                          onChange={() => toggle(id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Seleccionar OT ${ot.Consecutivo || id}`}
                        />
                      </td>
                      <td>{ot.Consecutivo || '—'}</td>
                      <td>{ot.FechaCreacion ? new Date(ot.FechaCreacion).toLocaleDateString('es-CO') : '—'}</td>
                      <td>
                        {isCancelada ? (
                          <OverlayTrigger placement="top" overlay={<Tooltip>{CANCELADA_TOOLTIP}</Tooltip>}>
                            <Badge bg="secondary">{ot.EstadoOt}</Badge>
                          </OverlayTrigger>
                        ) : (
                          <Badge bg="primary">{ot.EstadoOt || '—'}</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <span className="me-auto text-muted small">{selected.size} OT(s) seleccionada(s)</span>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={selected.size === 0}>
          Confirmar selección
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SelectOtsModal;
