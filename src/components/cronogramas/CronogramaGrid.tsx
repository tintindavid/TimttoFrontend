import React from 'react';
import { Table, Form, Badge, Button } from 'react-bootstrap';
import { CronogramaEquipo, MESES, GrupoServicioSede } from '@/types/cronograma.types';
import { FaCheckCircle, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface CronogramaGridProps {
  grupos: GrupoServicioSede[];
  equiposSeleccionados: string[];
  onToggleEquipo: (equipoId: string) => void;
  onEditEquipo?: (equipo: any) => void;
  mostrarCheckboxes?: boolean;
}

/**
 * Componente de matriz/grid para mostrar los equipos agrupados por servicio/sede
 */
export const CronogramaGrid: React.FC<CronogramaGridProps> = ({
  grupos,
  equiposSeleccionados,
  onToggleEquipo,
  onEditEquipo,
  mostrarCheckboxes = true
}) => {
  if (grupos.length === 0 || grupos.every(g => g.equipos.length === 0)) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No hay equipos para mostrar</p>
      </div>
    );
  }

  const navigate = useNavigate();

  console.log('Grupos a mostrar en CronogramaGrid:', grupos);
  const NUM_MESES = 12;
  const NUM_COLUMNAS_DATOS = 4; // Item, Equipo, Ubicación, Riesgo/Invima
  const NUM_COLUMNAS_ESTADO = 1; // Estado
  const NUM_COLUMNAS_ACCIONES = onEditEquipo ? 1 : 0; // Columna de acciones si hay onEditEquipo
  const totalColumnas = (mostrarCheckboxes ? 1 : 0) + NUM_COLUMNAS_DATOS + NUM_COLUMNAS_ESTADO + NUM_MESES + NUM_COLUMNAS_ACCIONES;

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
              
              {/* Equipos del grupo */}
              {grupo.equipos.map((equipo) => {
                const isSelected = equiposSeleccionados.includes(equipo._id);
                const itemName = typeof equipo.ItemId === 'object'
                  ? equipo.ItemId?.Nombre
                  : 'N/A';

                return (
                  <tr 
                    key={equipo._id} 
                    className={isSelected ? 'table-active' : ''}
                  >
                    {mostrarCheckboxes && (
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleEquipo(equipo._id)}
                        />
                      </td>
                    )}
                    <td>
                      <small 
                      className="text-truncate d-block " title={itemName}
                      onClick={() => navigate(`/hv-equipo/${equipo?._id}`)}
                      style={{ cursor: 'pointer' }}

                      >
                        {itemName}
                      </small>
                    </td>
                    <td> 
                      <div>
                        <strong className="d-block">{equipo.Marca || '-'}</strong>
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                          <strong>Mod:</strong> {equipo.Modelo || '-'} <strong>SN:</strong> {equipo.Serie || '-'} <strong>Inv:</strong> {equipo.Inventario || '-'}
                        </small>
                      </div>
                    </td>
                    <td>
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
                    <td>
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
                    <td>
                      <div>
                        <small className="d-block">{equipo.Riesgo || 'N/A'}</small>
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{equipo.Invima || 'N/A'}</small>
                      </div>
                    </td>
                    {onEditEquipo && (
                      <td className="text-center">
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
                    {MESES.map(mes => {
                      const tieneMtto = equipo.mesesMtto?.some(m => m.toLowerCase() === mes.toLowerCase()) || false;
                      return (
                        <td 
                          key={mes} 
                          className={`text-center mes-cell ${tieneMtto ? 'tiene-mtto' : ''}`}
                        >
                          {tieneMtto && (
                            <FaCheckCircle className="text-success" size={16} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
