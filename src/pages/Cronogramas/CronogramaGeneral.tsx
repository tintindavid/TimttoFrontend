import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Form, Card, Alert, Spinner, Badge, InputGroup } from 'react-bootstrap';
import Select, { MultiValue } from 'react-select';
import { toast } from 'react-toastify';
import './Cronograma.css';

// Hooks
import { useCustomers } from '@/hooks/useCustomers';
import { useEquipoItems } from '@/hooks/useEquipoItems';
import { useCronograma } from '@/hooks/useCronograma';

// Componentes
import { CronogramaStatsCard } from '@/components/cronogramas/CronogramaStatsCard';
import { CronogramaAcciones } from '@/components/cronogramas/CronogramaAcciones';
import { CronogramaGrid } from '@/components/cronogramas/CronogramaGrid';
import { CronogramaPaginacion } from '@/components/cronogramas/CronogramaPaginacion';

// Tipos
import { Mes, MESES, MESES_MAP } from '@/types/cronograma.types';
import { FaFilter, FaTimes } from 'react-icons/fa';

/**
 * Tab 2: Cronograma General
 * Muestra todos los equipos operativos de todos los clientes
 * Solo visualización, sin crear OT
 */
export const CronogramaGeneral: React.FC = () => {
  // Filtros específicos del cronograma general
  const [clientesFiltrados, setClientesFiltrados] = useState<string[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Operativo');
  const [mesesFiltrados, setMesesFiltrados] = useState<Mes[]>([]);
  const [busqueda, setBusqueda] = useState('');

  // Queries
  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const customers = useMemo(() => customersData?.data || [], [customersData?.data]);

  // Obtener TODOS los equipos (sin filtro de cliente)
  const { data: equiposData, isLoading: loadingEquipos } = useEquipoItems(
    { 
      //Estado: estadoFiltro,
      limit: 1000 // Aumentar límite para cronograma general
    }
  );
  const equiposTodos = useMemo(() => equiposData?.data || [], [equiposData?.data]);

  // Filtrar equipos por clientes seleccionados
  const equiposFiltradosPorCliente = useMemo(() => {
    if (clientesFiltrados.length === 0) return equiposTodos;
    
    return equiposTodos.filter(eq => {
      const clienteId = typeof eq.ClienteId === 'object' 
        ? (eq.ClienteId as any)?._id 
        : eq.ClienteId;
      return clienteId && clientesFiltrados.includes(clienteId);
    });
  }, [equiposTodos, clientesFiltrados]);

  // Hook de cronograma
  const {
    equiposFiltrados,
    equiposPaginados,
    equiposAgrupados,
    equiposSeleccionados,
    stats,
    paginaActual,
    totalPaginas,
    equiposPorPagina,
    filtros,
    todosVisiblesSeleccionados,
    toggleEquipo,
    toggleTodosVisibles,
    limpiarSeleccion,
    actualizarFiltros,
    limpiarFiltros,
    cambiarPagina
  } = useCronograma(equiposFiltradosPorCliente);

  // Aplicar filtros adicionales
  React.useEffect(() => {
    actualizarFiltros({
      meses: mesesFiltrados.length > 0 ? mesesFiltrados : undefined,
      search: busqueda || undefined
    });
  }, [mesesFiltrados, busqueda, actualizarFiltros]);

  // Imprimir cronograma general
  const handleImprimir = useCallback(async () => {
    if (equiposFiltrados.length === 0) {
      toast.warning('No hay equipos para imprimir');
      return;
    }

    // TODO: Implementar cuando esté el endpoint
    toast.info('Endpoint de impresión pendiente de implementar');
    
    const payload = {
      equipos: equiposFiltrados.map(eq => eq._id),
      filtros: {
        ...filtros,
        clientes: clientesFiltrados,
        estado: estadoFiltro
      }
    };
    
    console.log('Payload para imprimir cronograma general:', payload);
  }, [equiposFiltrados, filtros, clientesFiltrados, estadoFiltro]);

  // Limpiar todos los filtros
  const handleLimpiarTodosFiltros = useCallback(() => {
    setClientesFiltrados([]);
    setEstadoFiltro('Operativo');
    setMesesFiltrados([]);
    setBusqueda('');
    limpiarFiltros();
  }, [limpiarFiltros]);

  // Opciones para react-select
  const customersOptions = customers.map(c => ({
    value: c._id!,
    label: `${c.Razonsocial || 'Sin nombre'} ${c.Nit ? `- ${c.Nit}` : ''}`
  }));

  const mesesOptions = MESES.map(mes => ({
    value: mes,
    label: MESES_MAP[mes]
  }));

  const estadosOptions = [
    { value: 'Operativo', label: 'Operativo' },
    { value: 'Fuera de servicio', label: 'Fuera de servicio' },
    { value: 'En mantenimiento', label: 'En mantenimiento' },
    { value: 'Baja', label: 'Baja' }
  ];

  // Contar filtros activos
  const filtrosActivos = clientesFiltrados.length + mesesFiltrados.length + (busqueda ? 1 : 0);

  // Resumen de clientes
  const clientesRepresentados = useMemo(() => {
    const clientesSet = new Set<string>();
    equiposFiltrados.forEach(eq => {
      const clienteId = typeof eq.ClienteId === 'object' 
        ? eq.ClienteId?._id 
        : eq.ClienteId;
      if (clienteId) clientesSet.add(clienteId);
    });
    return clientesSet.size;
  }, [equiposFiltrados]);

  return (
    <div className="cronograma-general">
      {/* Filtros Principales */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h6 className="mb-0">
            <FaFilter className="me-2" />
            Filtros Globales
          </h6>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            {/* Búsqueda */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="small fw-bold">Búsqueda Global</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por item, marca, modelo, serie, inventario..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    size="sm"
                  />
                  {busqueda && (
                    <InputGroup.Text 
                      as="button" 
                      onClick={() => setBusqueda('')}
                      className="btn btn-outline-secondary"
                    >
                      <FaTimes />
                    </InputGroup.Text>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>

            {/* Clientes */}
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">
                  Clientes {clientesFiltrados.length > 0 && (
                    <Badge bg="primary" pill className="ms-1">
                      {clientesFiltrados.length}
                    </Badge>
                  )}
                </Form.Label>
                <Select
                  isMulti
                  options={customersOptions}
                  value={customersOptions.filter(c => clientesFiltrados.includes(c.value))}
                  onChange={(selected: MultiValue<{ value: string; label: string }>) => setClientesFiltrados(selected.map(s => s.value))}
                  placeholder="Todos los clientes"
                  isLoading={loadingCustomers}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  noOptionsMessage={() => 'No hay clientes'}
                />
              </Form.Group>
            </Col>

            {/* Estado */}
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Estado de Equipos</Form.Label>
                <Select
                  options={estadosOptions}
                  value={estadosOptions.find(e => e.value === estadoFiltro)}
                  onChange={(selected: { value: string; label: string } | null) => setEstadoFiltro(selected?.value || 'Operativo')}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </Form.Group>
            </Col>

            {/* Meses */}
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">
                  Meses de Mantenimiento {mesesFiltrados.length > 0 && (
                    <Badge bg="primary" pill className="ms-1">
                      {mesesFiltrados.length}
                    </Badge>
                  )}
                </Form.Label>
                <Select
                  isMulti
                  options={mesesOptions}
                  value={mesesOptions.filter(m => mesesFiltrados.includes(m.value as Mes))}
                  onChange={(selected: MultiValue<{ value: string; label: string }>) => setMesesFiltrados(selected.map(s => s.value as Mes))}
                  placeholder="Todos los meses"
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </Form.Group>
            </Col>
          </Row>

          {filtrosActivos > 0 && (
            <Row className="mt-3">
              <Col>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleLimpiarTodosFiltros}
                >
                  <FaTimes className="me-1" />
                  Limpiar todos los filtros ({filtrosActivos})
                </button>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Resumen */}
      {equiposFiltrados.length > 0 && (
        <Alert variant="info" className="d-flex justify-content-between align-items-center">
          <div>
            <strong>{clientesRepresentados}</strong> cliente(s) con equipos mostrados
          </div>
          <Badge bg="info" pill className="fs-6">
            {equiposFiltrados.length} equipos
          </Badge>
        </Alert>
      )}

      {/* Contenido */}
      {loadingEquipos || loadingCustomers ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando cronograma general...</p>
        </div>
      ) : equiposTodos.length === 0 ? (
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Sin Equipos</Alert.Heading>
          <p>No hay equipos registrados en el sistema</p>
        </Alert>
      ) : equiposFiltrados.length === 0 ? (
        <Alert variant="info" className="text-center">
          <Alert.Heading>Sin Resultados</Alert.Heading>
          <p>No se encontraron equipos con los filtros aplicados</p>
        </Alert>
      ) : (
        <>
          {/* Estadísticas */}
          <CronogramaStatsCard stats={stats} />

          {/* Acciones - Sin crear OT */}
          <CronogramaAcciones
            equiposSeleccionados={0}
            todosVisiblesSeleccionados={false}
            onImprimir={handleImprimir}
            onCrearOT={() => {}}
            onToggleTodosVisibles={() => {}}
            onLimpiarSeleccion={() => {}}
            mostrarCrearOT={false}
          />

          {/* Grid del Cronograma - Sin checkboxes */}
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              <CronogramaGrid
                grupos={equiposAgrupados}
                equiposSeleccionados={[]}
                onToggleEquipo={() => {}}
                mostrarCheckboxes={false}
              />
            </Card.Body>
          </Card>

          {/* Paginación */}
          <CronogramaPaginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onCambiarPagina={cambiarPagina}
            equiposPorPagina={equiposPorPagina}
            totalEquipos={equiposFiltrados.length}
          />
        </>
      )}
    </div>
  );
};
