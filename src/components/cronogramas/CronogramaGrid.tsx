import React from 'react';
import { Table, Form, Badge, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
  CronogramaEquipo,
  EstadoMesActividad,
  FilaActividad,
  GrupoServicioSede,
  MESES,
  MESES_MAP,
  Mes,
  OrigenCronograma,
} from '@/types/cronograma.types';
import { describirCadena, estadoMesExterno, estadoMesPreventivo, filasEquipo, formatearFechaUtc } from '@/utils/cronogramaExterno';
import { puedeCargarCelda } from '@/utils/cronogramaCargaRapida';
import type { CeldaCarga } from './CargaRapidaCelda';
import { FaCheckCircle, FaEdit } from 'react-icons/fa';

interface CronogramaGridProps {
  grupos: GrupoServicioSede[];
  equiposSeleccionados: string[];
  onToggleEquipo: (equipoId: string) => void;
  onEditEquipo?: (equipo: any) => void;
  mostrarCheckboxes?: boolean;
  /**
   * Quick load (cronograma-carga-rapida): when given, a cell that is due (programado/vencido, not in a future month)
   * becomes a button that calls it, and a done cell (realizado) becomes a button that asks for its read-only summary.
   * Without it the grid is read-only, exactly as before (General schedule).
   */
  onCargarCelda?: (celda: CeldaCarga) => void;
  /** Permission of the user for the kind of row (external activity or preventive); defaults to allowed. */
  puedeCargarFila?: (fila: FilaActividad) => boolean;
  /** Which rows to draw: preventive (MP), external activities, or both (default). */
  origen?: OrigenCronograma;
  /** Year shown for the executed/pending state of each month (default: the current year). */
  anio?: number;
}

const COLOR_ESTADO: Record<Exclude<EstadoMesActividad, null>, string> = {
  realizado: 'text-success',
  programado: 'text-secondary',
  vencido: 'text-danger',
};

const TEXTO_ESTADO: Record<Exclude<EstadoMesActividad, null>, string> = {
  realizado: 'Realizado',
  programado: 'Programado',
  vencido: 'Vencido',
};

/** State of the month cell of one row (preventive or external). */
const estadoCelda = (fila: FilaActividad, equipo: CronogramaEquipo, mes: Mes, anio: number): EstadoMesActividad =>
  fila.tipo === 'mp'
    ? estadoMesPreventivo(equipo, mes, anio)
    : estadoMesExterno(fila.cadena!, mes, anio);

/**
 * Componente de matriz/grid para mostrar los equipos agrupados por servicio/sede.
 * Cada equipo ocupa un bloque de filas: una para el preventivo (MP) y una por cada actividad externa
 * programada; las columnas del equipo se comparten con rowSpan y la columna Act identifica la actividad.
 */
export const CronogramaGrid: React.FC<CronogramaGridProps> = ({
  grupos,
  equiposSeleccionados,
  onToggleEquipo,
  onEditEquipo,
  mostrarCheckboxes = true,
  origen = 'todos',
  anio = new Date().getUTCFullYear(),
  onCargarCelda,
  puedeCargarFila,
}) => {
  if (grupos.length === 0 || grupos.every(g => g.equipos.length === 0)) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No hay equipos para mostrar</p>
      </div>
    );
  }

  const NUM_MESES = 12;
  const NUM_COLUMNAS_DATOS = 4; // Item, Equipo, Ubicación, Riesgo/Invima
  const NUM_COLUMNAS_ESTADO = 1; // Estado
  const NUM_COLUMNAS_ACCIONES = onEditEquipo ? 1 : 0; // Columna de acciones si hay onEditEquipo
  const NUM_COLUMNAS_ACT = 1; // Act
  const totalColumnas = (mostrarCheckboxes ? 1 : 0) + NUM_COLUMNAS_DATOS + NUM_COLUMNAS_ESTADO + NUM_COLUMNAS_ACCIONES + NUM_COLUMNAS_ACT + NUM_MESES;

  const renderCelda = (fila: FilaActividad, equipo: CronogramaEquipo, mes: Mes) => {
    const estado = estadoCelda(fila, equipo, mes, anio);
    if (!estado) return null;

    // A done cell only reads (summary), so it needs no permission to create; a due cell needs it and the date rule
    const esResumen = !!onCargarCelda && estado === 'realizado';
    const clicable = esResumen || (!!onCargarCelda && (puedeCargarFila ? puedeCargarFila(fila) : true) && puedeCargarCelda(estado, mes, anio, new Date(), fila));
    // A due cell becomes a button that opens the registration form of that activity (keeps the icon and its test ids)
    const conAccion = (nodo: React.ReactNode) => (clicable ? (
      <button
        type="button"
        className="btn btn-link p-0 border-0 celda-cargar"
        style={{ lineHeight: 1 }}
        data-testid="celda-cargar"
        aria-label={`${esResumen ? 'Ver resumen de' : 'Cargar'} ${fila.titulo} de ${MESES_MAP[mes]}`}
        title={esResumen ? 'Clic para ver el resumen de la actividad' : 'Clic para registrar esta actividad'}
        onClick={() => onCargarCelda!({ equipo, fila, mes, estado })}
      >
        {nodo}
      </button>
    ) : nodo);

    const icono = (
      <FaCheckCircle
        className={COLOR_ESTADO[estado]}
        size={16}
        aria-label={TEXTO_ESTADO[estado]}
        data-testid="celda-estado"
        data-estado={estado}
        data-fila={fila.tipo}
      />
    );

    if (fila.tipo === 'mp') {
      const texto = estado === 'realizado' ? 'Preventivo realizado' : 'Preventivo programado, sin reporte';
      return conAccion(<span title={clicable ? undefined : texto}>{icono}</span>);
    }

    const cadena = fila.cadena!;
    const ejecutada = cadena.realizadas.find(r => r.mes === mes.toLowerCase());
    return (
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id={`externo-${cadena.cadenaId}-${mes}`}>
            <div className="text-start">
              <div><strong>{TEXTO_ESTADO[estado]}</strong>{ejecutada ? ` el ${formatearFechaUtc(ejecutada.fecha)}` : ''}</div>
              {describirCadena(cadena).map((linea, i) => (
                <div key={i}>{linea}</div>
              ))}
            </div>
          </Tooltip>
        }
      >
        <span>{conAccion(icono)}</span>
      </OverlayTrigger>
    );
  };

  return (
    <div className="cronograma-grid-container">
      <Table bordered hover className="cronograma-grid">
        <thead className="table-light">
          <tr>
            {mostrarCheckboxes && <th style={{ width: '40px' }}></th>}
            <th style={{ minWidth: '110px' }}>Item</th>
            <th style={{ minWidth: '110px' }}>Equipo</th>
            <th style={{ minWidth: '110px' }}>Ubicación</th>
            <th style={{ minWidth: '60px' }}>Estado</th>
            <th style={{ minWidth: '90px' }}>Riesgo / Invima</th>
            {onEditEquipo && <th style={{ width: '60px', textAlign: 'center' }}>Edit</th>}
            <th style={{ width: '56px', textAlign: 'center' }} title="Actividad">Act</th>

            {MESES.map(mes => (
              <th key={mes} className="text-center mes-header" style={{ width: '50px' }}>
                {mes}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grupos.map((grupo, grupoIdx) => (
            <React.Fragment key={`grupo-${grupoIdx}`}>
              {/* Fila de encabezado del grupo */}
              <tr className="grupo-row">
                <td colSpan={totalColumnas} className="grupo">
                  Servicio / Sede: {grupo.servicio} | {grupo.sede}
                </td>
              </tr>

              {/* Equipos del grupo: un bloque de filas por equipo */}
              {grupo.equipos.map((equipo) => {
                const isSelected = equiposSeleccionados.includes(equipo._id);
                const itemName = typeof equipo.ItemId === 'object'
                  ? equipo.ItemId?.Nombre
                  : 'N/A';
                const filas = filasEquipo(equipo, origen);
                const span = filas.length;

                return (
                  <React.Fragment key={equipo._id}>
                    {filas.map((fila, filaIdx) => (
                      <tr
                        key={fila.key}
                        className={`${isSelected ? 'table-active' : ''} ${filaIdx === 0 ? 'fila-inicio-equipo' : 'fila-actividad-extra'}`}
                        data-testid="fila-actividad"
                        data-equipo={equipo._id}
                      >
                        {filaIdx === 0 && (
                          <>
                            {mostrarCheckboxes && (
                              <td className="text-center" rowSpan={span}>
                                <Form.Check
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => onToggleEquipo(equipo._id)}
                                />
                              </td>
                            )}
                            <td rowSpan={span}>
                              <small
                                className="text-truncate d-block " title={itemName}
                                onClick={() => window.open(`/hv-equipo/${equipo?._id}`, '_blank', 'noopener,noreferrer')}
                                style={{ cursor: 'pointer' }}
                              >
                                {itemName}
                              </small>
                            </td>
                            <td rowSpan={span}>
                              <div>
                                <strong className="d-block">{equipo.Marca || '-'}</strong>
                                <small className="text-muted d-block" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                                  <strong>Mod:</strong> {equipo.Modelo || '-'} <strong>SN:</strong> {equipo.Serie || '-'} <strong>Inv:</strong> {equipo.Inventario || '-'}
                                </small>
                              </div>
                            </td>
                            <td rowSpan={span}>
                              <div>
                                <strong className="d-block">{grupo.sede || '-'}</strong>
                                <small className="text-muted d-block" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                                  {typeof equipo.Servicio === 'object' && equipo.Servicio?.nombre !== 'Principal'?
                                    (equipo.Servicio?.nombre ? equipo.Servicio?.nombre + ' - ' + (equipo.Ubicacion || '') : equipo.Ubicacion)
                                     : equipo.Ubicacion || '-'
                                  }
                                </small>
                              </div>
                            </td>
                            <td rowSpan={span}>
                              <Badge
                                bg={
                                  equipo.EstadoOperativo === 'Operativo' ? 'success' :
                                  equipo.EstadoOperativo === 'Fuera de servicio' ? 'danger' :
                                  equipo.EstadoOperativo === 'En mantenimiento' ? 'warning' :
                                  'secondary'
                                }
                                className="badge-sm"
                              >
                                {equipo.EstadoOperativo || 'N/A'}
                              </Badge>
                            </td>
                            <td rowSpan={span}>
                              <div>
                                <small className="d-block">{equipo.Riesgo || 'N/A'}</small>
                                <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{equipo.Invima || 'N/A'}</small>
                              </div>
                            </td>
                            {onEditEquipo && (
                              <td className="text-center" rowSpan={span}>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => onEditEquipo(equipo)}
                                  title="Editar equipo"
                                >
                                  <FaEdit />
                                </Button>
                              </td>
                            )}
                          </>
                        )}
                        <td className="text-center act-cell">
                          <Badge
                            bg={fila.tipo === 'mp' ? 'success' : 'info'}
                            className="badge-sm"
                            title={fila.titulo}
                            data-testid="etiqueta-actividad"
                          >
                            {fila.etiqueta}
                          </Badge>
                        </td>
                        {MESES.map(mes => (
                          <td key={mes} className="text-center mes-cell">
                            {renderCelda(fila, equipo, mes)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
