import React from 'react';
import { Alert, Badge, Button, Modal, Spinner } from 'react-bootstrap';
import { useActividadesExternasPorEquipo } from '@/hooks/useActividadesExternas';
import { useReportesByEquipo } from '@/hooks/useReportes';
import { ESTADOS_FINAL_LABELS, TIPOS_ACTIVIDAD } from '@/constants/actividadExterna';
import { formatearFechaUtc } from '@/utils/cronogramaExterno';
import { actividadesDeCelda, preventivosDeCelda, urlHttp } from '@/utils/cronogramaResumenCelda';
import { MESES_MAP } from '@/types/cronograma.types';
import type { ActividadExterna } from '@/types/actividadExterna.types';
import type { Reporte } from '@/types/reporte.types';
import type { CeldaCarga } from './CargaRapidaCelda';

interface Props {
  celda: CeldaCarga;
  anio: number;
  onClose: () => void;
}

const Dato: React.FC<{ etiqueta: string; children: React.ReactNode }> = ({ etiqueta, children }) => (
  <div className="d-flex gap-2 mb-1">
    <span className="text-muted" style={{ minWidth: 150 }}>{etiqueta}</span>
    <span className="flex-grow-1 text-break">{children}</span>
  </div>
);

/** Badge that opens an address in a new tab (no access to the opener). */
const InsigniaEnlace: React.FC<{ href: string; texto: string; bg?: string }> = ({ href, texto, bg = 'info' }) => (
  <Badge as="a" bg={bg} href={href} target="_blank" rel="noopener noreferrer" className="me-2 text-decoration-none" style={{ cursor: 'pointer' }}>
    {texto}
  </Badge>
);

const SinAdjunto: React.FC = () => (
  <Badge bg="secondary" aria-disabled="true" title="Esta actividad no tiene archivo ni enlace adjunto">Sin adjunto</Badge>
);

const etiquetaTipo = (a: ActividadExterna): string => {
  if (a.tipo === 'otro' && a.tipoCustom) return a.tipoCustom;
  return TIPOS_ACTIVIDAD.find((t) => t.value === a.tipo)?.label ?? a.tipo;
};

/** Summary of one external activity: its data and the badge(s) to see the file and/or the link. */
const TarjetaActividad: React.FC<{ actividad: ActividadExterna }> = ({ actividad: a }) => {
  const archivo = urlHttp(a.evidencia?.url);
  const enlace = urlHttp(a.enlace);
  const resultado = a.estadoFinal === 'otro' ? (a.estadoFinalCustom || 'Otro') : ESTADOS_FINAL_LABELS[a.estadoFinal] ?? a.estadoFinal;
  return (
    <div className="border rounded p-3 mb-2" data-testid="resumen-actividad">
      <Dato etiqueta="Tipo">{etiquetaTipo(a)}</Dato>
      <Dato etiqueta="Documento">{a.consecutivoExterno || '—'}</Dato>
      <Dato etiqueta="Fecha">{formatearFechaUtc(a.fecha)}</Dato>
      <Dato etiqueta="Proveedor">{a.proveedor || '—'}</Dato>
      <Dato etiqueta="Resultado">{resultado}</Dato>
      <Dato etiqueta="Estado operativo">{a.estadoOperativo || '—'}</Dato>
      {a.observacion && <Dato etiqueta="Observación">{a.observacion}</Dato>}
      <div className="mt-2" data-testid="resumen-evidencia">
        {archivo && <InsigniaEnlace href={archivo} texto="Ver archivo" />}
        {enlace && <InsigniaEnlace href={enlace} texto="Ver enlace" />}
        {!archivo && !enlace && <SinAdjunto />}
      </div>
    </div>
  );
};

/** Summary of one preventive service: external (evidence) or internal (link to its report page). */
const TarjetaPreventivo: React.FC<{ reporte: Reporte }> = ({ reporte: r }) => {
  const externo = r.origen === 'externo';
  const archivo = urlHttp(r.externo?.documento?.url);
  const enlace = urlHttp(r.externo?.enlace);
  const responsable = externo
    ? r.externo?.proveedor
    : r.procesadoPor?.snapshotName || [r.ResponsableMtto?.firstName, r.ResponsableMtto?.lastName].filter(Boolean).join(' ');
  const fecha = r.fechaProcesado ?? r.fechaFinalizdo;
  return (
    <div className="border rounded p-3 mb-2" data-testid="resumen-preventivo">
      <Dato etiqueta="Consecutivo">{r.consecutivo || '—'}</Dato>
      {externo && r.externo?.consecutivoDocumento && <Dato etiqueta="Documento">{r.externo.consecutivoDocumento}</Dato>}
      <Dato etiqueta="Fecha">{fecha ? formatearFechaUtc(fecha) : '—'}</Dato>
      <Dato etiqueta={externo ? 'Proveedor' : 'Responsable'}>
        {externo && <Badge bg="info" className="me-1">Externo</Badge>}
        {responsable || '—'}
      </Dato>
      <Dato etiqueta="Estado operativo">{r.estadoOperativo || '—'}</Dato>
      {(r.observacion || r.observacionEstadoFinal) && <Dato etiqueta="Observación">{r.observacion || r.observacionEstadoFinal}</Dato>}
      <div className="mt-2" data-testid="resumen-evidencia">
        {externo ? (
          <>
            {archivo && <InsigniaEnlace href={archivo} texto="Ver archivo" />}
            {enlace && <InsigniaEnlace href={enlace} texto="Ver enlace" />}
            {!archivo && !enlace && <SinAdjunto />}
          </>
        ) : (
          r._id ? <InsigniaEnlace href={`/reports/${r._id}/view`} texto="Ver reporte" bg="primary" /> : <SinAdjunto />
        )}
      </div>
    </div>
  );
};

const Estado: React.FC<{ cargando: boolean; error: boolean; vacio: boolean; children: React.ReactNode }> = ({ cargando, error, vacio, children }) => {
  if (cargando) return <div className="text-center py-4"><Spinner animation="border" role="status" aria-label="Cargando el detalle" /></div>;
  if (error) return <Alert variant="danger" className="mb-0">No se pudo cargar el detalle de la actividad.</Alert>;
  if (vacio) return <Alert variant="secondary" className="mb-0">El detalle no está disponible para este mes.</Alert>;
  return <>{children}</>;
};

const ResumenExterna: React.FC<Props> = ({ celda, anio }) => {
  const { data, isLoading, isError } = useActividadesExternasPorEquipo(celda.equipo._id);
  const actividades = actividadesDeCelda(data?.data, celda.fila.cadena!.cadenaId, celda.mes, anio);
  return (
    <Estado cargando={isLoading} error={isError} vacio={actividades.length === 0}>
      {actividades.map((a) => <TarjetaActividad key={a._id} actividad={a} />)}
    </Estado>
  );
};

const ResumenPreventivo: React.FC<Props> = ({ celda, anio }) => {
  // Explicit limit: an old month must not fall out of a short default page (the equipment record shows them all).
  const { data, isLoading, isError } = useReportesByEquipo(celda.equipo._id, { page: 1, limit: 1000 });
  const reportes = preventivosDeCelda(data?.data as Reporte[] | undefined, celda.mes, anio);
  return (
    <Estado cargando={isLoading} error={isError} vacio={reportes.length === 0}>
      {reportes.map((r) => <TarjetaPreventivo key={r._id ?? r.consecutivo} reporte={r} />)}
    </Estado>
  );
};

/**
 * Read-only summary of a DONE cell of the schedule (change: cronograma-carga-rapida). It loads the detail from the
 * endpoints the equipment record already uses, only while it is open. There is nothing to edit or save.
 */
const ResumenCeldaRealizada: React.FC<Props> = (props) => {
  const { celda, anio, onClose } = props;
  return (
    <Modal show onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Resumen — {celda.fila.titulo} de {MESES_MAP[celda.mes]} {anio}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {celda.fila.tipo === 'externa' && celda.fila.cadena ? <ResumenExterna {...props} /> : <ResumenPreventivo {...props} />}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ResumenCeldaRealizada;
