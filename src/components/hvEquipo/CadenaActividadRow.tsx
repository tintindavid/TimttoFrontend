import React from 'react';
import { Accordion, Badge, Table, Button } from 'react-bootstrap';
import type { ActividadExterna, CadenaConActividades } from '@/types/actividadExterna.types';
import { TIPOS_ACTIVIDAD, ESTADOS_FINAL_LABELS } from '@/constants/actividadExterna';

interface Props {
  grupo: CadenaConActividades;
  onCerrar: (cadenaId: string) => void;
  onRemove: (actividadId: string) => void;
  /** Opens the "Cambiar proveedor" dialog; the action is hidden when not provided. */
  onCambiarProveedor?: (actividad: ActividadExterna) => void;
}

const HTTP_URL = /^https?:\/\//i;

// Defense in depth over backend validation: only http(s) URLs become hrefs.
const safeUrl = (url?: string | null): string | null => (url && HTTP_URL.test(url) ? url : null);

const labelTipo = (t: string) => TIPOS_ACTIVIDAD.find((x) => x.value === t)?.label ?? t;

const estaVencida = (iso?: string | null) => (iso ? new Date(iso).getTime() < Date.now() : false);

const CadenaActividadRow: React.FC<Props> = ({ grupo, onCerrar, onRemove, onCambiarProveedor }) => {
  const { cadena, actividades } = grupo;
  const [badgeBg, badgeText]: [string, string] =
    cadena.estado === 'vigente'
      ? cadena.esUnica
        ? ['secondary', 'única']
        : estaVencida(cadena.fechaProxima)
          ? ['warning', 'vencida']
          : ['success', 'vigente']
      : ['secondary', cadena.estado.replace(/_/g, ' ')];

  const descriptor = `${labelTipo(cadena.tipo)}${cadena.tipoCustom ? ` · ${cadena.tipoCustom}` : ''}`;

  const renderEvidencia = (a: (typeof actividades)[number]) => {
    const evUrl = safeUrl(a.evidencia?.url);
    if (evUrl) {
      return (
        <a href={evUrl} target="_blank" rel="noopener noreferrer">
          {a.evidencia?.nombreOriginal || 'Evidencia'}
        </a>
      );
    }
    const enlace = safeUrl(a.enlace);
    if (enlace) {
      return (
        <a href={enlace} target="_blank" rel="noopener noreferrer">
          Enlace
        </a>
      );
    }
    return '—';
  };

  return (
    <Accordion.Item eventKey={cadena._id}>
      <Accordion.Header>
        <div className="d-flex align-items-center gap-2 flex-grow-1">
          <strong>{descriptor}</strong>
          <Badge bg={badgeBg}>{badgeText}</Badge>
          {cadena.fechaProxima && (
            <small className="text-muted ms-auto me-2">próxima: {cadena.fechaProxima.slice(0, 10)}</small>
          )}
        </div>
      </Accordion.Header>
      <Accordion.Body>
        <Table size="sm" hover responsive>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Consecutivo</th>
              <th>Estado final</th>
              <th>Evidencia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {actividades.map((a) => (
              <tr key={a._id}>
                <td>{a.fecha.slice(0, 10)}</td>
                <td>
                  {a.proveedor}
                  {a.proveedorId && <Badge bg="light" text="dark" className="ms-1" title="Vinculado a un proveedor registrado">vinculado</Badge>}
                </td>
                <td>{a.consecutivoExterno}</td>
                <td>{ESTADOS_FINAL_LABELS[a.estadoFinal]}</td>
                <td>{renderEvidencia(a)}</td>
                <td>
                  {onCambiarProveedor && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-1"
                      aria-label={`Cambiar proveedor de ${a.consecutivoExterno}`}
                      onClick={() => onCambiarProveedor(a)}
                    >
                      Cambiar proveedor
                    </Button>
                  )}
                  {!a.cerradaAt && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      aria-label={`Eliminar actividad ${a.consecutivoExterno}`}
                      onClick={() => onRemove(a._id)}
                    >
                      Eliminar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {cadena.estado === 'vigente' && (
          <Button size="sm" variant="outline-secondary" onClick={() => onCerrar(cadena._id)}>
            Cerrar cadena manualmente
          </Button>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default CadenaActividadRow;
