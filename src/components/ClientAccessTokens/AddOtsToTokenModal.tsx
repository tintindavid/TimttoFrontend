import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { useOTsByCustomer } from '@/hooks/useOTs';
import { useAddOtsToToken } from '@/hooks/clientAccessToken/useAddOtsToToken';
import { OT } from '@/types/ot.types';
import { ClientAccessToken, ClientAccessTokenOtSummary } from '@/types/clientAccessToken.types';

interface Props {
  show: boolean;
  onHide: () => void;
  token: ClientAccessToken | null;
}

const normalizeOtIds = (
  value: string[] | ClientAccessTokenOtSummary[] | undefined
): Set<string> => {
  if (!value) return new Set();
  return new Set(
    value.map((v) => (typeof v === 'string' ? v : String(v._id)))
  );
};

const otLabel = (ot: OT): string => `${ot.Consecutivo || ot._id} — ${ot.EstadoOt || 'Sin estado'}`;

/**
 * Add-only editor for a `ClientAccessToken.otIds`. Lists the customer's OTs
 * that are NOT already in the token; admin picks one or more and submits.
 * Removal is intentionally out of scope (per spec D0).
 */
const AddOtsToTokenModal: React.FC<Props> = ({ show, onHide, token }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [includeCerradas, setIncludeCerradas] = useState(false);

  const clienteId = token?.clienteId || '';
  const alreadyInToken = useMemo(() => normalizeOtIds(token?.otIds), [token]);

  const { data: otsData, isLoading } = useOTsByCustomer(clienteId, {});
  const allOts: OT[] = (otsData?.data ?? []) as OT[];

  const availableOts = useMemo(
    () =>
      allOts.filter(
        (ot) =>
          !ot.isDeleted &&
          !alreadyInToken.has(String(ot._id)) &&
          (includeCerradas || ot.EstadoOt !== 'Cerrada')
      ),
    [allOts, alreadyInToken, includeCerradas]
  );

  const mutation = useAddOtsToToken();

  useEffect(() => {
    if (show) {
      setSelected([]);
      setIncludeCerradas(false);
    }
  }, [show]);

  const toggle = (otId: string): void => {
    setSelected((prev) => (prev.includes(otId) ? prev.filter((v) => v !== otId) : [...prev, otId]));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!token?._id || selected.length === 0) return;
    try {
      await mutation.mutateAsync({ id: token._id, otIds: selected });
      onHide();
    } catch {
      // toast surfaced by the hook
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Añadir OTs al acceso</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <span>
              Selecciona las OTs que quieres añadir. Las OTs ya asociadas al acceso no aparecen en la lista.
            </span>
            <Badge bg="primary">{selected.length} seleccionadas</Badge>
          </div>
        </Alert>

        <Form.Check
          id="add-ots-include-cerradas"
          type="checkbox"
          label="Incluir OTs cerradas"
          checked={includeCerradas}
          onChange={(e) => setIncludeCerradas(e.target.checked)}
          className="mb-3"
        />

        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : availableOts.length === 0 ? (
          <Alert variant="warning" className="mb-0">
            No hay OTs disponibles para añadir. Todas las OTs del cliente ya están en este acceso
            o no cumplen el filtro.
          </Alert>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <Table hover size="sm" className="mb-0">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>OT</th>
                  <th>Estado</th>
                  <th>Avance</th>
                </tr>
              </thead>
              <tbody>
                {availableOts.map((ot) => (
                  <tr key={ot._id} onClick={() => toggle(String(ot._id))} style={{ cursor: 'pointer' }}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selected.includes(String(ot._id))}
                        onChange={() => toggle(String(ot._id))}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>{otLabel(ot)}</td>
                    <td>{ot.EstadoOt || '—'}</td>
                    <td>{ot.Avance != null ? `${ot.Avance}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={selected.length === 0 || mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" /> Añadiendo…
            </>
          ) : (
            <>
              <FaPlus className="me-1" /> Añadir {selected.length > 0 ? `(${selected.length})` : ''}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddOtsToTokenModal;
