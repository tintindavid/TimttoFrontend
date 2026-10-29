import React from 'react';
import { Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import type { Repuesto } from '@/types/repuesto.types';
import {
  DISPONIBILIDAD_LABELS,
  DISPONIBILIDAD_VARIANT,
  getRequisicionLink,
} from '@/utils/repuestoRequisicion';

interface Props {
  repuesto: Pick<Repuesto, 'EstadoSolicitud'> & { requisicion?: Repuesto['requisicion'] };
  /** Text shown when the request has no requisition. */
  emptyText?: string;
}

/** Requisition of a spare-part request: consecutivo (link to the detail) + colored availability badge. */
const RepuestoRequisicionBadge: React.FC<Props> = ({ repuesto, emptyText = '-' }) => {
  const link = getRequisicionLink(repuesto);
  if (!link) return <span className="text-muted">{emptyText}</span>;
  const disponibilidad = link.disponibilidad;
  return (
    <span className="d-inline-flex flex-column align-items-start gap-1">
      <Link to={`/requisiciones/${link.requisicionId}`} className="text-nowrap fw-semibold">
        {link.consecutivo || 'Ver requisición'}
      </Link>
      {disponibilidad && (
        <Badge bg={DISPONIBILIDAD_VARIANT[disponibilidad] ?? 'secondary'}>
          {DISPONIBILIDAD_LABELS[disponibilidad] ?? disponibilidad}
        </Badge>
      )}
    </span>
  );
};

export default RepuestoRequisicionBadge;
