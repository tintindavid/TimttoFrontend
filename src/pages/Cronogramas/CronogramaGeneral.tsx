import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Form, Card, Alert, Spinner, Badge, Table, Button } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import Select, { MultiValue } from 'react-select';
import { FaCheckCircle, FaCalendarAlt, FaFilter, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Cronograma.css';

// Services
import { equipoItemService } from '@/services/equipoItem.service';

// Tipos
import { Mes, MESES, MESES_MAP } from '@/types/cronograma.types';

// Mapa de Mes a formato minúsculas para el endpoint
const MES_TO_ENDPOINT: Record<Mes, string> = {
  'Ene': 'ene',
  'Feb': 'feb',
  'Mar': 'mar',
  'Abr': 'abr',
  'May': 'may',
  'Jun': 'jun',
  'Jul': 'jul',
  'Ago': 'ago',
  'Sep': 'sep',
  'Oct': 'oct',
  'Nov': 'nov',
  'Dic': 'dic'
};

// Mapa inverso: mes número a Mes
const NUMERO_TO_MES: Record<number, Mes> = {
  0: 'Ene',
  1: 'Feb',
  2: 'Mar',
  3: 'Abr',
  4: 'May',
  5: 'Jun',
  6: 'Jul',
  7: 'Ago',
  8: 'Sep',
  9: 'Oct',
  10: 'Nov',
  11: 'Dic'
};

/**
 * Obtener mes actual
 */
const getMesActual = (): Mes => {
  const mesNumero = new Date().getMonth(); // 0-11
  return NUMERO_TO_MES[mesNumero];
};

/**
 * Tab 2: Cronograma General
 * Muestra equipos organizados por Cliente → Servicio → Sede → Equipos
 * Filtrado por mes
 */
export const CronogramaGeneral: React.FC = () => {
  const navigate = useNavigate();
  const mesActual = getMesActual();
  
  const [mesSeleccionado, setMesSeleccionado] = useState<Mes>(mesActual);
  
  // Estados de filtros
  const [clientesFiltrados, setClientesFiltrados] = useState<string[]>([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState<string[]>([]);
  const [sedesFiltradas, setSedesFiltradas] = useState<string[]>([]);

  // Query para obtener equipos por mes
  const { data: cronogramaData, isLoading, error } = useQuery({
    queryKey: ['cronograma-mes', MES_TO_ENDPOINT[mesSeleccionado]],
    queryFn: () => equipoItemService.getByMes(MES_TO_ENDPOINT[mesSeleccionado]),
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  });

  // Extraer clientes del response
  // Estructura: { success, message, data: { mes, totalEquipos, data: [...clientes] } }
  const clientes = useMemo(() => {
    if (!cronogramaData?.data?.data) return [];
    
    // Debug: ver estructura de la respuesta
    console.log('cronogramaData completo:', cronogramaData);
    console.log('Array de clientes:', cronogramaData.data.data);
    
    // El array de clientes está en data.data
    if (Array.isArray(cronogramaData.data.data)) {
      return cronogramaData.data.data;
    }
    
    // Caso por defecto: retornar array vacío
    console.warn('Estructura de respuesta inesperada:', cronogramaData);
    return [];
  }, [cronogramaData]);

  // Calcular totales
  const stats = useMemo(() => {
    let totalEquipos = 0;
    let totalClientes = clientes.length;
    
    if (Array.isArray(clientes)) {
      clientes.forEach((item: any) => {
        // item tiene { cliente: {...}, servicios: [...] }
        item.servicios?.forEach((servicioItem: any) => {
          // servicioItem tiene { servicio: {...}, sedes: [...] }
          servicioItem.sedes?.forEach((sedeItem: any) => {
            // sedeItem tiene { sede: {...}, equipos: [...] }
            totalEquipos += sedeItem.equipos?.length || 0;
          });
        });
      });
    }

    return { totalEquipos, totalClientes };
  }, [clientes]);

  // Extraer opciones de filtros desde los datos (ordenadas alfabéticamente)
  const clienteOptions = useMemo(() => {
    if (!Array.isArray(clientes)) return [];
    
    return clientes
      .map((item: any) => ({
        value: item.cliente._id,
        label: item.cliente.Razonsocial || item.cliente.Nit
      }))
      .sort((a, b) => a.label.toUpperCase().localeCompare(b.label.toUpperCase()));
  }, [clientes]);

  const servicioOptions = useMemo(() => {
    if (!Array.isArray(clientes)) return [];
    
    const serviciosSet = new Set<string>();
    const serviciosMap = new Map<string, any>();
    
    clientes.forEach((item: any) => {
      // Si hay clientes filtrados, solo tomar servicios de esos clientes
      if (clientesFiltrados.length > 0 && !clientesFiltrados.includes(item.cliente._id)) {
        return;
      }
      
      item.servicios?.forEach((servicioItem: any) => {
        const servicioId = servicioItem.servicio._id;
        if (!serviciosSet.has(servicioId)) {
          serviciosSet.add(servicioId);
          serviciosMap.set(servicioId, servicioItem.servicio);
        }
      });
    });
    
    return Array.from(serviciosMap.entries())
      .map(([id, servicio]) => ({
        value: id,
        label: servicio.nombre
      }))
      .sort((a, b) => a.label.toUpperCase().localeCompare(b.label.toUpperCase()));
  }, [clientes, clientesFiltrados]);

  const sedeOptions = useMemo(() => {
    if (!Array.isArray(clientes)) return [];
    
    const sedesSet = new Set<string>();
    const sedesMap = new Map<string, any>();
    
    clientes.forEach((item: any) => {
      // Si hay clientes filtrados, solo tomar sedes de esos clientes
      if (clientesFiltrados.length > 0 && !clientesFiltrados.includes(item.cliente._id)) {
        return;
      }
      
      item.servicios?.forEach((servicioItem: any) => {
        // Si hay servicios filtrados, solo tomar sedes de esos servicios
        if (serviciosFiltrados.length > 0 && !serviciosFiltrados.includes(servicioItem.servicio._id)) {
          return;
        }
        
        servicioItem.sedes?.forEach((sedeItem: any) => {
          const sedeId = sedeItem.sede._id;
          if (!sedesSet.has(sedeId)) {
            sedesSet.add(sedeId);
            sedesMap.set(sedeId, sedeItem.sede);
          }
        });
      });
    });
    
    return Array.from(sedesMap.entries())
      .map(([id, sede]) => ({
        value: id,
        label: sede.nombreSede
      }))
      .sort((a, b) => a.label.toUpperCase().localeCompare(b.label.toUpperCase()));
  }, [clientes, clientesFiltrados, serviciosFiltrados]);

  // Filtrar datos según selecciones
  const clientesFiltradosData = useMemo(() => {
    if (!Array.isArray(clientes)) return [];
    
    return clientes
      .map((item: any) => {
        // Crear una copia profunda del item para no mutar el original
        const itemCopy = { ...item, cliente: { ...item.cliente } };
        
        // Filtro por cliente
        if (clientesFiltrados.length > 0 && !clientesFiltrados.includes(item.cliente._id)) {
          return null;
        }
        
        // Filtrar servicios del cliente
        if (item.servicios) {
          const serviciosFiltradosArray = item.servicios
            .map((servicioItem: any) => {
              // Crear copia del servicio
              const servicioItemCopy = { ...servicioItem, servicio: { ...servicioItem.servicio } };
              
              // Filtro por servicio
              if (serviciosFiltrados.length > 0 && !serviciosFiltrados.includes(servicioItem.servicio._id)) {
                return null;
              }
              
              // Filtrar sedes del servicio
              if (servicioItem.sedes) {
                const sedesFiltradosArray = servicioItem.sedes
                  .map((sedeItem: any) => {
                    // Filtro por sede
                    if (sedesFiltradas.length > 0 && !sedesFiltradas.includes(sedeItem.sede._id)) {
                      return null;
                    }
                    return sedeItem;
                  })
                  .filter((s: any) => s !== null);
                
                // Solo mantener el servicio si tiene sedes que coinciden (o no hay filtro de sedes)
                if (sedesFiltradas.length > 0 && sedesFiltradosArray.length === 0) {
                  return null;
                }
                
                // Actualizar las sedes del servicio con las filtradas
                servicioItemCopy.sedes = sedesFiltradosArray;
              }
              
              return servicioItemCopy;
            })
            .filter((s: any) => s !== null);
          
          // Solo mantener el cliente si tiene servicios que coinciden (o no hay filtro de servicios)
          if ((serviciosFiltrados.length > 0 || sedesFiltradas.length > 0) && serviciosFiltradosArray.length === 0) {
            return null;
          }
          
          // Actualizar los servicios del cliente con los filtrados
          itemCopy.servicios = serviciosFiltradosArray;
        }
        
        return itemCopy;
      })
      .filter((item: any) => item !== null);
  }, [clientes, clientesFiltrados, serviciosFiltrados, sedesFiltradas]);

  // Recalcular stats con datos filtrados
  const filteredStats = useMemo(() => {
    let totalEquipos = 0;
    let totalClientes = clientesFiltradosData.length;
    
    clientesFiltradosData.forEach((item: any) => {
      item.servicios?.forEach((servicioItem: any) => {
        servicioItem.sedes?.forEach((sedeItem: any) => {
          totalEquipos += sedeItem.equipos?.length || 0;
        });
      });
    });

    return { totalEquipos, totalClientes };
  }, [clientesFiltradosData]);

  // Limpiar filtros
  const limpiarFiltros = () => {
    setClientesFiltrados([]);
    setServiciosFiltrados([]);
    setSedesFiltradas([]);
  };

  return (
    <div className="cronograma-general">
      {/* Header con mes seleccionado */}
      <Card className="mb-4 shadow-sm border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Card.Body className="text-white">
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center">
                <FaCalendarAlt size={40} className="me-3" />
                <div>
                  <h2 className="mb-0 fw-bold">
                    {MESES_MAP[mesSeleccionado]}
                  </h2>
                  <p className="mb-0 opacity-75">
                    Cronograma de Mantenimiento {mesSeleccionado === mesActual && (
                      <Badge bg="light" text="dark" className="ms-2">Mes Actual</Badge>
                    )}
                  </p>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="text-white small mb-1">Seleccionar mes:</Form.Label>
                <Form.Select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value as Mes)}
                  size="lg"
                  className="shadow-sm"
                >
                  {MESES.map(mes => (
                    <option key={mes} value={mes}>
                      {MESES_MAP[mes]} {mes === mesActual && '(Actual)'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Sección de Filtros */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <FaFilter className="text-primary me-2" />
              <h5 className="mb-0 fw-bold">Filtros</h5>
            </div>
            {(clientesFiltrados.length > 0 || serviciosFiltrados.length > 0 || sedesFiltradas.length > 0) && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={limpiarFiltros}
              >
                <FaTimes className="me-1" />
                Limpiar Filtros
              </Button>
            )}
          </div>
          
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Clientes</Form.Label>
                <Select
                  isMulti
                  options={clienteOptions}
                  value={clienteOptions.filter(opt => clientesFiltrados.includes(opt.value))}
                  onChange={(selected: MultiValue<{ value: string; label: string }>) => {
                    setClientesFiltrados(selected.map(s => s.value));
                    // Limpiar filtros dependientes
                    setServiciosFiltrados([]);
                    setSedesFiltradas([]);
                  }}
                  placeholder="Todos los clientes"
                  isSearchable
                  isClearable
                  noOptionsMessage={() => 'No hay clientes'}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Servicios</Form.Label>
                <Select
                  isMulti
                  options={servicioOptions}
                  value={servicioOptions.filter(opt => serviciosFiltrados.includes(opt.value))}
                  onChange={(selected: MultiValue<{ value: string; label: string }>) => {
                    setServiciosFiltrados(selected.map(s => s.value));
                    // Limpiar filtros dependientes
                    setSedesFiltradas([]);
                  }}
                  placeholder="Todos los servicios"
                  isSearchable
                  isClearable
                  noOptionsMessage={() => 'No hay servicios'}
                  isDisabled={clientesFiltrados.length === 0}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Sedes</Form.Label>
                <Select
                  isMulti
                  options={sedeOptions}
                  value={sedeOptions.filter(opt => sedesFiltradas.includes(opt.value))}
                  onChange={(selected: MultiValue<{ value: string; label: string }>) => {
                    setSedesFiltradas(selected.map(s => s.value));
                  }}
                  placeholder="Todas las sedes"
                  isSearchable
                  isClearable
                  noOptionsMessage={() => 'No hay sedes'}
                  isDisabled={serviciosFiltrados.length === 0}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </Form.Group>
            </Col>
          </Row>
          
          {(clientesFiltrados.length > 0 || serviciosFiltrados.length > 0 || sedesFiltradas.length > 0) && (
            <div className="mt-2">
              <small className="text-muted">
                Filtros activos: 
                {clientesFiltrados.length > 0 && <Badge bg="primary" className="ms-2">{clientesFiltrados.length} cliente(s)</Badge>}
                {serviciosFiltrados.length > 0 && <Badge bg="info" className="ms-2">{serviciosFiltrados.length} servicio(s)</Badge>}
                {sedesFiltradas.length > 0 && <Badge bg="success" className="ms-2">{sedesFiltradas.length} sede(s)</Badge>}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Estadísticas */}
      {!isLoading && clientes.length > 0 && (
        <Row className="mb-4">
          <Col md={6}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">Total Clientes</h6>
                  <h3 className="mb-0 fw-bold text-primary">{filteredStats.totalClientes}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                  <FaCheckCircle size={30} className="text-primary" />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">Total Equipos</h6>
                  <h3 className="mb-0 fw-bold text-success">{filteredStats.totalEquipos}</h3>
                </div>
                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                  <FaCheckCircle size={30} className="text-success" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Contenido */}
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando cronograma de {MESES_MAP[mesSeleccionado]}...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          <Alert.Heading>Error al cargar datos</Alert.Heading>
          <p>No se pudo cargar el cronograma del mes seleccionado</p>
        </Alert>
      ) : clientesFiltradosData.length === 0 ? (
        <Alert variant="info" className="text-center">
          <Alert.Heading>Sin Equipos</Alert.Heading>
          <p>
            {clientes.length === 0 
              ? `No hay equipos programados para mantenimiento en ${MESES_MAP[mesSeleccionado]}`
              : 'No hay equipos que coincidan con los filtros seleccionados'
            }
          </p>
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="cronograma-grid-container">
              <Table bordered hover className="cronograma-grid mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: '150px' }}>Item</th>
                    <th style={{ minWidth: '110px' }}>Marca</th>
                    <th style={{ minWidth: '100px' }}>Modelo</th>
                    <th style={{ minWidth: '90px' }}>Serie</th>
                    <th style={{ minWidth: '90px' }}>Inventario</th>
                    <th style={{ minWidth: '120px' }}>Ubicación</th>
                    <th style={{ minWidth: '70px' }}>Estado</th>
                    <th style={{ minWidth: '60px' }}>Riesgo</th>
                    <th style={{ minWidth: '80px' }}>Invima</th>
                    
                    {MESES.map(mes => {
                      const isMesActual = mes === mesActual;
                      const isMesSeleccionado = mes === mesSeleccionado;
                      
                      return (
                        <th 
                          key={mes} 
                          className="text-center mes-header" 
                          style={{ 
                            width: '50px',
                            backgroundColor: isMesActual ? '#e3f2fd' : isMesSeleccionado ? '#fff3cd' : undefined,
                            fontWeight: (isMesActual || isMesSeleccionado) ? 'bold' : undefined,
                            color: isMesActual ? '#1976d2' : isMesSeleccionado ? '#856404' : undefined
                          }}
                        >
                          {mes}
                          {isMesActual && <div style={{ fontSize: '0.65rem' }}>Actual</div>}
                          {isMesSeleccionado && !isMesActual && <div style={{ fontSize: '0.65rem' }}>Selec.</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltradosData.map((item: any, idx: number) => (
                    <React.Fragment key={item.cliente?._id || idx}>
                      {/* Header de Cliente */}
                      <tr className="table-primary">
                        <td colSpan={9 + MESES.length} className="fw-bold py-2">
                          <span className="fs-6">📋 Cliente: {item.cliente?.Razonsocial || 'Sin nombre'}</span>
                          {item.cliente?.Nit && <span className="text-muted ms-2">({item.cliente.Nit})</span>}
                        </td>
                      </tr>

                      {/* Servicios */}
                      {item.servicios?.map((servicioItem: any, sIdx: number) => (
                        <React.Fragment key={`${item.cliente?._id}-${servicioItem.servicio?._id || sIdx}`}>
                          {servicioItem.sedes?.map((sedeItem: any, seIdx: number) => (
                            <React.Fragment key={`${item.cliente?._id}-${servicioItem.servicio?._id}-${sedeItem.sede?._id || seIdx}`}>
                              {/* Header de Servicio/Sede */}
                              <tr className="grupo-row">
                                <td colSpan={9 + MESES.length} className="grupo">
                                  Servicio: {servicioItem.servicio?.nombre || 'Sin servicio'} | Sede: {sedeItem.sede?.nombreSede || 'Sin sede'}
                                </td>
                              </tr>

                              {/* Equipos */}
                              {sedeItem.equipos?.map((equipo: any) => {
                                const itemName = equipo.ItemId?.Nombre || 'N/A';
                                
                                return (
                                  <tr key={equipo._id}>
                                    <td>
                                      <small 
                                        className="text-truncate d-block"
                                        title={itemName}
                                        onClick={() => navigate(`/hv-equipo/${equipo._id}`)}
                                        style={{ cursor: 'pointer', color: '#0d6efd' }}
                                      >
                                        {itemName}
                                      </small>
                                    </td>
                                    <td><small>{equipo.Marca || '-'}</small></td>
                                    <td><small>{equipo.Modelo || '-'}</small></td>
                                    <td><small>{equipo.Serie || '-'}</small></td>
                                    <td><small>{equipo.Inventario || '-'}</small></td>
                                    <td><small>{equipo.Ubicacion || '-'}</small></td>
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
                                    <td><small>{equipo.Riesgo || 'N/A'}</small></td>
                                    <td><small>{equipo.Invima || 'N/A'}</small></td>

                                    {/* Meses */}
                                    {MESES.map(mes => {
                                      const tieneMtto = equipo.mesesMtto?.some((m: string) => 
                                        m.toLowerCase() === mes.toLowerCase()
                                      ) || false;
                                      const isMesActual = mes === mesActual;
                                      const isMesSeleccionado = mes === mesSeleccionado;

                                      return (
                                        <td 
                                          key={mes} 
                                          className={`text-center mes-cell ${tieneMtto ? 'tiene-mtto' : ''}`}
                                          style={{
                                            backgroundColor: isMesActual 
                                              ? (tieneMtto ? '#c8e6c9' : '#e3f2fd') 
                                              : isMesSeleccionado 
                                              ? (tieneMtto ? '#c8e6c9' : '#fff3cd') 
                                              : tieneMtto 
                                              ? 'rgba(40, 167, 69, 0.15)' 
                                              : '#fff'
                                          }}
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
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};
