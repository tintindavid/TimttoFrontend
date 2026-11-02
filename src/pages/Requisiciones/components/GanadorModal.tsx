import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSeleccionarGanador } from '@/hooks/useLicitacion';
import type { ComparativoProveedor } from '@/types/licitacion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicionId: string;
  candidato: ComparativoProveedor | null;
}

/**
 * Winner selection is irreversible, so it takes two steps: first an explanation, then the buyer has to
 * tick an explicit acknowledgement before the final button is enabled.
 */
const GanadorModal: React.FC<Props> = ({ show, onHide, requisicionId, candidato }) => {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [entendido, setEntendido] = useState(false);
  const mutation = useSeleccionarGanador();

  useEffect(() => {
    if (show) {
      setPaso(1);
      setEntendido(false);
    }
  }, [show]);

  const handleConfirm = async () => {
    if (!candidato || mutation.isLoading) return;
    try {
      await mutation.mutateAsync({ id: requisicionId, paId: candidato.paId });
      toast.success('Proveedor seleccionado. La requisición quedó adjudicada.');
      onHide();
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible seleccionar al ganador.'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Seleccionar ganador ({paso} de 2)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {paso === 1 ? (
          <p className="mb-0">
            ¿Quieres adjudicar esta requisición a <strong>{candidato?.nombre}</strong>? Los demás proveedores quedarán
            descartados y sus enlaces dejarán de funcionar.
          </p>
        ) : (
          <>
            <Alert variant="danger">
              Esta decisión es <strong>irreversible</strong>: no podrás cambiar el ganador después de confirmar.
            </Alert>
            <Form.Check
              id="ganador-entendido"
              type="checkbox"
              label={`Entiendo que seleccionar a ${candidato?.nombre ?? 'este proveedor'} no se puede deshacer.`}
              checked={entendido}
              onChange={(e) => setEntendido(e.target.checked)}
              disabled={mutation.isLoading}
            />
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={mutation.isLoading}>
          Cancelar
        </Button>
        {paso === 1 ? (
          <Button variant="primary" onClick={() => setPaso(2)}>
            Continuar
          </Button>
        ) : (
          <Button variant="danger" onClick={handleConfirm} disabled={!entendido || mutation.isLoading}>
            {mutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Confirmar ganador
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default GanadorModal;
