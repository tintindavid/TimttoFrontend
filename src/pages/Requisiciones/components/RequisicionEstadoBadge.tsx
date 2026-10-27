import React from 'react';
import { Badge } from 'react-bootstrap';
import { REQUISICION_ESTADO_LABELS, type RequisicionEstado } from '@/types/requisicion.types';
import { ESTADO_VARIANT } from '@/utils/requisicion.utils';

interface Props {
  estado: RequisicionEstado;
}

const RequisicionEstadoBadge: React.FC<Props> = ({ estado }) => (
  <Badge bg={ESTADO_VARIANT[estado] ?? 'secondary'}>{REQUISICION_ESTADO_LABELS[estado] ?? estado}</Badge>
);

export default RequisicionEstadoBadge;
