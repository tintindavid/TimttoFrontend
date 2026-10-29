import React from 'react';
import { Badge } from 'react-bootstrap';
import { LINEA_ESTADO_LABELS, type RequisicionLineaEstado } from '@/types/requisicion.types';
import { LINEA_ESTADO_VARIANT } from '@/utils/requisicion.utils';

interface Props {
  estado?: string;
}

/** Badge of a line's reception state (Pendiente / Recibida / Confirmada / En disputa ...). */
const LineaEstadoBadge: React.FC<Props> = ({ estado = 'Pendiente' }) => (
  <Badge bg={LINEA_ESTADO_VARIANT[estado] ?? 'secondary'}>
    {LINEA_ESTADO_LABELS[estado as RequisicionLineaEstado] ?? estado}
  </Badge>
);

export default LineaEstadoBadge;
