import React from 'react';
import { Link } from 'react-router-dom';
import ReqHelp from '@/pages/Requisiciones/help/ReqHelp';
import type { Repuesto } from '@/types/repuesto.types';
import { DISPONIBILIDAD_LABELS, getRequisicionLink } from '@/utils/repuestoRequisicion';

/** Reason shown on the disabled "Instalar / Editar / Eliminar" actions of a request locked by its requisition. */
export const bloqueoRequisicionReason = (repuesto: Pick<Repuesto, 'EstadoSolicitud'> & { requisicion?: Repuesto['requisicion'] }): string => {
  const link = getRequisicionLink(repuesto);
  const estado = link?.disponibilidad ? DISPONIBILIDAD_LABELS[link.disponibilidad].toLowerCase() : '';
  const where = [link?.consecutivo, estado && `(${estado})`].filter(Boolean).join(' ');
  return `En la requisición ${where}: no se puede instalar, editar ni eliminar hasta que esté disponible.`;
};

interface Props {
  repuesto: Pick<Repuesto, 'EstadoSolicitud'> & { requisicion?: Repuesto['requisicion'] };
}

/** Visible explanation + link to the requisition, next to a locked spare-part request. */
const RepuestoBloqueoRequisicion: React.FC<Props> = ({ repuesto }) => {
  const link = getRequisicionLink(repuesto);
  if (!link) return null;
  return (
    <small className="text-muted d-block mt-1" role="note">
      {bloqueoRequisicionReason(repuesto)}{' '}
      <Link to={`/requisiciones/${link.requisicionId}`}>Ver requisición</Link>
      <ReqHelp id="bloqueo.requisicion" />
    </small>
  );
};

export default RepuestoBloqueoRequisicion;
