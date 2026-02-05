import React, { useState } from 'react';
import { Container, Row, Col, Button, Spinner, Card, Alert, Badge, ProgressBar, Dropdown } from 'react-bootstrap';
import { useOTs, useDeleteOt } from '@/hooks/useOTs';
import DataTable from '@/components/common/DataTable';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash, FaPlay, FaUserPlus, FaBan, FaEllipsisV, FaPause, FaCheckCircle, FaRedo } from 'react-icons/fa';

const OTsPage: React.FC = () => {
  const [page] = useState(1);
  const { data, isLoading, error } = useOTs({ page, limit: 100 });
  const deleteMutation = useDeleteOt();
  const navigate = useNavigate();

  console.log('OTsPage data:', data);
  
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirma eliminar esta OT?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleAssignResponsible = (id: string) => {
    // TODO: Implementar modal para asignar responsable
    console.log('Asignar responsable a OT:', id);
  };

  const handleStartOT = (id: string) => {
    // TODO: Implementar inicio de OT
    console.log('Iniciar OT:', id);
  };

  const handlePauseOT = (id: string) => {
    // TODO: Implementar pausa de OT
    console.log('Pausar OT:', id);
  };

  const handleCompleteOT = (id: string) => {
    // TODO: Implementar finalización de OT
    console.log('Finalizar OT:', id);
  };

  const handleCancelOT = (id: string) => {
    if (window.confirm('¿Está seguro de cancelar esta OT?')) {
      // TODO: Implementar cancelación de OT
      console.log('Cancelar OT:', id);
    }
  };

  const handleReopenOT = (id: string) => {
    // TODO: Implementar reapertura de OT
    console.log('Reabrir OT:', id);
  };

  // Función para obtener el color del badge según el estado
  const getEstadoBadge = (estado: string) => {
    const estadoLower = estado?.toLowerCase() || '';
    
    if (estadoLower.includes('pendiente') || estadoLower.includes('creada')) {
      return <Badge bg="warning" text="dark">⏳ {estado}</Badge>;
    }
    if (estadoLower.includes('proceso') || estadoLower.includes('en curso')) {
      return <Badge bg="primary">🔄 {estado}</Badge>;
    }
    if (estadoLower.includes('pausada') || estadoLower.includes('detenida')) {
      return <Badge bg="secondary">⏸️ {estado}</Badge>;
    }
    if (estadoLower.includes('completada') || estadoLower.includes('finalizada') || estadoLower.includes('cerrada')) {
      return <Badge bg="success">✅ {estado}</Badge>;
    }
    if (estadoLower.includes('cancelada')) {
      return <Badge bg="danger">❌ {estado}</Badge>;
    }
    return <Badge bg="info">{estado}</Badge>;
  };

  // Función para obtener el color de la prioridad
  const getPrioridadBadge = (prioridad: string) => {
    const prioridadLower = prioridad?.toLowerCase() || '';
    
    if (prioridadLower.includes('alta') || prioridadLower.includes('urgente')) {
      return <Badge bg="danger" className="me-1">⚠️ Alta</Badge>;
    }
    if (prioridadLower.includes('media') || prioridadLower.includes('normal')) {
      return <Badge bg="warning" text="dark" className="me-1">📊 Media</Badge>;
    }
    if (prioridadLower.includes('baja')) {
      return <Badge bg="secondary" className="me-1">⬇️ Baja</Badge>;
    }
    return prioridad ? <Badge bg="secondary" className="me-1">{prioridad}</Badge> : null;
  };

  const columns = [
    { 
      key: 'Consecutivo', 
      label: 'N° OT',
      render: (row: any) => (
        <span className="fw-bold text-primary">{row.Consecutivo || row.numeroOT || 'N/A'}</span>
      )
    },
    { 
      key: 'ClienteId', 
      label: 'Cliente',
      render: (row: any) => {
        // Si ClienteId es un objeto (poblado), mostrar Razonsocial
        if (typeof row.ClienteId === 'object' && row.ClienteId?.Razonsocial) {
          return (
            <div>
              <div className="fw-bold">{row.ClienteId.Razonsocial}</div>
              <small className="text-muted">{row.ClienteId.Ciudad || ''}</small>
            </div>
          );
        }
        // Si es un string, mostrarlo directamente
        return row.ClienteId || 'Sin cliente';
      }
    },
    {
      key: 'TipoServicio',
      label: 'Tipo Servicio',
      render: (row: any) => (
        <Badge bg="info" className="text-wrap">
          {row.TipoServicio || row.tipoMantenimiento || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'OtPrioridad',
      label: 'Prioridad',
      render: (row: any) => getPrioridadBadge(row.OtPrioridad || row.urgencia || '')
    },
    { 
      key: 'EstadoOt', 
      label: 'Estado',
      render: (row: any) => getEstadoBadge(row.EstadoOt || 'Pendiente')
    },
    {
      key: 'Avance',
      label: 'Avance',
      render: (row: any) => {
        const avance = typeof row.Avance === 'number' ? row.Avance : parseInt(row.Avance || '0');
        const variant = avance < 30 ? 'danger' : avance < 70 ? 'warning' : 'success';
        
        return (
          <div style={{ minWidth: '120px' }}>
            <ProgressBar 
              now={avance} 
              label={`${avance}%`}
              variant={variant}
              style={{ height: '20px' }}
            />
          </div>
        );
      }
    },
    {
      key: 'FechaCreacion',
      label: 'Fecha Creación',
      render: (row: any) => {
        const fecha = row.FechaCreacion || row.createdAt;
        return fecha ? new Date(fecha).toLocaleDateString('es-ES') : 'N/A';
      }
    },
  ];

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Órdenes de Trabajo</h1>
          <p className="text-muted">Listado de órdenes de trabajo</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/ots/new')}>Crear OT</Button>
        </Col>
      </Row>

      {isLoading && <div className="d-flex justify-content-center my-4"><Spinner animation="border" variant="primary" /></div>}
      {Boolean(error) && <Alert variant="danger">Error al cargar las OTs.</Alert>}

      {data && (
        <Card className="tt-card">
          <Card.Body>
            <DataTable
              data={data.data}
              columns={columns}
              actions={(row: any) => {
                const estado = row.EstadoOt?.toLowerCase() || 'pendiente';
                const isPendiente = estado.includes('pendiente') || estado.includes('creada');
                const isEnProceso = estado.includes('proceso') || estado.includes('en curso');
                const isPausada = estado.includes('pausada');
                const isCompletada = estado.includes('completada') || estado.includes('finalizada') || estado.includes('cerrada');
                const isCancelada = estado.includes('cancelada');

                return (
                  <Dropdown align="end">
                    <Dropdown.Toggle 
                      variant="outline-secondary" 
                      size="sm" 
                      id={`dropdown-${row._id}`}
                      className="border-0"
                    >
                      <FaEllipsisV />
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      {/* Siempre disponible */}
                      <Dropdown.Item onClick={() => navigate(`/ots/${row._id}`)}>
                        <FaEye className="me-2" />
                        Ver Detalles
                      </Dropdown.Item>

                      <Dropdown.Divider />

                      {/* Acciones para OT Pendiente */}
                      {isPendiente && (
                        <>
                          <Dropdown.Item onClick={() => handleAssignResponsible(row._id)}>
                            <FaUserPlus className="me-2 text-primary" />
                            Asignar Responsable
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleStartOT(row._id)}>
                            <FaPlay className="me-2 text-success" />
                            Iniciar OT
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => navigate(`/ots/${row._id}/edit`)}>
                            <FaEdit className="me-2 text-warning" />
                            Editar
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            onClick={() => handleCancelOT(row._id)}
                            className="text-danger"
                          >
                            <FaBan className="me-2" />
                            Cancelar OT
                          </Dropdown.Item>
                        </>
                      )}

                      {/* Acciones para OT En Proceso */}
                      {isEnProceso && (
                        <>
                          <Dropdown.Item onClick={() => handlePauseOT(row._id)}>
                            <FaPause className="me-2 text-warning" />
                            Pausar OT
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleCompleteOT(row._id)}>
                            <FaCheckCircle className="me-2 text-success" />
                            Finalizar OT
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => navigate(`/ots/${row._id}/edit`)}>
                            <FaEdit className="me-2 text-warning" />
                            Editar
                          </Dropdown.Item>
                        </>
                      )}

                      {/* Acciones para OT Pausada */}
                      {isPausada && (
                        <>
                          <Dropdown.Item onClick={() => handleStartOT(row._id)}>
                            <FaPlay className="me-2 text-success" />
                            Reanudar OT
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            onClick={() => handleCancelOT(row._id)}
                            className="text-danger"
                          >
                            <FaBan className="me-2" />
                            Cancelar OT
                          </Dropdown.Item>
                        </>
                      )}

                      {/* Acciones para OT Completada */}
                      {isCompletada && (
                        <>
                          <Dropdown.Item onClick={() => handleReopenOT(row._id)}>
                            <FaRedo className="me-2 text-primary" />
                            Reabrir OT
                          </Dropdown.Item>
                        </>
                      )}

                      {/* Acciones para OT Cancelada */}
                      {isCancelada && (
                        <>
                          <Dropdown.Item onClick={() => handleReopenOT(row._id)}>
                            <FaRedo className="me-2 text-primary" />
                            Reactivar OT
                          </Dropdown.Item>
                        </>
                      )}

                      {/* Eliminar (solo para admin o estados específicos) */}
                      {(isPendiente || isCancelada) && (
                        <>
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            onClick={() => handleDelete(row._id)}
                            className="text-danger"
                          >
                            <FaTrash className="me-2" />
                            Eliminar
                          </Dropdown.Item>
                        </>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                );
              }}
            />
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default OTsPage;
