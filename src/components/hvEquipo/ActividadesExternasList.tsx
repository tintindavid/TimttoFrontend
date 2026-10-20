import React from 'react';
import { Accordion } from 'react-bootstrap';
import type { ActividadExterna, CadenaConActividades } from '@/types/actividadExterna.types';
import CadenaActividadRow from './CadenaActividadRow';
import './ActividadesExternasList.css';

interface Props {
  grupos: CadenaConActividades[];
  onCerrarCadena: (id: string) => void;
  onRemoveActividad: (id: string) => void;
  onCambiarProveedor?: (actividad: ActividadExterna) => void;
}

const ActividadesExternasList: React.FC<Props> = ({ grupos, onCerrarCadena, onRemoveActividad, onCambiarProveedor }) => {
  if (grupos.length === 0) {
    return (
      <p className="text-muted text-center p-4">
        No hay actividades externas registradas aún. Pulsa “+ Agregar actividad” para comenzar.
      </p>
    );
  }
  return (
    <Accordion alwaysOpen>
      {grupos.map((g) => (
        <CadenaActividadRow
          key={g.cadena._id}
          grupo={g}
          onCerrar={onCerrarCadena}
          onRemove={onRemoveActividad}
          onCambiarProveedor={onCambiarProveedor}
        />
      ))}
    </Accordion>
  );
};

export default ActividadesExternasList;
