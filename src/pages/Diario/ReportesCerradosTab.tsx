import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Badge,
  Alert,
  Row,
  Col,
  Form,
  InputGroup,
  Spinner,
} from 'react-bootstrap';
import Select from 'react-select';
import { FaEye, FaSearch, FaFilter, FaTimes, FaTools } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useClosedReportes } from '@/hooks/useReportes';
import { useCustomers } from '@/hooks/useCustomers';
import { useEquipoItems } from '@/hooks/useEquipoItems';
import { useServicios } from '@/hooks/useServicios';
import { Reporte } from '@/types/reporte.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Tab de Reportes Cerrados
 * Muestra todos los reportes de mantenimiento cerrados con filtros
 */
const ReportesCerradosTab: React.FC = () => {
  const navigate = useNavigate();

  // Estados para filtros
  const [page, setPage] = useState(1);
  const [clienteId, setClienteId] = useState('');
  const [equipoId, setEquipoId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tipoMtto, setTipoMtto] = useState('');
  const [servicio, setServicio] = useState('');

  const limit = 20;

  // Queries
  const {
    data: reportesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useClosedReportes({
    page,
    limit,
    clienteId: clienteId || undefined,
    equipoId: equipoId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    tipoMtto: tipoMtto || undefined,
    servicio: servicio || undefined,
  });

  const { data: customersData } = useCustomers();
  const { data: equiposData } = useEquipoItems({ page: 1, limit: 1000 });
  const { data: serviciosData } = useServicios();

  // Opciones para selects
  const customerOptions = useMemo(() => {
    if (!customersData?.data) return [];
    return [...customersData.data]
      .sort((a, b) =>
        (a.Razonsocial || '').toUpperCase().localeCompare((b.Razonsocial || '').toUpperCase())
      )
      .map((c) => ({
        value: c._id!,
        label: c.Razonsocial || 'Sin nombre',
      }));
  }, [customersData?.data]);

  const equipoOptions = useMemo(() => {
    if (!equiposData?.data) return [];
    return [...equiposData.data]
      .sort((a, b) =>
        (a.ItemId?.Nombre || '').toUpperCase().localeCompare((b.ItemId?.Nombre || '').toUpperCase())
      )
      .map((e) => ({
        value: e._id!,
        label: `${e.ItemId?.Nombre || 'Sin nombre'} - ${e.Marca || ''} ${e.Modelo || ''}`,
      }));
  }, [equiposData?.data]);

  const servicioOptions = useMemo(() => {
    if (!serviciosData?.data) return [];
    return [...serviciosData.data]
      .sort((a, b) =>
        (a.nombre || '').toUpperCase().localeCompare((b.nombre || '').toUpperCase())
      )
      .map((s) => ({
        value: s._id!,
        label: s.nombre || 'Sin nombre',
      }));
  }, [serviciosData?.data]);

  const tipoMttoOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'Preventivo', label: 'Preventivo' },
    { value: 'Correctivo', label: 'Correctivo' },
    { value: 'Calibración', label: 'Calibración' },
    { value: 'Instalación', label: 'Instalación' },
  ];

  // Verificar si hay filtros activos
  const hasActiveFilters =
    clienteId || equipoId || startDate || endDate || tipoMtto || servicio;

  // Reportes
  const reportes = reportesData?.data || [];
  const totalPages = reportesData?.pagination?.pages || 1;

  // Handlers
  const handleClearFilters = () => {
    setClienteId('');
    setEquipoId('');
    setStartDate('');
    setEndDate('');
    setTipoMtto('');
    setServicio('');
    setPage(1);
  };

  const handleViewReporte = (reporteId: string) => {
    navigate(`/reports/${reporteId}/view`);
  };

  const getEstadoOperativoColor = (estado?: string) => {
    switch (estado) {
      case 'Operativo':
        return 'success';
      case 'En Mantenimiento':
        return 'warning';
      case 'Fuera de Servicio':
        return 'danger';
      case 'Dado de Baja':
        return 'secondary';
      default:
        return 'info';
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <FaTools className="me-2" />
          Reportes de Mantenimiento Cerrados
        </h5>
      </Card.Header>
      <Card.Body>
        {/* Filtros */}
        <Card className="mb-3 border-0 bg-light">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                <FaFilter className="me-2" />
                Filtros
              </h6>
              {hasActiveFilters && (
                <Button size="sm" variant="outline-secondary" onClick={handleClearFilters}>
                  <FaTimes className="me-1" />
                  Limpiar
                </Button>
              )}
            </div>

            <Row className="g-2">
              <Col md={3}>
                <Form.Label className="small mb-1">Cliente</Form.Label>
                <Select
                  options={[{ value: '', label: 'Todos los clientes' }, ...customerOptions]}
                  value={
                    customerOptions.find((opt) => opt.value === clienteId) || {
                      value: '',
                      label: 'Todos los clientes',
                    }
                  }
                  onChange={(selected) => {
                    setClienteId(selected?.value || '');
                    setPage(1);
                  }}
                  placeholder="Seleccionar cliente..."
                  isSearchable
                  isClearable
                  noOptionsMessage={() => 'No hay clientes'}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </Col>

              <Col md={3}>
                <Form.Label className="small mb-1">Equipo</Form.Label>
                <Select
                  options={[{ value: '', label: 'Todos los equipos' }, ...equipoOptions]}
                  value={
                    equipoOptions.find((opt) => opt.value === equipoId) || {
                      value: '',
                      label: 'Todos los equipos',
                    }
                  }
                  onChange={(selected) => {
                    setEquipoId(selected?.value || '');
                    setPage(1);
                  }}
                  placeholder="Seleccionar equipo..."
                  isSearchable
                  isClearable
                  noOptionsMessage={() => 'No hay equipos'}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </Col>

              <Col md={2}>
                <Form.Label className="small mb-1">Tipo Mtto</Form.Label>
                <Form.Select size="sm" value={tipoMtto} onChange={(e) => setTipoMtto(e.target.value)}>
                  {tipoMttoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={2}>
                <Form.Label className="small mb-1">Servicio</Form.Label>
                <Select
                  options={[{ value: '', label: 'Todos' }, ...servicioOptions]}
                  value={
                    servicioOptions.find((opt) => opt.value === servicio) || {
                      value: '',
                      label: 'Todos',
                    }
                  }
                  onChange={(selected) => {
                    setServicio(selected?.value || '');
                    setPage(1);
                  }}
                  placeholder="Servicio..."
                  isSearchable
                  isClearable
                  noOptionsMessage={() => 'No hay servicios'}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </Col>

              <Col md={2}>
                <Form.Label className="small mb-1">Fecha desde</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </Col>

              <Col md={2}>
                <Form.Label className="small mb-1">Fecha hasta</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </Col>
            </Row>

            <div className="mt-2">
              <small className="text-muted">
                Mostrando {reportes.length} de {reportesData?.pagination?.total || 0} reportes cerrados
                {hasActiveFilters && ' (filtrado)'}
              </small>
            </div>
          </Card.Body>
        </Card>

        {/* Tabla de reportes */}
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <div className="mt-2 text-muted">Cargando reportes cerrados...</div>
          </div>
        ) : isError ? (
          <Alert variant="danger">
            <Alert.Heading>Error al cargar reportes</Alert.Heading>
            <p>{(error as Error)?.message || 'Ocurrió un error'}</p>
            <Button variant="outline-danger" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Alert>
        ) : reportes.length === 0 ? (
          <Alert variant="info" className="text-center">
            <FaTools size={32} className="mb-2 text-muted" />
            <div>No se encontraron reportes cerrados</div>
            <small className="text-muted">
              {hasActiveFilters
                ? 'Intenta ajustar los filtros'
                : 'No hay reportes cerrados disponibles'}
            </small>
          </Alert>
        ) : (
          <>
            <div className="table-responsive">
              <Table hover>
                <thead className="table-light">
                  <tr>
                    <th>Consecutivo</th>
                    <th>Equipo</th>
                    <th>Cliente</th>
                    <th>Tipo Mtto</th>
                    <th>Estado Operativo</th>
                    <th>Fecha Finalizado</th>
                    <th>Responsable</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.map((reporte: Reporte) => (
                    <tr key={reporte._id}>
                      <td>
                        <div className="fw-bold">
                          {reporte.consecutivo || reporte.orden?.Consecutivo || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold">{reporte.equipoSnapshot?.ItemText || 'N/A'}</div>
                        <small className="text-muted">
                          {reporte.equipoSnapshot?.Marca} {reporte.equipoSnapshot?.Modelo}
                          {reporte.equipoSnapshot?.Serie && ` - ${reporte.equipoSnapshot.Serie}`}
                        </small>
                      </td>
                      <td>
                        <div>{(reporte as any).cliente?.Razonsocial || 'N/A'}</div>
                        <small className="text-muted">{reporte.equipoSnapshot?.Sede || ''}</small>
                      </td>
                      <td>
                        <Badge bg="primary">{reporte.tipoMtto || 'N/A'}</Badge>
                      </td>
                      <td>
                        <Badge bg={getEstadoOperativoColor(reporte.estadoOperativo)}>
                          {reporte.estadoOperativo || 'N/A'}
                        </Badge>
                      </td>
                      <td>
                        {reporte.fechaFinalizado ? (
                          <>
                            {format(new Date(reporte.fechaFinalizado), 'dd/MM/yyyy', { locale: es })}
                            <div className="small text-muted">
                              {format(new Date(reporte.fechaFinalizado), 'HH:mm', { locale: es })}
                            </div>
                          </>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>
                        <div>
                          {reporte.ResponsableMtto?.firstName} {reporte.ResponsableMtto?.lastName}
                        </div>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleViewReporte(reporte._id!)}
                        >
                          <FaEye className="me-1" />
                          Ver Detalle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <div className="btn-group">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button size="sm" variant="outline-primary" disabled>
                    Página {page} de {totalPages}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ReportesCerradosTab;
