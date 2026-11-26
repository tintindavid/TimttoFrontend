import React, { useEffect, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { PERMISSIONS } from '@/constants/permissions';
import { useTenantEfectivo } from '@/hooks/useBusquedaEquipos';
import { useEsEscritorio } from '@/hooks/useEsEscritorio';
import { useHasPermission } from '@/hooks/usePermission';
import BuscadorEquipos from './BuscadorEquipos';
import './GlobalSearch.css';

/** Mounted only for users who may search, so nothing else here runs without permission or tenant. */
const BuscadorNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const escritorio = useEsEscritorio();
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => setModalAbierto(false), [pathname]);

  const abrirResumen = (equipoId: string) => {
    setModalAbierto(false);
    navigate(`/buscar/equipo/${equipoId}`);
  };

  if (escritorio) {
    return (
      <div className="global-search ms-3 me-3">
        <BuscadorEquipos variante="desplegable" onSeleccionar={abrirResumen} />
      </div>
    );
  }

  return (
    <>
      <Button
        variant="link"
        className="text-white ms-auto me-2 p-2 border-0"
        onClick={() => setModalAbierto(true)}
        aria-label="Buscar equipo"
      >
        <FaSearch size={20} />
      </Button>
      <Modal show={modalAbierto} onHide={() => setModalAbierto(false)} fullscreen aria-labelledby="busqueda-titulo">
        <Modal.Header closeButton closeLabel="Cerrar búsqueda">
          <Modal.Title id="busqueda-titulo" as="h2" className="h5">
            Buscar equipo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column p-3">
          <BuscadorEquipos variante="completo" onSeleccionar={abrirResumen} onCerrar={() => setModalAbierto(false)} />
        </Modal.Body>
      </Modal>
    </>
  );
};

/** Equipment search of the navbar (every plan): needs `equipo-items:read` and an effective tenant. */
const GlobalSearch: React.FC = () => {
  const tenantId = useTenantEfectivo();
  const puedeBuscar = useHasPermission(PERMISSIONS.EQUIPO_ITEMS_READ);

  if (!tenantId || !puedeBuscar) return null;
  // key: switching tenant (view-as) discards whatever was typed.
  return <BuscadorNavbar key={tenantId} />;
};

export default GlobalSearch;
