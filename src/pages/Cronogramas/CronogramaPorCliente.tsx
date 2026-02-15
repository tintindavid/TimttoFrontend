import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Form, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import './Cronograma.css';

// Hooks
import { useCustomers } from '@/hooks/useCustomers';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { useEquipoItems } from '@/hooks/useEquipoItems';
import { useCronograma } from '@/hooks/useCronograma';
import { useCreateOt } from '@/hooks/useOTs';

// Servicios
import { generarCronogramaPDF } from '@/services/cronograma.service';

// Componentes
import { CronogramaStatsCard } from '@/components/cronogramas/CronogramaStatsCard';
import { CronogramaAcciones } from '@/components/cronogramas/CronogramaAcciones';
import { CronogramaFiltros } from '@/components/cronogramas/CronogramaFiltros';
import { CronogramaGrid } from '@/components/cronogramas/CronogramaGrid';
import { CronogramaPaginacion } from '@/components/cronogramas/CronogramaPaginacion';
import EditEquipoModal from '@/components/ots/EditEquipoModal';

// Tipos
import { Mes } from '@/types/cronograma.types';

/**
 * Tab 1: Cronograma de Mantenimiento por Cliente
 * Permite filtrar equipos operativos de un cliente y crear OTs
 */
export const CronogramaPorCliente: React.FC = () => {
  const navigate = useNavigate();
  const createOtMutation = useCreateOt();

  // Estado del cliente seleccionado
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  
  // Estado del modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [equipoAEditar, setEquipoAEditar] = useState<any>(null);

  console.log('equipo a editar:', equipoAEditar);
  // Queries
  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const customers = useMemo(() => customersData?.data || [], [customersData?.data]);

  const { data: sedesData } = useSedesByCustomer(
    clienteSeleccionado,
    {},
    { enabled: !!clienteSeleccionado }
  );
  const sedes = useMemo(() => sedesData?.data || [], [sedesData?.data]);

  const { data: serviciosData } = useServiciosByCustomer(
    clienteSeleccionado,
    {},
    { enabled: !!clienteSeleccionado }
  );
  const servicios = useMemo(() => serviciosData?.data || [], [serviciosData?.data]);

  // Obtener equipos operativos del cliente
  const { data: equiposData, isLoading: loadingEquipos, refetch: refetchEquipos } = useEquipoItems(
    clienteSeleccionado ? { 
      ClienteId: clienteSeleccionado,
      limit: 1000 // Aumentar límite para cronogramas
    } : undefined
  );
  const equipos = useMemo(() => equiposData?.data || [], [equiposData?.data]);

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
  } = useCronograma(equipos);

  // Obtener ubicaciones únicas de los equipos
  const ubicacionesUnicas = useMemo(() => {
    const ubicaciones = new Set<string>();
    equipos.forEach(eq => {
      if (eq.Ubicacion) ubicaciones.add(eq.Ubicacion);
    });
    return Array.from(ubicaciones).sort();
  }, [equipos]);

  // Manejar cambio de cliente
  const handleClienteChange = useCallback((clienteId: string) => {
    setClienteSeleccionado(clienteId);
    limpiarSeleccion();
    limpiarFiltros();
  }, [limpiarSeleccion, limpiarFiltros]);

  // Manejar edición de equipo
  const handleEditEquipo = useCallback((equipo: any) => {
    
    setEquipoAEditar(equipo);
    setShowEditModal(true);
  }, []);

  // Callback después de editar exitosamente
  const handleEditSuccess = useCallback(async () => {
    await refetchEquipos();
    await Swal.fire({
      icon: 'success',
      title: '¡Equipo Actualizado!',
      text: 'El cronograma se actualizó con los nuevos datos del equipo.',
      timer: 2000,
      showConfirmButton: false
    });
  }, [refetchEquipos]);

  // Imprimir cronograma (solo lo visible)
  const handleImprimir = useCallback(async () => {
    if (!clienteSeleccionado) {
      toast.warning('Debe seleccionar un cliente');
      return;
    }

    if (equiposFiltrados.length === 0) {
      toast.warning('No hay equipos para imprimir');
      return;
    }

    try {
      // Mostrar loading
      toast.info('Generando PDF del cronograma...', { autoClose: 2000 });
      
      // Agrupar TODOS los equipos filtrados (no solo los paginados) por servicio/sede
      const gruposCompletos: { [key: string]: any } = {};
      equiposFiltrados.forEach(equipo => {
        const servicioNombre = typeof equipo.Servicio === 'object' 
          ? (equipo.Servicio?.nombre || 'Sin Servicio') 
          : 'Sin Servicio';
        const sedeNombre = typeof equipo.SedeId === 'object' 
          ? (equipo.SedeId?.nombreSede || 'Sin Sede') 
          : 'Sin Sede';
        
        const grupoKey = `${servicioNombre}|${sedeNombre}`;
        
        if (!gruposCompletos[grupoKey]) {
          gruposCompletos[grupoKey] = {
            servicio: servicioNombre,
            sede: sedeNombre,
            equipos: []
          };
        }
        
        gruposCompletos[grupoKey].equipos.push({
          _id: equipo._id,
          ItemId: equipo.ItemId,
          Marca: equipo.Marca,
          Modelo: equipo.Modelo,
          Serie: equipo.Serie,
          Inventario: equipo.Inventario,
          Ubicacion: equipo.Ubicacion,
          Estado: equipo.Estado,
          mesesMtto: equipo.mesesMtto
        });
      });
      
      // Preparar datos para enviar al backend con equipos agrupados
      const cliente = customers.find(c => c._id === clienteSeleccionado);
      const payload = {
        cliente: cliente,
        grupos: Object.values(gruposCompletos), // Enviar equipos agrupados
        filtros: filtros
      };
      
      // Llamar al servicio para generar el PDF
      await generarCronogramaPDF(payload);
      
      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Error al generar el PDF del cronograma'
      );
    }
  }, [clienteSeleccionado, equiposFiltrados, customers, filtros]);

  // Crear OT con equipos seleccionados
  const handleCrearOT = useCallback(async () => {
    if (equiposSeleccionados.length === 0) {
      toast.warning('Debe seleccionar al menos un equipo');
      return;
    }

    // Confirmar creación
    const result = await Swal.fire({
      title: '¿Crear Orden de Trabajo?',
      html: `
        <p>Se creará una OT con <strong>${equiposSeleccionados.length}</strong> equipo(s) seleccionado(s).</p>
        <p class="text-muted small">Podrá configurar el tipo de servicio y prioridad en el siguiente paso.</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    });

    if (!result.isConfirmed) return;

    // Solicitar tipo de servicio y prioridad
    const { value: formData } = await Swal.fire({
      title: 'Configurar Orden de Trabajo',
      html: `
        <div class="text-start">
          <div class="mb-3">
            <label class="form-label fw-bold">Tipo de Servicio:</label>
            <select id="swal-tipoServicio" class="form-select">
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Instalación">Instalación</option>
              <option value="Capacitación">Capacitación</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label fw-bold">Prioridad:</label>
            <select id="swal-prioridad" class="form-select">
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear OT',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const tipoServicio = (document.getElementById('swal-tipoServicio') as HTMLSelectElement).value;
        const prioridad = (document.getElementById('swal-prioridad') as HTMLSelectElement).value;
        return { tipoServicio, prioridad };
      }
    });

    if (!formData) return;

    // Crear la OT
    try {
      Swal.fire({
        title: 'Creando orden...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const payload = {
        ClienteId: clienteSeleccionado,
        TipoServicio: formData.tipoServicio,
        OtPrioridad: formData.prioridad,
        equipos: equiposSeleccionados
      };

      const response = await createOtMutation.mutateAsync(payload as any);

      await Swal.fire({
        icon: 'success',
        title: '¡Orden Creada!',
        text: `OT creada exitosamente con ${equiposSeleccionados.length} equipo(s)`,
        timer: 2000,
        showConfirmButton: false
      });

      // Limpiar selección y redirigir
      limpiarSeleccion();
      
      // Redirigir a la OT creada si tenemos el ID
      if (response?.data?._id) {
        navigate(`/maintenance-orders/${response.data._id}`);
      } else {
        navigate('/maintenance-orders');
      }
    } catch (error: any) {
      console.error('Error al crear OT:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo crear la orden de trabajo',
        confirmButtonText: 'Aceptar'
      });
    }
  }, [equiposSeleccionados, clienteSeleccionado, createOtMutation, limpiarSeleccion, navigate]);

  // Transformar customers para react-select
  const customersOptions = customers.map(c => ({
    value: c._id!,
    label: `${c.Razonsocial || 'Sin nombre'} ${c.Nit ? `- ${c.Nit}` : ''}`
  }));

  const clienteActual = customers.find(c => c._id === clienteSeleccionado);

  return (
    <div className="cronograma-por-cliente">
      {/* Selector de Cliente */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <span className="text-danger">*</span> Seleccionar Cliente
                </Form.Label>
                <Select
                  options={customersOptions}
                  value={customersOptions.find(c => c.value === clienteSeleccionado) || null}
                  onChange={(selected: { value: string; label: string } | null) => handleClienteChange(selected?.value || '')}
                  placeholder="Buscar cliente por nombre o NIT..."
                  isClearable
                  isLoading={loadingCustomers}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  noOptionsMessage={() => 'No hay clientes disponibles'}
                />
              </Form.Group>
            </Col>
            {clienteActual && (
              <Col md={6}>
                <div className="p-3 bg-light rounded">
                  <small className="text-muted d-block">Cliente Seleccionado:</small>
                  <strong className="d-block">{clienteActual.Razonsocial}</strong>
                  <small className="text-muted">
                    {clienteActual.Ciudad} - {clienteActual.Departamento}
                  </small>
                </div>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Contenido principal */}
      {!clienteSeleccionado ? (
        <Alert variant="info" className="text-center">
          <Alert.Heading>Seleccione un Cliente</Alert.Heading>
          <p>Seleccione un cliente para ver su cronograma de mantenimientos</p>
        </Alert>
      ) : loadingEquipos ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando equipos...</p>
        </div>
      ) : equipos.length === 0 ? (
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Sin Equipos Operativos</Alert.Heading>
          <p>El cliente seleccionado no tiene equipos en estado operativo</p>
        </Alert>
      ) : (
        <>
          {/* Estadísticas */}
          <CronogramaStatsCard stats={stats} />

          {/* Acciones */}
          <CronogramaAcciones
            equiposSeleccionados={equiposSeleccionados.length}
            todosVisiblesSeleccionados={todosVisiblesSeleccionados}
            onImprimir={handleImprimir}
            onCrearOT={handleCrearOT}
            onToggleTodosVisibles={toggleTodosVisibles}
            onLimpiarSeleccion={limpiarSeleccion}
            mostrarCrearOT={true}
          />

          {/* Filtros */}
          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <CronogramaFiltros
                sedesSeleccionadas={filtros.sedeIds || []}
                serviciosSeleccionados={filtros.servicioIds || []}
                ubicacionesSeleccionadas={filtros.ubicaciones || []}
                mesesSeleccionados={filtros.meses || []}
                searchText={filtros.search || ''}
                sedesOptions={sedes}
                serviciosOptions={servicios}
                ubicacionesOptions={ubicacionesUnicas}
                onSedesChange={(sedes) => actualizarFiltros({ sedeIds: sedes })}
                onServiciosChange={(servicios) => actualizarFiltros({ servicioIds: servicios })}
                onUbicacionesChange={(ubicaciones) => actualizarFiltros({ ubicaciones })}
                onMesesChange={(meses) => actualizarFiltros({ meses: meses as Mes[] })}
                onSearchChange={(search) => actualizarFiltros({ search })}
                onLimpiar={limpiarFiltros}
              />
            </Card.Body>
          </Card>

          {/* Grid del Cronograma */}
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              <CronogramaGrid
                grupos={equiposAgrupados}
                equiposSeleccionados={equiposSeleccionados}
                onToggleEquipo={toggleEquipo}
                onEditEquipo={handleEditEquipo}
                mostrarCheckboxes={true}
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

      {/* Modal de Edición */}
      {equipoAEditar && (
        <EditEquipoModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          equipo={equipoAEditar}
          reporteId="" // No aplica para cronogramas
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};
