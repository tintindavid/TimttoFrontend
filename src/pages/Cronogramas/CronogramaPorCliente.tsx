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
import { useCronogramaActividadesExternas } from '@/hooks/useCronogramaActividadesExternas';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import { useAuth } from '@/context/AuthContext';
import { useHasPermission } from '@/hooks/usePermission';
import CargaRapidaCelda, { type CeldaCarga } from '@/components/cronogramas/CargaRapidaCelda';
import ResumenCeldaRealizada from '@/components/cronogramas/ResumenCeldaRealizada';
import { useCreateOt } from '@/hooks/useOTs';

// Servicios
import { generarCronogramaPDF, generarCronogramaExcel } from '@/services/cronograma.service';

// Componentes
import { CronogramaStatsCard } from '@/components/cronogramas/CronogramaStatsCard';
import { CronogramaAcciones } from '@/components/cronogramas/CronogramaAcciones';
import { CronogramaFiltros } from '@/components/cronogramas/CronogramaFiltros';
import { CronogramaGrid } from '@/components/cronogramas/CronogramaGrid';
import { CronogramaPaginacion } from '@/components/cronogramas/CronogramaPaginacion';
import { CronogramaDownloadModal } from '@/components/cronogramas/CronogramaDownloadModal';
import EditEquipoModal from '@/components/ots/EditEquipoModal';

// Tipos
import { Mes } from '@/types/cronograma.types';

interface CronogramaPorClienteProps {
  /**
   * Client of the organization itself ("Mi Cronograma"): when given, it is selected automatically and the
   * client selector is not shown.
   */
  clienteFijoId?: string;
}

/** Years offered by the year selector: three back, the current one and the next. */
const opcionesAnio = (actual: number) => [actual + 1, actual, actual - 1, actual - 2, actual - 3];

/**
 * Tab 1: Cronograma de Mantenimiento por Cliente ("Mi Cronograma" for client organizations)
 * Permite filtrar equipos operativos de un cliente y crear OTs
 */
export const CronogramaPorCliente: React.FC<CronogramaPorClienteProps> = ({ clienteFijoId }) => {
  const navigate = useNavigate();
  const createOtMutation = useCreateOt();

  // Estado del cliente seleccionado
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>(clienteFijoId ?? '');

  // Year used to decide which scheduled months are already done (default: the current year)
  const anioActual = new Date().getUTCFullYear();
  const [anio, setAnio] = useState<number>(anioActual);
  
  // Estado del modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [equipoAEditar, setEquipoAEditar] = useState<any>(null);

  // Estado del modal de descarga (PDF / Excel)
  const [showDownloadModal, setShowDownloadModal] = useState(false);

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

  // Premium module "Servicios de terceros": without it there is no external data, figure, column or filter.
  const { can } = useTenantCapabilities();
  const externasHabilitadas = can('registersExternal');
  // Premium switch "Carga rápida desde el cronograma": a due cell opens the registration form of that activity.
  const cargaRapida = externasHabilitadas && can('scheduleQuickLoad');
  // The row checkboxes and "Seleccionar todos" only serve to create a work order: without that capability they are not shown.
  const puedeCrearOT = can('executesServices');
  const puedeElegirCliente = can('managesCustomers');
  const { user } = useAuth();
  const puedeCrearReportes = useHasPermission('reports:create');
  const [celdaCarga, setCeldaCarga] = useState<CeldaCarga | null>(null);

  // Actividades externas programadas del cliente (calibración, verificación, etc.)
  const {
    data: externasData,
    isError: errorExternas,
  } = useCronogramaActividadesExternas(
    { clienteId: clienteSeleccionado, anio },
    { enabled: !!clienteSeleccionado && externasHabilitadas }
  );
  const cadenasExternas = useMemo(
    () => (externasHabilitadas ? externasData?.data ?? [] : []),
    [externasHabilitadas, externasData?.data]
  );

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
  } = useCronograma(equipos, cadenasExternas);

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

  // Enviar solo clienteId y filtros estructurales (sin grupos ni cliente completo).
  // El backend consulta y agrupa los equipos desde DB. Compartido por PDF y Excel.
  const buildDescargaPayload = useCallback(() => ({
    clienteId: clienteSeleccionado,
    filtros: {
      ...(filtros.sedeIds?.length && { sedeIds: filtros.sedeIds }),
      ...(filtros.servicioIds?.length && { servicioIds: filtros.servicioIds }),
      ...(filtros.meses?.length && { meses: filtros.meses.map(m => m.toLowerCase()) }),
      ...(filtros.ubicaciones?.length && { ubicaciones: filtros.ubicaciones }),
      ...(filtros.estado && { estado: filtros.estado }),
    },
  }), [clienteSeleccionado, filtros]);

  const handleImprimir = useCallback(() => {
    if (!clienteSeleccionado) {
      toast.warning('Debe seleccionar un cliente');
      return;
    }

    if (equiposFiltrados.length === 0) {
      toast.warning('No hay equipos para imprimir');
      return;
    }

    setShowDownloadModal(true);
  }, [clienteSeleccionado, equiposFiltrados.length]);

  const handleDescargarPDF = useCallback(async () => {
    try {
      toast.info('Generando PDF del cronograma...', { autoClose: 2000 });
      await generarCronogramaPDF(buildDescargaPayload());
      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al generar el PDF del cronograma'
      );
    }
  }, [buildDescargaPayload]);

  const handleDescargarExcel = useCallback(async () => {
    try {
      toast.info('Generando Excel del cronograma...', { autoClose: 2000 });
      await generarCronogramaExcel(buildDescargaPayload());
      toast.success('Excel generado correctamente');
    } catch (error) {
      console.error('Error al generar Excel:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al generar el Excel del cronograma'
      );
    }
  }, [buildDescargaPayload]);

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
        // Omitted without Gestiona clientes: the server fills it with the organization customer.
        ...(puedeElegirCliente && { ClienteId: clienteSeleccionado }),
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
  }, [equiposSeleccionados, clienteSeleccionado, createOtMutation, limpiarSeleccion, navigate, puedeElegirCliente]);

  // Transformar customers para react-select (ordenados alfabéticamente)
  const customersOptions = useMemo(() => {
    return [...customers]
      .sort((a, b) => {
        const nameA = (a.Razonsocial || 'Sin nombre').toUpperCase();
        const nameB = (b.Razonsocial || 'Sin nombre').toUpperCase();
        return nameA.localeCompare(nameB);
      })
      .map(c => ({
        value: c._id!,
        label: `${c.Razonsocial || 'Sin nombre'} ${c.Nit ? `- ${c.Nit}` : ''}`
      }));
  }, [customers]);

  const clienteActual = customers.find(c => c._id === clienteSeleccionado);

  return (
    <div className="cronograma-por-cliente">
      {/* Selector de Cliente (no se muestra en "Mi Cronograma": el cliente es la propia organización) */}
      {!clienteFijoId && (
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
                  isSearchable
                  isClearable
                  isLoading={loadingCustomers}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  noOptionsMessage={() => 'No hay clientes disponibles'}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                  }}
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
      )}

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
          <p>{clienteFijoId ? 'Tu organización no tiene equipos en estado operativo' : 'El cliente seleccionado no tiene equipos en estado operativo'}</p>
        </Alert>
      ) : (
        <>
          {externasHabilitadas && errorExternas && (
            <Alert variant="warning" className="py-2">
              No se pudieron cargar las actividades externas; se muestra solo el mantenimiento preventivo.
            </Alert>
          )}
          {externasHabilitadas && externasData?.truncated && (
            <Alert variant="info" className="py-2">
              Hay más actividades externas de las que se pueden mostrar; filtra por cliente para ver el detalle completo.
            </Alert>
          )}

          {/* Estadísticas */}
          <CronogramaStatsCard stats={stats} mostrarExternas={externasHabilitadas} mostrarSeleccion={puedeCrearOT} />

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
              <Form.Group className="mb-3 d-flex align-items-center gap-2" controlId="cronograma-anio">
                <Form.Label className="small fw-bold mb-0">Año</Form.Label>
                <Form.Select
                  size="sm"
                  style={{ maxWidth: 110 }}
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                >
                  {opcionesAnio(anioActual).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <CronogramaFiltros
                sedesSeleccionadas={filtros.sedeIds || []}
                serviciosSeleccionados={filtros.servicioIds || []}
                ubicacionesSeleccionadas={filtros.ubicaciones || []}
                mesesSeleccionados={filtros.meses || []}
                searchText={filtros.search || ''}
                origenSeleccionado={filtros.origen ?? 'todos'}
                onOrigenChange={externasHabilitadas ? (origen) => actualizarFiltros({ origen }) : undefined}
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
                mostrarCheckboxes={puedeCrearOT}
                origen={filtros.origen ?? 'todos'}
                anio={anio}
                onCargarCelda={cargaRapida ? setCeldaCarga : undefined}
                // Same rule as the backend: external activities need the admin role, preventive services reports:create
                puedeCargarFila={(fila) => (fila.tipo === 'externa' ? user?.role === 'admin' : puedeCrearReportes)}
              />
            </Card.Body>
          </Card>
          {celdaCarga && (celdaCarga.estado === 'realizado'
            ? <ResumenCeldaRealizada celda={celdaCarga} anio={anio} onClose={() => setCeldaCarga(null)} />
            : <CargaRapidaCelda celda={celdaCarga} anio={anio} onClose={() => setCeldaCarga(null)} />)}
          <p className="small text-muted mt-2" data-testid="leyenda-cronograma">
            <span className="badge bg-success">MP</span> Mantenimiento preventivo &nbsp;·&nbsp;
            {externasHabilitadas && (
              <>
                <span className="badge bg-info">Cal</span> <span className="badge bg-info">Ver</span> Actividades externas (calibración, verificación…) &nbsp;·&nbsp;
              </>
            )}
            <span className="text-success">●</span> Realizado &nbsp;·&nbsp;
            <span className="text-secondary">●</span> Programado
            {externasHabilitadas && (
              <>
                &nbsp;·&nbsp; <span className="text-danger">●</span> Vencido (solo actividades externas)
              </>
            )}
          </p>

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

      {/* Modal de Descarga (PDF / Excel) */}
      <CronogramaDownloadModal
        show={showDownloadModal}
        onHide={() => setShowDownloadModal(false)}
        onDescargarPDF={handleDescargarPDF}
        onDescargarExcel={handleDescargarExcel}
      />
    </div>
  );
};
