import React from 'react';
import { Alert } from 'react-bootstrap';

/** Discreet note listing the active filters a card cannot honour. Renders nothing when the list is empty. */
const FiltrosNoAplicadosNote: React.FC<{ filtros?: string[] }> = ({ filtros }) =>
  filtros && filtros.length > 0 ? (
    <Alert variant="info" className="py-2 small">
      {`Filtros no aplicados a esta tarjeta: ${filtros.join(', ')}.`}
    </Alert>
  ) : null;

export default FiltrosNoAplicadosNote;
