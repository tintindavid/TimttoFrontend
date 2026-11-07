import React from 'react';
import { Badge, Nav } from 'react-bootstrap';
import { useOcPorAprobarCount } from '@/hooks/useOrdenCompra';
import ReqHelp from '../help/ReqHelp';

interface Props {
  onSelect: () => void;
}

/** "OC por aprobar" tab of the list with the counter of purchase orders the user can decide. */
const OcPorAprobarTab: React.FC<Props> = ({ onSelect }) => {
  const { data: count } = useOcPorAprobarCount();
  return (
    <Nav.Item className="d-flex align-items-center">
      <Nav.Link eventKey="oc-por-aprobar" onClick={onSelect}>
        OC por aprobar
        {!!count && (
          <Badge bg="warning" text="dark" pill className="ms-2" aria-label={`${count} órdenes de compra por aprobar`}>
            {count}
          </Badge>
        )}
      </Nav.Link>
      <ReqHelp id="pagina.ocPorAprobar" className="ms-0 me-2" />
    </Nav.Item>
  );
};

export default OcPorAprobarTab;
