import React, { useState } from 'react';
import { Badge, Button } from 'react-bootstrap';
import { FaPlus, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import { useHasPermission } from '@/hooks/usePermission';
import { useRemoveReporteExterno } from '@/hooks/useReporteExterno';
import { WARNING_MES_FUERA_DE_CRONOGRAMA, WARNING_SERVICIO_DE_OTRO_ANIO, type TipoMttoExterno } from '@/services/reporteExterno.service';
import type { Reporte } from '@/types/reporte.types';
import ReporteExternoModal from './ReporteExternoModal';

/** True when the reporte was loaded as a service done by a third party. */
export const esReporteExterno = (reporte: Pick<Reporte, 'origen'>): boolean => reporte.origen === 'externo';

interface AdicionarProps {
  tipoMtto: TipoMttoExterno;
  equipoId: string;
  estadoActual?: string;
  /** Scheduled months and months already done of the equipment, shown as a guide in the preventive form. */
  mesesMtto?: string[];
  mesesRealizados?: { mes: string; fecha?: string }[];
  /** Called after a service is registered, so the page can refresh what it keeps outside React Query. */
  onChanged?: () => void;
}

/**
 * "Adicionar actividad" of the MP and MC tabs. Shown only to tenants with the `registersExternal` capability and
 * to users who can create reports; the backend enforces both.
 */
/** Success or warning alert after an external service was saved (shared with the quick load of the schedule). */
export const avisarServicioGuardado = (warnings: string[]): void => {
  const otroAnio = warnings.includes(WARNING_SERVICIO_DE_OTRO_ANIO);
  const fueraDeCronograma = warnings.includes(WARNING_MES_FUERA_DE_CRONOGRAMA);
  const aviso = otroAnio
    ? 'El servicio es de otro año: queda registrado en la hoja de vida, pero no marca ningún mes del cronograma actual.'
    : fueraDeCronograma
      ? 'El mes del servicio no está en el cronograma de mantenimiento del equipo; se registró de todos modos.'
      : undefined;
  void Swal.fire({
    icon: aviso ? 'warning' : 'success',
    title: 'Servicio registrado',
    text: aviso,
    ...(aviso ? {} : { timer: 1800, showConfirmButton: false }),
  });
};

export const AdicionarServicioExterno: React.FC<AdicionarProps> = ({ tipoMtto, equipoId, estadoActual, mesesMtto, mesesRealizados, onChanged }) => {
  const { can } = useTenantCapabilities();
  const puedeCrear = useHasPermission('reports:create');
  const [abierto, setAbierto] = useState(false);

  if (!can('registersExternal') || !puedeCrear) return null;

  const handleSaved = (warnings: string[]) => {
    setAbierto(false);
    onChanged?.();
    avisarServicioGuardado(warnings);
  };

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setAbierto(true)} data-testid="adicionar-actividad">
        <FaPlus className="me-1" />
        Adicionar actividad
      </Button>
      {abierto && (
        <ReporteExternoModal
          show
          tipoMtto={tipoMtto}
          equipoId={equipoId}
          estadoActual={estadoActual}
          mesesMtto={mesesMtto}
          mesesRealizados={mesesRealizados}
          onClose={() => setAbierto(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
};

/** "Externo" badge plus the provider, shown where an internal report shows its responsible person. */
export const InsigniaExterno: React.FC<{ reporte: Reporte }> = ({ reporte }) => (
  <>
    <Badge bg="info" className="me-1" data-testid="insignia-externo">Externo</Badge>
    <strong>{reporte.externo?.proveedor || 'Sin proveedor'}</strong>
  </>
);

interface EliminarProps {
  equipoId: string;
  reporte: Reporte;
  onChanged?: () => void;
}

/** "Eliminar" of an external service. Only external reports get it, and only with `reports:delete`. */
export const EliminarServicioExterno: React.FC<EliminarProps> = ({ equipoId, reporte, onChanged }) => {
  const { can } = useTenantCapabilities();
  const puedeEliminar = useHasPermission('reports:delete');
  const remove = useRemoveReporteExterno(equipoId);

  if (!esReporteExterno(reporte) || !reporte._id || !can('registersExternal') || !puedeEliminar) return null;

  const handleClick = async () => {
    const res = await Swal.fire({
      title: '¿Eliminar este servicio externo?',
      text: 'Se quitará del historial y el mes dejará de contar como realizado en el cronograma.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!res.isConfirmed) return;
    try {
      await remove.mutateAsync(reporte._id as string);
      onChanged?.();
    } catch (error) {
      const e = error as { response?: { data?: { message?: string } }; message?: string };
      await Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: e?.response?.data?.message || e?.message || 'Error desconocido' });
    }
  };

  return (
    <Button
      variant="outline-danger"
      size="sm"
      className="ms-1"
      onClick={handleClick}
      disabled={remove.isLoading}
      title="Eliminar servicio externo"
      aria-label={`Eliminar servicio externo ${reporte.consecutivo ?? ''}`}
    >
      <FaTrash />
    </Button>
  );
};

const HTTP_URL = /^https?:\/\//i;

/** Only http(s) addresses are ever opened (defense in depth over the backend validation). */
const urlSegura = (url?: string | null): string | null => (url && HTTP_URL.test(url) ? url : null);

/** Evidence of a third-party service: the uploaded document and/or the link, only http(s) addresses. */
export const evidenciaDeServicioExterno = (reporte: Pick<Reporte, 'externo'>): { documento: string | null; enlace: string | null } => ({
  documento: urlSegura(reporte.externo?.documento?.url),
  enlace: urlSegura(reporte.externo?.enlace),
});

const abrir = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

/**
 * "Ver" of the MP and MC rows. An internal report opens its detail page. An external one has no detail (it was
 * not produced by a work order), so it opens the evidence the user attached: the document, the link, or both
 * (two buttons). Without evidence the button is disabled and says so.
 */
export const VerServicio: React.FC<{ reporte: Reporte }> = ({ reporte }) => {
  if (!esReporteExterno(reporte)) {
    return (
      <Button variant="info" size="sm" onClick={() => window.open(`/reports/${reporte._id}/view`, '_blank')}>
        Ver
      </Button>
    );
  }

  const { documento, enlace } = evidenciaDeServicioExterno(reporte);
  if (!documento && !enlace) {
    return (
      <Button variant="outline-secondary" size="sm" disabled title="Este servicio no tiene archivo ni enlace adjunto">
        Sin adjunto
      </Button>
    );
  }
  if (documento && enlace) {
    return (
      <>
        <Button variant="info" size="sm" className="me-1" onClick={() => abrir(documento)} title="Abrir el archivo adjunto">Archivo</Button>
        <Button variant="info" size="sm" onClick={() => abrir(enlace)} title="Abrir el enlace">Enlace</Button>
      </>
    );
  }
  return (
    <Button
      variant="info"
      size="sm"
      onClick={() => abrir((documento || enlace) as string)}
      title={documento ? 'Abrir el archivo adjunto' : 'Abrir el enlace'}
    >
      Ver
    </Button>
  );
};
