import React from 'react';
import { toast } from 'react-toastify';
import { useCerrarLinea } from '@/hooks/useRequisiciones';
import type { RequisicionLinea } from '@/types/requisicion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import ReasonModal from './ReasonModal';

interface Props {
  show: boolean;
  onHide: () => void;
  requisicionId: string;
  /** Line to close; the modal renders nothing without it. */
  linea: RequisicionLinea | null;
}

/** Closes a line with shortfall (or cancels it when nothing was confirmed); the reason is mandatory. */
const CerrarLineaModal: React.FC<Props> = ({ show, onHide, requisicionId, linea }) => {
  const mutation = useCerrarLinea();
  if (!linea?._id) return null;
  const lineaId = linea._id;

  const handleConfirm = async (motivo: string) => {
    try {
      await mutation.mutateAsync({ id: requisicionId, lineaId, data: { motivo } });
      toast.success('Línea cerrada.');
      onHide();
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, 'No fue posible cerrar la línea.'));
    }
  };

  return (
    <ReasonModal
      show={show}
      title={`Cerrar con faltante: ${linea.descripcion}`}
      label="Motivo del cierre"
      confirmLabel="Cerrar línea"
      confirmVariant="warning"
      helpId="accion.cerrarLinea"
      isSubmitting={mutation.isLoading}
      onConfirm={handleConfirm}
      onHide={onHide}
    />
  );
};

export default CerrarLineaModal;
