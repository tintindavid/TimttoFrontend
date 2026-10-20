import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import type { IconType } from 'react-icons';
import { FaBoxOpen, FaFilter, FaCheckSquare, FaEye, FaExclamationTriangle, FaClock, FaCalendarCheck } from 'react-icons/fa';
import { MESES } from '@/types/cronograma.types';
import { CronogramaStats } from '@/types/cronograma.types';

interface CronogramaStatsCardProps {
  stats: CronogramaStats;
  /** False for a tenant without the premium module "Servicios de terceros": no external figures. */
  mostrarExternas?: boolean;
  /** False when equipment can not be selected (a tenant that can not create work orders): no selection figures. */
  mostrarSeleccion?: boolean;
}

interface Tarjeta {
  clave: string;
  Icono: IconType;
  color: 'primary' | 'info' | 'success' | 'warning' | 'danger';
  etiqueta: string;
  valor: number;
  /** Test id of the figure (h4). */
  idValor?: string;
  /** Test id of the card column, to find a group of cards. */
  idGrupo?: string;
}

/**
 * Cards per row so that the visible cards fill every row evenly, whatever the number of them (no empty column at
 * the end of a row): up to four in one row, otherwise rows of four when they divide evenly, rows of three if not.
 */
export const tarjetasPorFila = (cantidad: number): number => {
  if (cantidad <= 4) return Math.max(cantidad, 1);
  if (cantidad % 4 === 0) return 4;
  if (cantidad % 3 === 0) return 3;
  return 4;
};

/**
 * Componente para mostrar estadísticas del cronograma. The cards are laid out as ONE grid: the groups that do not
 * apply to the tenant (selection, external) are simply not part of it, and the rest share the width.
 */
export const CronogramaStatsCard: React.FC<CronogramaStatsCardProps> = ({ stats, mostrarExternas = true, mostrarSeleccion = true }) => {
  const tarjetas: Tarjeta[] = [
    { clave: 'total', Icono: FaBoxOpen, color: 'primary', etiqueta: 'Total Equipos', valor: stats.totalEquipos },
    { clave: 'filtrados', Icono: FaFilter, color: 'info', etiqueta: 'Equipos Filtrados', valor: stats.equiposVisibles },
  ];

  if (mostrarSeleccion) {
    tarjetas.push(
      { clave: 'seleccionados', Icono: FaCheckSquare, color: 'success', etiqueta: 'Equipos Seleccionados', valor: stats.equiposSeleccionados },
      { clave: 'visibles-selecc', Icono: FaEye, color: 'warning', etiqueta: 'Visibles Selecc.', valor: stats.equiposVisiblesSeleccionados },
    );
  }

  if (mostrarExternas && stats.equiposPorMesExterno !== undefined) {
    const totalExternos = MESES.reduce((acc, mes) => acc + (stats.equiposPorMesExterno?.[mes] ?? 0), 0);
    const totalPreventivos = MESES.reduce((acc, mes) => acc + (stats.equiposPorMes?.[mes] ?? 0), 0);
    tarjetas.push(
      { clave: 'prog-prev', Icono: FaCalendarCheck, color: 'success', etiqueta: 'Programaciones preventivas', valor: totalPreventivos, idGrupo: 'stats-externas' },
      { clave: 'prog-ext', Icono: FaCalendarCheck, color: 'info', etiqueta: 'Programaciones externas', valor: totalExternos },
      { clave: 'ext-vencidas', Icono: FaExclamationTriangle, color: 'danger', etiqueta: 'Externas vencidas', valor: stats.externasVencidas ?? 0, idValor: 'externas-vencidas' },
      { clave: 'ext-por-vencer', Icono: FaClock, color: 'warning', etiqueta: 'Externas por vencer (30 días)', valor: stats.externasPorVencer ?? 0, idValor: 'externas-por-vencer' },
    );
  }

  const md = 12 / tarjetasPorFila(tarjetas.length);

  return (
    <Row className="g-3 mb-3" data-testid="stats-cards">
      {tarjetas.map(({ clave, Icono, color, etiqueta, valor, idValor, idGrupo }) => (
        <Col key={clave} md={md} data-testid={idGrupo}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className={`stats-icon bg-${color} bg-opacity-10 rounded p-3 me-3`}>
                <Icono className={`text-${color}`} size={24} />
              </div>
              <div>
                <div className="text-muted small">{etiqueta}</div>
                <h4 className="mb-0" data-testid={idValor}>{valor}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
