import React from 'react';
import { Badge } from 'react-bootstrap';
import { PublicClienteSummary, PublicEquipoSummary, PublicSedeSummary } from '@/types/equipmentQr.types';
import { getEstadoOperativoBadgeStyle } from '@/utils/estadoOperativoBadge.util';

interface PublicEquipmentHeaderProps {
  equipo: PublicEquipoSummary;
  cliente: PublicClienteSummary;
  sede?: PublicSedeSummary;
}

/**
 * Sticky header of the public equipment page (D7, D14 UI rule 7 — cliente
 * logo as hero, "Powered by TIMTTO" lives in the page footer instead).
 * Mobile-first: no fixed pixel widths beyond the 360px test viewport.
 */
const PublicEquipmentHeader: React.FC<PublicEquipmentHeaderProps> = ({ equipo, cliente, sede }) => {
  const badgeStyle = getEstadoOperativoBadgeStyle(equipo.estadoOperativo);
  const itemLine = [equipo.item, equipo.marca, equipo.modelo].filter(Boolean).join(' · ');

  return (
    <header className="bg-white border-bottom py-3 px-3 sticky-top">
      <div className="d-flex align-items-center gap-3 flex-wrap">
        {cliente.logoUrl ? (
          <img
            src={cliente.logoUrl}
            alt={`Logo de ${cliente.nombre}`}
            style={{ maxWidth: 72, maxHeight: 72, height: 'auto', width: 'auto' }}
            className="flex-shrink-0"
          />
        ) : null}
        <div className="flex-grow-1 text-break">
          <div className="small text-muted">{cliente.nombre}</div>
          {sede?.nombre && <div className="small text-muted">{sede.nombre}</div>}
          <h5 className="m-0">{itemLine || 'Equipo'}</h5>
        </div>
      </div>
      <div className="mt-2">
        <Badge style={badgeStyle} className="fs-6">
          {equipo.estadoOperativo || 'Sin estado'}
        </Badge>
      </div>
    </header>
  );
};

export default PublicEquipmentHeader;
