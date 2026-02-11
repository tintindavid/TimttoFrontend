import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Card, Row, Col, Form, Button, Badge, Alert, 
  ProgressBar, Tab, Tabs, ListGroup, Modal 
} from 'react-bootstrap';
import { Reporte, ActividadRealizada, Evidencia, RepuestoReporte } from '@/types/reporte.types';
import { Repuesto } from '@/types/repuesto.types';
import { ActividadMtto } from '@/types/actividad.types';
import { FaSave, FaCheck, FaTimes, FaArrowLeft, FaCamera, FaTools, FaEdit, FaList, FaCheckCircle, FaPlus, FaWrench, FaCog, FaEye } from 'react-icons/fa';
import { useProtocol } from '@/hooks/useProtocols';
import { useRepuestosByEquipo, useRepuestosByReporte, useUpdateRepuesto, useDeleteRepuesto } from '@/hooks/useRepuestos';
import { useAuth } from '@/context/AuthContext';
import { SolicitarRepuestoModal } from '@/components/repuestos/SolicitarRepuestoModal';
import { InstalarRepuestoModal } from '@/components/repuestos/InstalarRepuestoModal';
import { InstalarRepuestoDirectoModal } from '@/components/repuestos/InstalarRepuestoDirectoModal';
import EditEquipoModal from './EditEquipoModal';
import Swal from 'sweetalert2';

interface ReportDetailProps {
  reporte: Reporte;
  onBack: () => void;
  onSave: (reporte: Reporte) => void;
  onMarkAsProcessed: (reporte: Reporte) => void; // Debe usar endpoint: PUT /api/v1/reportes/:reporteId/procesar
  onRefreshData?: () => void; // Callback para refrescar datos del OtDetailPage
}

const ReportDetail: React.FC<ReportDetailProps> = ({ 
  reporte, 
  onBack, 
  onSave, 
  onMarkAsProcessed,
  onRefreshData
}) => {
  const [editedReporte, setEditedReporte] = useState<Reporte>({
    ...reporte,
    actividadesRealizadas: reporte.actividadesRealizadas || [],
    estadoOperativo: reporte.estadoOperativo || 'Operativo',
  });

  // Sincronizar el estado interno cuando cambia la prop reporte (por ejemplo, después de editar el equipo)
  useEffect(() => {
    setEditedReporte({
      ...reporte,
      actividadesRealizadas: reporte.actividadesRealizadas || [],
      estadoOperativo: reporte.estadoOperativo || 'Operativo',
    });
  }, [reporte]);

  console.log('editedReporte: ', editedReporte)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('equipment');
  const [observacionEstadoFinal, setObservacionEstadoFinal] = useState<string>(editedReporte.observacionEstadoFinal || '');
  
  // Estados para modales de repuestos
  const [showSolicitarModal, setShowSolicitarModal] = useState(false);
  const [showInstalarModal, setShowInstalarModal] = useState(false);
  const [showInstalarDirectoModal, setShowInstalarDirectoModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [repuestoToInstall, setRepuestoToInstall] = useState<Repuesto | null>(null);
  const [repuestoToEdit, setRepuestoToEdit] = useState<Repuesto | null>(null);
  // Estado para modal de edición de equipo
  const [showEditEquipoModal, setShowEditEquipoModal] = useState(false);
  // Estados para modal de cancelación
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  // Estado para observaciones temporales de actividades pendientes
  const [observacionesActividades, setObservacionesActividades] = useState<Record<string, string>>({});
  // Estado para spinner de procesamiento
  const [isProcessing, setIsProcessing] = useState(false);
  // Estado para fecha de procesado
  const [fechaProcesado, setFechaProcesado] = useState<string>(() => {
    // Inicializar con fecha válida por defecto
    const fechaExistente = editedReporte.fechaProcesado;
    if (fechaExistente) {
      try {
        return new Date(fechaExistente).toISOString().split('T')[0];
      } catch {
        return new Date().toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0];
  });

  const estadoOptions = ['Operativo', 'En mantenimiento', 'Fuera de servicio'];
  // Hooks para autenticación
  const { user, token } = useAuth();
  // Obtener protocolo del equipo
  const protocoloId = editedReporte?.Equipo?.ItemId?.ProtocoloId || 'PROTO-001'; // Valor temporal para testing
  const { data: protocolo, isLoading: loadingProtocol } = useProtocol(protocoloId);

  // Obtener repuestos del equipo y del reporte
  const { data: repuestosEquipo, isLoading: loadingRepuestosEquipo } = useRepuestosByEquipo(editedReporte.Equipo?._id || '', 'Solicitado');
  const { data: repuestosReporte, isLoading: loadingRepuestosReporte } = useRepuestosByReporte(editedReporte._id || '');
  
  // Hooks para editar y eliminar repuestos
  const updateRepuestoMutation = useUpdateRepuesto();
  const deleteRepuestoMutation = useDeleteRepuesto();

  // Combinar y deduplicar repuestos
  const repuestosCombinados = useMemo(() => {
    const repuestosMap = new Map();
    
    // Agregar repuestos del reporte (prioridad alta - estos son específicos del reporte)
    if (repuestosReporte?.data) {
      repuestosReporte.data.forEach(repuesto => {
        repuestosMap.set(repuesto._id, { ...repuesto, origen: 'reporte' });
      });
    }
    
    // Agregar repuestos del equipo solo si no están ya en el map (evitar duplicados)
    if (repuestosEquipo?.data) {
      repuestosEquipo.data.forEach(repuesto => {
        if (!repuestosMap.has(repuesto._id)) {
          repuestosMap.set(repuesto._id, { ...repuesto, origen: 'equipo' });
        }
      });
    }
    
    return Array.from(repuestosMap.values());
  }, [repuestosReporte?.data, repuestosEquipo?.data]);
  // Actividades del protocolo que no están realizadas
  const actividadesProtocolo = useMemo(() => {
    if (!protocolo?.data?.actividadesMtto) return [];
    
    return protocolo.data.actividadesMtto.filter((actividadProto: ActividadMtto) => {
      // No mostrar la actividad si ya está en actividadesRealizadas (ya se hizo)
      const yaRealizada = editedReporte?.actividadesRealizadas?.some(actividadRealizada => 
        actividadRealizada.actividadProtocoloId === actividadProto._id
      );
      return !yaRealizada;
    });
  }, [protocolo, editedReporte?.actividadesRealizadas]);
  
  // Calcular progreso de actividades (mejorado para tener en cuenta actividades ya completadas)
  const { actividadesCompletadas, totalActividades, progresoActividades } = useMemo(() => {
    const totalActividadesProtocolo = protocolo?.data?.actividadesMtto?.length || 0;
    
    if (totalActividadesProtocolo === 0) {
      return { actividadesCompletadas: 0, totalActividades: 0, progresoActividades: 0 };
    }
    
    let completadas = 0;
    
    // Si hay un protocolo, contar actividades completadas
    if (protocolo?.data?.actividadesMtto) {
      protocolo.data.actividadesMtto.forEach((actividadProto: ActividadMtto) => {
        // Verificar si esta actividad del protocolo está en actividadesRealizadas (ya se hizo)
        const estaCompletada = editedReporte?.actividadesRealizadas?.some(actividadRealizada => 
          actividadRealizada.actividadProtocoloId === actividadProto._id
        );
        
        if (estaCompletada) {
          completadas++;
        }
      });
    }
    
    const progreso = totalActividadesProtocolo > 0 ? (completadas / totalActividadesProtocolo) * 100 : 0;
    
    return {
      actividadesCompletadas: completadas,
      totalActividades: totalActividadesProtocolo,
      progresoActividades: progreso
    };
  }, [protocolo, editedReporte?.actividadesRealizadas]);

  // Handlers
  const handleEquipmentChange = useCallback((field: string, value: string) => {
    setEditedReporte(prev => ({
      ...prev,
      equipoSnapshot: {
        ...prev.equipoSnapshot,
        [field]: value
      }
    }));
  }, []);

  const handleActivityChange = useCallback((index: number, field: keyof ActividadRealizada, value: any) => {
    setEditedReporte(prev => {
      const currentActividades = prev.actividadesRealizadas || [];
      return {
        ...prev,
        actividadesRealizadas: currentActividades.map((actividad, i) => 
          i === index ? { ...actividad, [field]: value } : actividad
        )
      };
    });
  }, []);

  const handleObservacionChange = useCallback((field: string, value: string) => {
    setEditedReporte(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Función para agregar actividad del protocolo a actividadesRealizadas
  const handleProtocolActivityToggle = useCallback((actividadProtocolo: ActividadMtto, checked: boolean) => {
    if (checked) {
      console.log('Agregando actividad realizada para:', actividadProtocolo);
      // Agregar actividad realizada con la observación ingresada
      const observacion = observacionesActividades[actividadProtocolo._id || ''] || '';
      const nuevaActividad: ActividadRealizada = {
        _id: `temp_${Date.now()}`, // ID temporal
        descripcion: actividadProtocolo.Nombre,
        realizado: true, // Cambio de 'realizada' a 'realizado'
        fecha: new Date().toISOString(),
        actividadProtocoloId: actividadProtocolo._id || '', // Proveer fallback para evitar undefined
        observaciones: observacion
      };
      
      setEditedReporte(prev => ({
        ...prev,
        actividadesRealizadas: [...(prev.actividadesRealizadas || []), nuevaActividad]
      }));

      // Limpiar la observación temporal después de agregarla
      setObservacionesActividades(prev => {
        const newObservaciones = { ...prev };
        delete newObservaciones[actividadProtocolo._id || ''];
        return newObservaciones;
      });
    } else {
      // Remover actividad realizada
      setEditedReporte(prev => ({
        ...prev,
        actividadesRealizadas: (prev.actividadesRealizadas || []).filter(
          actividad => actividad.actividadProtocoloId !== actividadProtocolo._id
        )
      }));
    }
  }, [observacionesActividades]);

  const handleSave = () => {

    
    onSave(editedReporte);
    setIsEditing(false);
  }; // aqui finaliza handle save


  // Funciones para manejar repuestos
  const handleSolicitarRepuesto = () => {
    setShowSolicitarModal(true);
  };

  const handleInstalarRepuestoDirecto = () => {
    setShowInstalarDirectoModal(true);
  };

  const handleInstalarRepuesto = (repuesto: Repuesto) => {
    if (repuesto.EstadoSolicitud === 'Instalado') {
      alert('Este repuesto ya está instalado');
      return;
    }
    setRepuestoToInstall(repuesto);
    setShowInstalarModal(true);
  };

  const handleEditarRepuesto = (repuesto: Repuesto) => {
    setRepuestoToEdit(repuesto);
    setShowEditarModal(true);
  };

  const handleEliminarRepuesto = async (repuesto: Repuesto) => {
    if (confirm(`¿Está seguro de eliminar el repuesto "${repuesto.nombre}"?`)) {
      try {
        await deleteRepuestoMutation.mutateAsync(repuesto._id!);
        alert('Repuesto eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar repuesto:', error);
        alert('Error al eliminar el repuesto');
      }
    }
  };

  const handleCloseSolicitarModal = () => {
    setShowSolicitarModal(false);
  };

  const handleCloseInstalarModal = () => {
    setShowInstalarModal(false);
    setRepuestoToInstall(null);
  };

  const handleCloseInstalarDirectoModal = () => {
    setShowInstalarDirectoModal(false);
  };

  const handleCloseEditarModal = () => {
    setShowEditarModal(false);
    setRepuestoToEdit(null);
  };
  // Handlers para edición de equipo
  const handleOpenEditEquipoModal = () => {
    setShowEditEquipoModal(true);
  };
  const handleCloseEditEquipoModal = () => {
    setShowEditEquipoModal(false);
  };
  const handleEquipoUpdateSuccess = () => {
    // Refrescar datos del OtDetailPage para actualizar el reporte
    if (onRefreshData) {
      onRefreshData();
    }
  };
  const handleMarkAsProcessed = async () => {
    // Función para extraer userId del token JWT como fallback
    const getUserIdFromToken = (token: string): string | null => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.id || payload.sub;
      } catch (error) {
        console.error('Error parsing token:', error);
        return null;
      }
    };
    const userId = user?._id || (token ? getUserIdFromToken(token) : null);
  
    if (!userId) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de Autenticación',
        text: 'Usuario no autenticado. No se puede procesar el reporte.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // Validar observación obligatoria para ciertos estados
    if (
      (editedReporte.estadoOperativo === 'En Mantenimiento' || 
       editedReporte.estadoOperativo === 'Fuera de Servicio' || 
       editedReporte.estadoOperativo === 'Dado de Baja') && 
      !observacionEstadoFinal.trim()
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Observación Requerida',
        text: 'Debe proporcionar una observación sobre el estado final del equipo.',
        confirmButtonColor: '#f0ad4e'
      });
      return;
    }

    // Validar y construir fecha ISO de manera más segura
    let fechaMttoISO: string;
    try {
      // Validar que fechaProcesado tenga un valor válido
      if (!fechaProcesado || fechaProcesado.trim() === '') {
        throw new Error('Fecha de procesado no válida');
      }
      
      // Construir fecha de manera más robusta
      const now = new Date();
      const fechaBase = new Date(fechaProcesado);
      
      // Verificar que la fecha base sea válida
      if (isNaN(fechaBase.getTime())) {
        throw new Error('Formato de fecha no válido');
      }
      
      // Crear fecha con hora actual
      const fechaCompleta = new Date(
        fechaBase.getFullYear(),
        fechaBase.getMonth(),
        fechaBase.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );
      
      fechaMttoISO = fechaCompleta.toISOString();
    } catch (error) {
      console.error('Error construyendo fecha:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en Fecha',
        text: 'Fecha de procesado no válida. Seleccione una fecha correcta.',
        confirmButtonColor: '#d33'
      });
      return;
    }
    
    const reporteProcesado = {
      ...editedReporte,
      procesado: true,
      fechaProcesado: fechaMttoISO,
      fechaMtto: fechaMttoISO, // Fecha de mantenimiento
      observacionEstadoFinal: observacionEstadoFinal.trim(),
      ResponsableMtto: {
        firstName: user?.firstName || 'Desconocido',
        lastName: user?.lastName || 'Usuario',
        _id: userId
      }, // Nombre del responsable
      estado: 'Procesado' as const,
      // Incluir las actividades realizadas actualizadas
      actividadesRealizadas: editedReporte.actividadesRealizadas || [],
      // Campos adicionales de resumen
      resumen: {
        actividadesCompletadas,
        totalActividades,
        porcentajeCompletado: Math.round(progresoActividades),
        cantidadRepuestos: repuestosCombinados.length,
        observacion: editedReporte.observacion?.trim() || '',
        causaEncontrada: editedReporte.causaEncontrada?.trim() || '',
        motivoFueraServicio: editedReporte.motivoFueraServicio?.trim() || ''
      }
    };
    
    // Activar spinner
    setIsProcessing(true);
    setShowConfirmModal(false);
    
    try {
      // Llamar a la función de procesamiento
      await onMarkAsProcessed(reporteProcesado);
      
      // Refrescar datos del OtDetailPage si se proporciona el callback
      if (onRefreshData) {
        console.log('actualizando');
        onRefreshData();
      }

      // Mostrar alerta de éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Reporte Procesado!',
        text: 'El reporte se ha procesado exitosamente.',
        confirmButtonColor: '#28a745',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Ejecutar onBack para volver
      onBack();
    } catch (error) {
      console.error('Error al procesar reporte:', error);
      
      // Mostrar alerta de error
      await Swal.fire({
        icon: 'error',
        title: 'Error al Procesar',
        text: 'No se pudo procesar el reporte. Inténtelo de nuevo.',
        confirmButtonColor: '#d33'
      });
    } finally {
      // Desactivar spinner
      setIsProcessing(false);
    }
  };
  const handleOpenViewReport = () => {
    const reporteId = editedReporte._id;
    if (reporteId) {
      // Abrir en nueva ventana del navegador
      window.open(`/reports/${reporteId}/view`, '_blank');
    }
  };
  const handleCancelReport = async () => {
    if (!motivoCancelacion.trim()) {
      alert('Debe indicar el motivo de la cancelación');
      return;
    }

        // Función para extraer userId del token JWT como fallback
    const getUserIdFromToken = (token: string): string | null => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.id || payload.sub;
      } catch (error) {
        console.error('Error parsing token:', error);
        return null;
      }
    };
    const userId = user?._id || (token ? getUserIdFromToken(token) : null);

    try {
      const reporteCancelado = {
        ...editedReporte,
        estado: 'Cancelado' as const,
        motivoCancelacion: motivoCancelacion.trim(),
        fechaCancelacion: new Date().toISOString(),
        ResponsableMtto: {
          firstName: user?.firstName || 'Desconocido',
          lastName: user?.lastName || 'Usuario',
          _id: userId || ''
        }
      };

      // Guardar el reporte cancelado
      onSave(reporteCancelado);

      
      // Refrescar datos si se proporciona el callback
      if (onRefreshData) {
        onRefreshData();
      }

      setShowCancelModal(false);
      setMotivoCancelacion('');
      
      alert('Reporte cancelado exitosamente');
    } catch (error) {
      console.error('Error al cancelar reporte:', error);
      alert('Error al cancelar el reporte. Inténtelo de nuevo.');
    }
  };

  const canMarkAsProcessed = () => {
    // Validaciones para marcar como procesado
    const tieneActividadesCompletadas = actividadesCompletadas > 0;
    const tieneObservaciones = (editedReporte.observacion?.trim().length || 0) > 20;
    const tieneFallaReportada = (editedReporte.fallaReportada?.trim().length || 0) > 15;
    const tieneDiagnostico = (editedReporte.diagnostico?.trim().length || 0) > 15;
    const tieneAccionTomada = (editedReporte.accionTomada?.trim().length || 0) > 15;


    //devolver true si el tipoMtto es Preventivo y tiene actividades completadas
    if (editedReporte.tipoMtto === 'Preventivo' || editedReporte.tipoMtto === 'Predictivo' || editedReporte.tipoMtto === 'Instalación') {
      return tieneActividadesCompletadas;
    }
    // Para otros tipos de mantenimiento, requerir observaciones, falla reportada, diagnóstico y acción tomada obligatoria todas deben estar completas
    return  tieneFallaReportada && tieneDiagnostico && tieneAccionTomada;
  };

  //Render del componente reporte detalle
  return (
    <div className="mt-4" style={{ position: 'relative' }}>
      {/* Overlay de spinner cuando está procesando */}
      {isProcessing && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div className="spinner-border text-light" role="status" style={{ width: '4rem', height: '4rem' }}>
            <span className="visually-hidden">Procesando...</span>
          </div>
          <div className="text-light mt-3 fs-5">
            Procesando reporte, por favor espere...
          </div>
        </div>
      )}
      
      {/* Sección de Información General del Reporte */}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-muted mb-2">
                <small className="text-uppercase fw-semibold">Consecutivo</small>
              </div>
              <div className="display-6 fw-bold text-primary">
                {editedReporte.consecutivo || 'N/A'}
              </div>
              <div className="text-muted mt-1">
                <small>ID: {editedReporte._id?.slice(-8) || 'N/A'}</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-muted mb-2">
                <small className="text-uppercase fw-semibold">Estado del Reporte</small>
              </div>
              <div className="mt-2">
                <Badge 
                  bg={
                    editedReporte.estado === 'Cerrado' ? 'success' :
                    editedReporte.estado === 'Procesado' ? 'info' :
                    editedReporte.estado === 'Cancelado' ? 'danger' :
                    'warning'
                  }
                  className="fs-4 py-2 px-3"
                  style={{ minWidth: '120px' }}
                >
                  {editedReporte.estado}
                </Badge>
              </div>
              {editedReporte.fechaProcesado && (
                <div className="text-muted mt-2">
                  <small>
                    Procesado: {new Date(editedReporte.fechaProcesado).toLocaleDateString('es-ES')}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card 
            className="h-100 border-0 shadow-sm"
            style={{
              backgroundColor: 
                editedReporte.estadoOperativo === 'Operativo' ? '#d4edda' :
                editedReporte.estadoOperativo === 'En Mantenimiento' ? '#fff3cd' :
                editedReporte.estadoOperativo === 'Fuera de Servicio' ? '#f8d7da' :
                editedReporte.estadoOperativo === 'Dado de Baja' ? '#e2e3e5' :
                '#f8f9fa'
            }}
          >
            <Card.Body className="text-center">
              <div className="text-muted mb-2">
                <small className="text-uppercase fw-semibold">Estado Operativo</small>
              </div>
              <div className="fs-4 fw-bold mt-2" style={{ 
                color: 
                  editedReporte.estadoOperativo === 'Operativo' ? '#155724' :
                  editedReporte.estadoOperativo === 'En Mantenimiento' ? '#856404' :
                  editedReporte.estadoOperativo === 'Fuera de Servicio' ? '#721c24' :
                  editedReporte.estadoOperativo === 'Dado de Baja' ? '#383d41' :
                  '#495057'
              }}>
                {editedReporte.estadoOperativo === 'Operativo' && '✅'}
                {editedReporte.estadoOperativo === 'En Mantenimiento' && '🔧'}
                {editedReporte.estadoOperativo === 'Fuera de Servicio' && '⚠️'}
                {editedReporte.estadoOperativo === 'Dado de Baja' && '🔴'}
                {!editedReporte.estadoOperativo && '❓'}
                <div className="mt-1">
                  {editedReporte.estadoOperativo || 'No especificado'}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Header del Reporte */}
      <Card className="mb-4 border-info">
        <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              🔧 Trabajo en Equipo: {editedReporte.equipoSnapshot.ItemText}
            </h5>
            <small>
              {editedReporte.equipoSnapshot.Marca} • {editedReporte.equipoSnapshot.Modelo}
            </small>
          </div>
          <div className="d-flex gap-2">
          {/*Mostrar un badge con el tipoMtto en grande */}
          {editedReporte.tipoMtto && (
            <Badge bg="primary" className="me-2 fs-6">
              {editedReporte.tipoMtto}
            </Badge>
          )}
            {editedReporte.estado==='Cerrado' || editedReporte.estado==='Cancelado' ? (
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={handleOpenViewReport}
              >
                <FaEye className="me-1" />
                Ver Reporte Completo
              </Button>
              )
            : null}
            <Badge bg={editedReporte.fechaProcesado ? 'success' : 'warning'}>
              {editedReporte.estado}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-muted mb-0">Progreso de Actividades</h6>
                <small className="text-muted">
                  {actividadesCompletadas}/{totalActividades} actividades
                </small>
              </div>
              <ProgressBar 
                now={progresoActividades} 
                label={`${Math.round(progresoActividades)}%`}
                variant={progresoActividades === 100 ? 'success' : 'info'}
                style={{ height: '20px' }}
              />
            </Col>
            <Col md={4} className="text-end">
              <div className="d-flex gap-2 justify-content-end">
                {editedReporte.estado === "Pendiente" && (
                <Button   // Boton para cancelar el reporte
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                >
                  <FaTimes className="me-1" />
                  Cancelar
                </Button>
                )}

                {editedReporte.fechaProcesado && (
                  <>
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick= {handleSave}
                    >
                      <FaSave className="me-1" />Guardar Cambios</Button>
                   </> 
                  )}
                    {!(editedReporte.estado === 'Cancelado' || editedReporte.estado === 'Cerrado') && (
                    <Button 
                      variant="primary" 
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!canMarkAsProcessed()}
                    >
                      <FaCheck className="me-1" />
                      Marcar Procesado
                    </Button>
                    )}
              </div>
            </Col>
          </Row>
          
          {/*Formulario para otros tipo de mantenimiento */}
          {editedReporte.tipoMtto !=='Preventivo'&& 
            <Row>  {/*Falla reportada */}
              <Form.Group className="mt-2">
              <Form.Label className="mt-2">Falla reportada * </Form.Label>
                <Form.Control as="textarea"
                  rows={3}
                  placeholder="Falla reportada, causa encontrada, etc..." 
                  value={editedReporte.fallaReportada || ''}
                  onChange={(e) => handleObservacionChange('fallaReportada', e.target.value)}
                  className="mt-2"
                />
                {/*Si el tipoMtto es Correctivo o Diagnóstico Mostrar en rojo si editedReporte.fallaReportada existe*/}
                <span className="text-danger mt-1"> { (editedReporte?.fallaReportada?.trim().length || 0) < 15 &&  <small>*Indique la falla reportada para este servicio (min 15 caracteres).</small>} </span>
              </Form.Group>
              <Form.Group className="mt-2">
                <Form.Label>Diagnostico *</Form.Label>
                <Form.Control as="textarea"
                  rows={3}
                  placeholder="Causa encontrada, motivo fuera de servicio, etc..."
                  value={editedReporte.diagnostico || ''}
                  onChange={(e) => handleObservacionChange('diagnostico', e.target.value)}
                  className="mt-2"
                />
                <span className="text-danger mt-1"> { (editedReporte?.diagnostico?.trim().length || 0) < 15 && <small>*Indique el diagnóstico para este servicio (min 15 caracteres).</small>} </span>
              </Form.Group>
              <Form.Group className="mt-2">
                <Form.Label>Acción tomada *</Form.Label>
                <Form.Control as="textarea"
                  rows={3}
                  placeholder="Acción tomada, recomendaciones, etc..."
                  value={editedReporte.accionTomada || ''}
                  onChange={(e) => handleObservacionChange('accionTomada', e.target.value)} 
                  className="mt-2"
                />
                <span className="text-danger mt-1"> { (editedReporte?.accionTomada?.trim().length || 0) < 15 && <small>*Indique la acción tomada para este servicio (min 15 caracteres).</small>} </span>
              </Form.Group>
            </Row>
          } 
          {/*observacion General */}
          <Form.Group>
            <Form.Label>Observación General / Recomendación</Form.Label>
            <Form.Control as="textarea"
              rows={3}
              placeholder="Observaciones generales, recomendaciones, etc..."
              value={editedReporte.observacion || ''}
              onChange={(e) => handleObservacionChange('observacion', e.target.value)}
              className="mt-2"
            />
          </Form.Group>
        </Card.Body>
      </Card>
      {/* Tabs de Trabajo */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'equipment')}>
        {/* Tab 1: Información del Equipo */}
        <Tab eventKey="equipment" title="📱 Equipo">
          <Card className="mt-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">Información del Equipo (Snapshot)</h6>
                <small className="text-muted">
                  Información del equipo al momento del reporte
                </small>
              </div>
              {!editedReporte.procesado && (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleOpenEditEquipoModal}
                >
                  <FaEdit className="me-1" />
                  Editar Equipo
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              <Row className="g-4">
                <Col md={6}>
                  <div className="border-start border-primary border-3 ps-3 mb-4">
                    <h6 className="text-primary mb-2">Identificación</h6>
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">Item / Nombre</small>
                      <div className="fs-5 fw-semibold">{editedReporte.equipoSnapshot.ItemText || 'No especificado'}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">Serie</small>
                      <div className="fs-6">
                        <Badge bg="secondary" className="fs-6 fw-normal">
                          {editedReporte.equipoSnapshot.Serie || 'No especificado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="border-start border-info border-3 ps-3 mb-4">
                    <h6 className="text-info mb-2">Especificaciones</h6>
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">Marca</small>
                      <div className="fs-6 fw-semibold">{editedReporte.equipoSnapshot.Marca || 'No especificado'}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">Modelo</small>
                      <div className="fs-6">{editedReporte.equipoSnapshot.Modelo || 'No especificado'}</div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Información adicional del equipo si está disponible */}
              {editedReporte?.equipoSnapshot && (
                <Row className="mt-4">
                  <Col md={12}>
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-muted mb-3">Información Adicional</h6>
                      <Row>
                        {editedReporte?.equipoSnapshot?.Ubicacion && (
                          <Col md={4} className="mb-2">
                            <small className="text-muted d-block">Servicio</small>
                            <div>{editedReporte?.equipoSnapshot?.Servicio}</div>
                          </Col>
                        )}
                        {editedReporte.equipoSnapshot.Sede && typeof editedReporte.equipoSnapshot.Sede === 'object' && (
                          <Col md={4} className="mb-2">
                            <small className="text-muted d-block">Sede</small>
                            <div>{editedReporte.equipoSnapshot.Sede}</div>
                          </Col>
                        )}
                        {editedReporte.equipoSnapshot.Ubicacion && (
                          <Col md={4} className="mb-2">
                            <small className="text-muted d-block">Ubicación</small>
                            <div>{editedReporte.equipoSnapshot.Ubicacion}</div>
                          </Col>
                        )}
                        {editedReporte?.Equipo?.Invima && (
                          <Col md={4} className="mb-2">
                            <small className="text-muted d-block">Registro INVIMA</small>
                            <div>
                              <Badge bg="info" className="fw-normal">
                                {editedReporte.Equipo.Invima}
                              </Badge>
                            </div>
                          </Col>
                        )}
                        {editedReporte.equipoSnapshot.Inventario && (
                          <Col md={4} className="mb-2">
                            <small className="text-muted d-block">Inventario</small>
                            <div>{editedReporte.equipoSnapshot.Inventario}</div>
                          </Col>
                        )}
                        {editedReporte?.Equipo?.Riesgo && (
                          <Col md={4} className="mb-2">
                            <small className="text-muted d-block">Clasificación de Riesgo</small>
                            <div>
                              <Badge 
                                bg={
                                  editedReporte.Equipo.Riesgo === 'I' ? 'success' :
                                  editedReporte.Equipo.Riesgo === 'IIA' ? 'info' :
                                  editedReporte.Equipo.Riesgo === 'IIB' ? 'warning' :
                                  'danger'
                                }
                                className="fw-normal"
                              >
                                Clase {editedReporte.Equipo.Riesgo}
                              </Badge>
                            </div>
                          </Col>
                        )}
                      </Row>
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Tab 2: Protocolo/Actividades */}
        <Tab eventKey="activities" title="✅ Protocolo">
          <Card className="mt-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">
                  <FaList className="me-2" />
                  Protocolo de Mantenimiento
                </h6>
                <small className="text-muted">
                  {protocolo?.data.nombre ? `${protocolo?.data.nombre}` : 'No hay protocolo asignado'}
                </small>
              </div>
              <Badge bg="info">
                {actividadesCompletadas}/{totalActividades} completadas
              </Badge>
            </Card.Header>
            <Card.Body>
              {loadingProtocol && (
                <Alert variant="info">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Cargando protocolo...
                  </div>
                </Alert>
              )}

              {!protocoloId && (
                <Alert variant="warning">
                  <FaTools className="me-2" />
                  Este equipo no tiene un protocolo de mantenimiento asignado
                </Alert>
              )}

              {protocoloId && !loadingProtocol && protocolo?.data && (
                <div>
                  {/* Información del Protocolo */}
                  <div className="mb-4 p-3 bg-light rounded">
                    <h6 className="mb-1">{protocolo.data.nombre}</h6>
                    <small className="text-muted">{protocolo.data.Descripcion}</small>
                  </div>

                  {/* Actividades del Protocolo */}
                  {actividadesProtocolo.length > 0 && (
                    <div className="mb-4">
                      <h6 className="mb-3">
                        <FaTools className="me-2 text-primary" />
                        Actividades Pendientes del Protocolo
                      </h6>
                      <ListGroup>
                        {actividadesProtocolo.map((actividad) => (
                          <ListGroup.Item key={actividad._id} className="border-start border-primary border-3">
                            <div className="d-flex align-items-start">
                              <Form.Check
                                type="checkbox"
                                onChange={(e) => handleProtocolActivityToggle(actividad, e.target.checked)}
                                disabled={editedReporte.procesado}
                                className="me-3 mt-1"
                              />
                              <div className="flex-grow-1">
                                <div className="fw-bold text-primary">
                                  {actividad.Nombre || actividad.Descripcion}
                                </div>
                                {actividad.Descripcion && actividad.Nombre && (
                                  <small className="text-muted d-block mt-1">
                                    {actividad.Descripcion}
                                  </small>
                                )}
                                {actividad.EsObligatoria && (
                                  <small className="badge bg-warning text-dark mt-1">
                                    🗘️ Obligatoria
                                  </small>
                                )}
                                {/* Campo de observaciones */}
                                <div className="mt-2">
                                  <Form.Control
                                    type="text"
                                    size="sm"
                                    placeholder="Observaciones de esta actividad (opcional)..."
                                    value={observacionesActividades[actividad._id || ''] || ''}
                                    onChange={(e) => {
                                      setObservacionesActividades(prev => ({
                                        ...prev,
                                        [actividad._id || '']: e.target.value
                                      }));
                                    }}
                                    disabled={editedReporte.procesado}
                                  />
                                </div>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}

                  {/* Actividades Realizadas */}
                  {(editedReporte.actividadesRealizadas?.length || 0) > 0 && (
                    <div className="mb-4">
                      <h6 className="mb-3">
                        <FaCheckCircle className="me-2 text-success" />
                        Actividades Realizadas
                      </h6>
                      <ListGroup>
                        {editedReporte.actividadesRealizadas?.map((actividad, index) => (
                          <ListGroup.Item key={index} className="border-start border-success border-3">
                            <div className="d-flex align-items-start">
                              <div className="me-3 mt-1">
                                <FaCheckCircle className="text-success" />
                              </div>
                              <div className="flex-grow-1">
                                <div className="fw-bold text-success">
                                  {actividad.descripcion}
                                </div>
                                <small className="text-muted">
                                  Realizada
                                  {actividad.fecha && (
                                    <span> • Fecha: {new Date(actividad.fecha).toLocaleDateString('es-ES')}</span>
                                  )}
                                </small>
                                {actividad.observaciones && (
                                  <div className="mt-2">
                                    <Form.Label className="fw-bold small">Observaciones:</Form.Label>
                                    <Form.Control
                                      as="textarea"
                                      rows={2}
                                      value={actividad.observaciones || ''}
                                      onChange={(e) => handleActivityChange(index, 'observaciones', e.target.value)}
                                      disabled={editedReporte.procesado}
                                      className="mt-1"
                                      size="sm"
                                    />
                                  </div>
                                )}
                                {!actividad.observaciones && !editedReporte.procesado && (
                                  <div className="mt-2">
                                    <Form.Control
                                      as="textarea"
                                      rows={2}
                                      placeholder="Agregar observaciones..."
                                      value={actividad.observaciones || ''}
                                      onChange={(e) => handleActivityChange(index, 'observaciones', e.target.value)}
                                      disabled={editedReporte.procesado}
                                      className="mt-1"
                                      size="sm"
                                    />
                                  </div>
                                )}
                                {!editedReporte.procesado && (
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm" 
                                    className="mt-2"
                                    onClick={() => {
                                      // Remover actividad del array
                                      setEditedReporte(prev => {
                                        const currentActividades = prev.actividadesRealizadas || [];
                                        return {
                                          ...prev,
                                          actividadesRealizadas: currentActividades.filter(
                                            (act) => act._id !== actividad._id
                                          )
                                        };
                                      });
                                    }}
                                  >
                                    <FaTimes className="me-1" />
                                    Quitar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}

                  {/* Mensaje cuando todas las actividades están completadas */}
                  {actividadesProtocolo.length === 0 && 
                   (editedReporte.actividadesRealizadas?.length || 0) > 0 && (
                    <Alert variant="success">
                      <FaCheckCircle className="me-2" />
                      ¡Todas las actividades del protocolo han sido completadas!
                    </Alert>
                  )}

                  {/* Mensaje cuando no hay actividades */}
                  {!protocolo.data.actividadesMtto || protocolo.data.actividadesMtto.length === 0 && (
                    <Alert variant="warning">
                      <FaTools className="me-2" />
                      Este protocolo no tiene actividades definidas
                    </Alert>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Tab 3: Evidencias */}
        <Tab eventKey="evidences" title="📷 Evidencias">
          <Card className="mt-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Evidencias Fotográficas</h6>
              {!editedReporte.procesado && (
                <Button variant="primary" size="sm">
                  <FaCamera className="me-1" />
                  Subir Foto
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {editedReporte?.evidencias?.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <FaCamera size={32} className="mb-2 text-muted" />
                  <div>No hay evidencias registradas</div>
                  <small>Las fotos ayudan a documentar el estado del equipo</small>
                </Alert>
              ) : (
                <Row>
                  {editedReporte?.evidencias?.map((evidencia, index) => (
                    <Col md={4} key={index} className="mb-3">
                      <Card>
                        <Card.Img variant="top" src={evidencia.url} style={{ height: '150px', objectFit: 'cover' }} />
                        <Card.Body className="p-2">
                          <small className="text-muted">{evidencia.nombre}</small>
                          <div className="small text-muted">
                            {new Date(evidencia.fechaSubida).toLocaleDateString('es-ES')}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Tab 4: Repuestos */}
        <Tab eventKey="parts" title="🔧 Repuestos">
          <Card className="mt-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <FaCog className="me-2" />
                Gestión de Repuestos
              </h6>
              {!editedReporte.procesado && (
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSolicitarRepuesto}
                  >
                    <FaPlus className="me-1" />
                    Solicitar Repuesto
                  </Button>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={handleInstalarRepuestoDirecto}
                  >
                    <FaWrench className="me-1" />
                    Instalar Repuesto
                  </Button>
                </div>
              )}
            </Card.Header>
            <Card.Body>
              {(loadingRepuestosEquipo || loadingRepuestosReporte) && (
                <Alert variant="info">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Cargando repuestos...
                  </div>
                </Alert>
              )}

              {/* Repuestos combinados */}
              {repuestosCombinados.length > 0 ? (
                <div className="mb-4">
                  <h6 className="mb-3">
                    <Badge bg="primary" className="me-2">
                      {repuestosCombinados.length}
                    </Badge>
                    Repuestos del Equipo y Reporte
                  </h6>
                  
                  <ListGroup>
                    {repuestosCombinados.map((repuesto) => (
                      <ListGroup.Item 
                        key={repuesto._id} 
                        className={`d-flex justify-content-between align-items-start border-start border-3 ${
                          repuesto.origen === 'reporte' ? 'border-primary' : 'border-warning'
                        }`}
                      >
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <div className="fw-bold">{repuesto.nombre}</div>
                            <Badge 
                              bg={repuesto.origen === 'reporte' ? 'primary' : 'warning'} 
                              className="small"
                            >
                              {repuesto.origen === 'reporte' ? 'Del Reporte' : 'Del Equipo'}
                            </Badge>
                          </div>
                          <div className="text-muted small mb-1">
                            Cantidad: {repuesto.Cantidad}
                            {repuesto.PrecioRepuesto && (
                              <span> • Precio: {repuesto.PrecioRepuesto} {repuesto.Currency}</span>
                            )}
                          </div>
                          {repuesto.ResponsableSolicitud && (
                            <div className="text-muted small mb-1">
                              Solicitado por: <strong>
                                {typeof repuesto.ResponsableSolicitud === 'object' 
                                  ? `${repuesto.ResponsableSolicitud.firstName} ${repuesto.ResponsableSolicitud.lastName}`
                                  : repuesto.ResponsableSolicitud
                                }
                              </strong>
                            </div>
                          )}
                          {repuesto.observacion && (
                            <div className="text-muted small">
                              <strong>Observación:</strong> {repuesto.observacion}
                            </div>
                          )}
                          <div className="text-muted small">
                            Solicitado: {repuesto.FechaSolicitud ? new Date(repuesto.FechaSolicitud).toLocaleDateString('es-ES') : 'N/A'}
                            {repuesto.ReporteSolicitudId !== editedReporte._id && (
                              <span className="ms-2">
                                📍 <em>Solicitud de otro reporte</em>
                              </span>
                            )}
                            {repuesto.FechaInstalacion && (
                              <span> • Instalado: {new Date(repuesto.FechaInstalacion).toLocaleDateString('es-ES')}</span>
                            )}
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-2">
                          <div className="d-flex gap-1">
                            <Badge 
                              bg={
                                repuesto.EstadoSolicitud === 'Instalado' ? 'success' :
                                repuesto.EstadoSolicitud === 'Aprobado' ? 'info' :
                                repuesto.EstadoSolicitud === 'Solicitado' ? 'warning' : 'danger'
                              }
                            >
                              {repuesto.EstadoSolicitud}
                            </Badge>
                            {repuesto.Prioridad && (
                              <Badge 
                                bg={
                                  repuesto.Prioridad === 'Critica' ? 'danger' :
                                  repuesto.Prioridad === 'Alta' ? 'warning' :
                                  repuesto.Prioridad === 'Media' ? 'info' : 'secondary'
                                }
                              >
                                {repuesto.Prioridad}
                              </Badge>
                            )}
                          </div>
                          {!editedReporte.procesado && (
                            <div className="d-flex gap-1">
                              {/* Botón Instalar - solo para repuestos solicitados */}
                              {repuesto.EstadoSolicitud === 'Solicitado' && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleInstalarRepuesto(repuesto)}
                                >
                                  <FaWrench className="me-1" />
                                  Instalar
                                </Button>
                              )}
                              {/* Botón Editar - solo para repuestos del reporte */}
                              {repuesto.origen === 'reporte' && (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditarRepuesto(repuesto)}
                                >
                                  <FaEdit className="me-1" />
                                  Editar
                                </Button>
                              )}
                              {/* Botón Eliminar - solo para repuestos del reporte no instalados */}
                              {repuesto.origen === 'reporte' && repuesto.EstadoSolicitud !== 'Instalado' && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleEliminarRepuesto(repuesto)}
                                >
                                  <FaTimes className="me-1" />
                                  Eliminar
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              ) : (
                !(loadingRepuestosEquipo || loadingRepuestosReporte) && (
                  <Alert variant="info">
                    <FaCog className="me-2" />
                    No hay repuestos solicitados para este equipo o reporte
                  </Alert>
                )
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal de Confirmación */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Marcar como Procesado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>¿Está seguro de marcar este reporte como procesado?</strong>
          </Alert>
          <p>Esta acción:</p>
          <ul>
            <li>Registrará la fecha de procesamiento y mantenimiento</li>
            <li>Asignará te asignará como responsable del procesamiento</li>
            <li>Actualizará el progreso de la OT</li>
          </ul>
          
          <div className="mt-3">
            {/* Selector de estado final del report (estadooperativo) (select)*/}
            <Form.Group className="mb-3">
              <Form.Label>Estado Final</Form.Label>
              <Form.Select
                value={editedReporte.estadoOperativo}
                onChange={(e) => setEditedReporte(prev => ({
                  ...prev,
                  estadoOperativo: e.target.value as "Operativo" | "En Mantenimiento" | "Fuera de Servicio" | "Dado de Baja"
                }))}
              >
                <option value="Operativo">Operativo</option>
                <option value="En Mantenimiento">En mantenimiento</option>
                <option value="Fuera de Servicio">Fuera de servicio</option>
                <option value="Dado de Baja">Dado de Baja</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Procesado</Form.Label>
              <Form.Control
                type="date"
                value={fechaProcesado}
                onChange={(e) => setFechaProcesado(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <Form.Text className="text-muted">
                Seleccione la fecha en que se realizó el mantenimiento
              </Form.Text>
            </Form.Group>
            {/* Indicar observacion obligatoria si estadooperativo es "En mantenimiento","Fuera de Servicio" o "Dado de Baja" */}
            {(editedReporte.estadoOperativo === 'En Mantenimiento' || editedReporte.estadoOperativo === 'Fuera de Servicio' || editedReporte.estadoOperativo === 'Dado de Baja') && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  Observación sobre el estado final *
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Indique una observación sobre el estado final del equipo (obligatorio)..."
                  value={observacionEstadoFinal}
                  onChange={(e) => setObservacionEstadoFinal(e.target.value)}
                  required
                  className={observacionEstadoFinal.trim() ? '' : 'border-danger'}
                />
                <Form.Text className="text-danger">
                  Campo obligatorio. Debe especificar una observación sobre el estado final.
                </Form.Text>
              </Form.Group>
            )}
          </div>
          <div className="mt-3">
            <strong>Resumen del trabajo realizado:</strong>
            <ul>
              <li>Actividades completadas: {actividadesCompletadas}/{totalActividades} ({Math.round(progresoActividades)}%)</li>
              <li>Repuestos gestionados: {repuestosCombinados.length}</li>
            </ul>
          </div>
          
          {user && (
            <div className="mt-3 p-2 bg-light rounded">
              <small className="text-muted">
                <strong>Responsable del procesamiento:</strong> {user.firstName} {user.lastName} ({user.email})
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleMarkAsProcessed}
            disabled={
              (editedReporte.estadoOperativo === 'En Mantenimiento' || 
               editedReporte.estadoOperativo === 'Fuera de Servicio' || 
               editedReporte.estadoOperativo === 'Dado de Baja') && 
              !observacionEstadoFinal.trim()
            }
          >
            <FaCheck className="me-1" />
            Confirmar Procesado
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Cancelación de Reporte */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTimes className="me-2 text-danger" />
            Cancelar Reporte
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>⚠️ ¿Está seguro de cancelar este reporte?</strong>
          </Alert>
          
          <p className="mb-3">
            Al cancelar el reporte:
          </p>
          <ul>
            <li>El reporte se marcará como "Cancelado"</li>
            <li>No podrá editarse ni procesarse posteriormente</li>
            <li>El trabajo realizado quedará registrado pero sin efecto</li>
            <li>La OT asociada seguirá activa con los demás reportes</li>
          </ul>

            <Form.Group className="mb-3">
              <Form.Label>Estado Final</Form.Label>
              <Form.Select
                value={editedReporte.estadoOperativo}
                onChange={(e) => setEditedReporte(prev => ({
                  ...prev,
                  estadoOperativo: e.target.value as "Operativo" | "En Mantenimiento" | "Fuera de Servicio" | "Dado de Baja"
                }))}
              >
                <option value="Operativo">Operativo</option>
                <option value="En Mantenimiento">En mantenimiento</option>
                <option value="Fuera de Servicio">Fuera de servicio</option>
                <option value="Dado de Baja">Dado de Baja</option>
              </Form.Select>
            </Form.Group>

          <Form.Group className="mt-4">
            <Form.Label className="fw-bold">
              Motivo de Cancelación *
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Indique el motivo por el cual se cancela este reporte (obligatorio)..."
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              required
              className={motivoCancelacion.trim() ? '' : 'border-danger'}
            />
            <Form.Text className="text-danger">
              Campo obligatorio. Debe especificar el motivo de la cancelación.
            </Form.Text>
          </Form.Group>

          {user && (
            <div className="mt-3 p-2 bg-light rounded">
              <small className="text-muted">
                <strong>Cancelado por:</strong> {user.firstName} {user.lastName} ({user.email})
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowCancelModal(false);
              setMotivoCancelacion('');
            }}
          >
            Volver
          </Button>
          <Button 
            variant="danger" 
            onClick={handleCancelReport}
            disabled={!motivoCancelacion.trim()}
          >
            <FaTimes className="me-1" />
            Confirmar Cancelación
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Solicitar Repuesto */}
      {editedReporte?.orden?._id && editedReporte.Equipo?._id && (
        <SolicitarRepuestoModal
          show={showSolicitarModal}
          onHide={handleCloseSolicitarModal}
          reporteId={editedReporte._id || ''}
          otId={editedReporte.orden._id}
          equipoId={editedReporte.Equipo._id}
        />
      )}

      {/* Modal para Instalar Repuesto */}
      {repuestoToInstall && (
        <InstalarRepuestoModal
          show={showInstalarModal}
          onHide={handleCloseInstalarModal}
          repuesto={repuestoToInstall}
          reporteId={editedReporte._id || ''}
        />
      )}

      {/* Modal para Instalar Repuesto Directamente */}
      {editedReporte?.orden?._id && editedReporte.Equipo?._id && (
        <InstalarRepuestoDirectoModal
          show={showInstalarDirectoModal}
          onHide={handleCloseInstalarDirectoModal}
          reporteId={editedReporte._id || ''}
          otId={editedReporte.orden._id}
          equipoId={editedReporte.Equipo._id}
        />
      )}
      {/* Modal para Editar Equipo */}
      {editedReporte?.Equipo?._id && editedReporte._id && (
        <EditEquipoModal
          show={showEditEquipoModal}
          onHide={handleCloseEditEquipoModal}
          equipo={editedReporte.Equipo}
          reporteId={editedReporte._id}
          onSuccess={handleEquipoUpdateSuccess}
        />
      )}

      {/* Modal para Editar Repuesto */}
      {repuestoToEdit && (
        <Modal show={showEditarModal} onHide={handleCloseEditarModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <FaEdit className="me-2" />
              Editar Repuesto
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              nombre: formData.get('nombre') as string,
              Cantidad: formData.get('Cantidad') as string,
              observacion: formData.get('observacion') as string,
              PrecioRepuesto: parseFloat(formData.get('PrecioRepuesto') as string) || 0,
              Prioridad: formData.get('Prioridad') as string,
            };
            
            updateRepuestoMutation.mutateAsync({
              id: repuestoToEdit._id!,
              data
            }).then(() => {
              alert('Repuesto actualizado exitosamente');
              handleCloseEditarModal();
            }).catch((error) => {
              console.error('Error al actualizar repuesto:', error);
              alert('Error al actualizar el repuesto');
            });
          }}>
            <Modal.Body>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre del Repuesto *</Form.Label>
                    <Form.Control
                      name="nombre"
                      type="text"
                      defaultValue={repuestoToEdit.nombre}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cantidad *</Form.Label>
                    <Form.Control
                      name="Cantidad"
                      type="text"
                      defaultValue={repuestoToEdit.Cantidad}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Precio</Form.Label>
                    <Form.Control
                      name="PrecioRepuesto"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={repuestoToEdit.PrecioRepuesto || 0}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prioridad</Form.Label>
                    <Form.Select name="Prioridad" defaultValue={repuestoToEdit.Prioridad || 'Media'}>
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Critica">Crítica</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Observaciones</Form.Label>
                <Form.Control
                  name="observacion"
                  as="textarea"
                  rows={3}
                  defaultValue={repuestoToEdit.observacion || ''}
                />
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseEditarModal}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={updateRepuestoMutation.isPending}
              >
                {updateRepuestoMutation.isPending ? 'Actualizando...' : 'Actualizar Repuesto'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default ReportDetail;