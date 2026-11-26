import React from 'react';
import { Alert, Button, Container, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import { useResumenEquipo, useTenantEfectivo } from '@/hooks/useBusquedaEquipos';
import type { ResumenEquipo } from '@/types/busquedaEquipo.types';
import EquipoEncabezado from './components/EquipoEncabezado';
import SeccionesEquipo from './components/SeccionesEquipo';
import { useEnlacesResumen } from './useEnlacesResumen';
import './ResumenEquipoPage.css';

const Contenido: React.FC<{ resumen: ResumenEquipo }> = ({ resumen }) => {
  const enlaces = useEnlacesResumen(resumen);
  return (
    <>
      <EquipoEncabezado resumen={resumen} enlaces={enlaces} />
      <SeccionesEquipo resumen={resumen} enlaces={enlaces} />
    </>
  );
};

/** Consolidated, read-only summary of one equipment (target of the navbar search). */
const ResumenEquipoPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tenantId = useTenantEfectivo();
  const { data, isLoading, isError, error, refetch } = useResumenEquipo(id);

  const renderCuerpo = () => {
    if (!tenantId) {
      return <Alert variant="info">Selecciona una organización para consultar sus equipos.</Alert>;
    }
    if (data) return <Contenido key={data.equipo._id} resumen={data} />;
    if (isError) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 404) {
        return (
          <Alert variant="warning">
            <Alert.Heading as="h1" className="h5">Equipo no encontrado</Alert.Heading>
            <p className="mb-0">No existe o no tienes acceso a él. Usa el buscador para consultar otro equipo.</p>
          </Alert>
        );
      }
      if (status === 403) {
        return <Alert variant="warning">No tienes permiso para consultar equipos.</Alert>;
      }
      return (
        <Alert variant="danger" className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span>No se pudo cargar el resumen del equipo.</span>
          <Button variant="outline-danger" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </Alert>
      );
    }
    if (isLoading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" role="status" aria-label="Cargando resumen del equipo" />
        </div>
      );
    }
    return <Alert variant="info">No hay información de este equipo.</Alert>;
  };

  return (
    <Container fluid="xl" className="resumen-equipo px-0 px-sm-2">
      <Button variant="link" className="p-0 mb-2 text-decoration-none" onClick={() => navigate(-1)}>
        <FaArrowLeft className="me-2" aria-hidden="true" />
        Volver
      </Button>
      {renderCuerpo()}
    </Container>
  );
};

export default ResumenEquipoPage;
