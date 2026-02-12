import React, { useState, useMemo, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Spinner, Alert, Badge, Table,
  Tab, Tabs, Button, Nav, Form
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaFileAlt, FaHistory, FaExchangeAlt, FaTools, FaCog,
  FaPrint, FaEdit, FaSave, FaCheck, FaTimes, FaClipboardList, FaMagic, FaPlus
} from 'react-icons/fa';
import { 
  useHVEquipoByEquipoId, 
  useHVEquiposByMarcaModelo,
  useCreateHVEquipo,
  useUpdateHVEquipo
} from '@/hooks/useHVEquipo';
import { useEquipoItem, useEquipoItemPopulated } from '@/hooks/useEquipoItems';
import { useReportesByEquipo } from '@/hooks/useReportes';
import { Reporte } from '@/types/reporte.types';
import { CreateHVEquipoDto, UpdateHVEquipoDto } from '@/types/hvEquipo.types';
import Swal from 'sweetalert2';
import './HVEquipoPage.css';

const HVEquipoPage: React.FC = () => {
  const { equipoId } = useParams<{ equipoId: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<string>('hoja-vida');
  const [isEditingHV, setIsEditingHV] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateHVEquipoDto>>({});

  // Queries
  const { data: hvData, isLoading: loadingHV, refetch: refetchHV } = useHVEquipoByEquipoId(
    equipoId || '',
    { retry: 1 }
  );
  
  const { data: equipoData, isLoading: loadingEquipo } = useEquipoItemPopulated(equipoId || '');
  
  // Get reportes by equipoId
  const { data: reportesData, isLoading: loadingReportes } = useReportesByEquipo(
    equipoId || '',
    { page: 1, limit: 100 }
  );

  // Mutations
  const createHVMutation = useCreateHVEquipo();
  const updateHVMutation = useUpdateHVEquipo();
  
  const reportes: Reporte[] = reportesData?.data || [];
  
  const hvEquipo = hvData?.data || null; // Asumimos que el backend devuelve un array, tomamos el primer elemento o null si no hay HV
  const equipo = equipoData?.data;
  const equipoInfo = typeof equipo === 'object' ? equipo : null;

  // Initialize formData when hvEquipo or equipo changes
  useEffect(() => {
    if (hvEquipo) {
      // Si existe HV, cargar sus datos
      setFormData({
        clienteId: typeof hvEquipo.clienteId === 'object' ? hvEquipo.clienteId._id : hvEquipo.clienteId,
        EquipoId: typeof hvEquipo.EquipoId === 'object' ? hvEquipo.EquipoId._id : hvEquipo.EquipoId,
        Accesorios: hvEquipo.Accesorios || [],
        TecnologiaPredominante: hvEquipo.TecnologiaPredominante || '',
        EstadoHV: hvEquipo.EstadoHV || 'Guardada',
        Fabricante: hvEquipo.Fabricante || '',
        FechaAdquisicin: hvEquipo.FechaAdquisicin || '',
        FechaInstalacion: hvEquipo.FechaInstalacion || '',
        FechaFuncionamiento: hvEquipo.FechaFuncionamiento || '',
        ValorAdquisicion: hvEquipo.ValorAdquisicion,
        TipoAdquisicion: hvEquipo.TipoAdquisicion,
        UsoEquipo: hvEquipo.UsoEquipo,
        RequiereCalibracion: hvEquipo.RequiereCalibracion || false,
        PeriodicidadCalibracion: hvEquipo.PeriodicidadCalibracion || '',
        PeriodicidadMantenimiento: hvEquipo.PeriodicidadMantenimiento || '',
        RegistroINVIMA: hvEquipo.RegistroINVIMA || '',
        ClasificacinRiesgo: hvEquipo.ClasificacinRiesgo,
        TipoEquipo: hvEquipo.TipoEquipo || '',
        Voltaje: hvEquipo.Voltaje || '',
        Frecuencia: hvEquipo.Frecuencia || '',
        Potencia: hvEquipo.Potencia || '',
        Corriente: hvEquipo.Corriente || '',
        Peso: hvEquipo.Peso,
        FuenteAlimentacion: hvEquipo.FuenteAlimentacion || '',
        AutonomiaBatería: hvEquipo.AutonomiaBatería || '',
        TemperaturaOperacion: hvEquipo.TemperaturaOperacion || '',
        HumedadOperacion: hvEquipo.HumedadOperacion || '',
        NombreProveedor: hvEquipo.NombreProveedor || '',
        TelefonoProveedor: hvEquipo.TelefonoProveedor || '',
        EmailProveedor: hvEquipo.EmailProveedor || '',
        DireccionProveedor: hvEquipo.DireccionProveedor || '',
        ManualDisponible: hvEquipo.ManualDisponible || false,
        PlanoDisponible: hvEquipo.PlanoDisponible || false,
        RequiereCapacitacion: hvEquipo.RequiereCapacitacion || false,
        Recomendaciones: hvEquipo.Recomendaciones || '',
      });
    } else if (equipoInfo) {
      // Si no existe HV, inicializar con datos del equipo
      const ClienteId = equipoInfo.ClienteId;
      const clienteId = ClienteId && typeof ClienteId === 'object' ? (ClienteId as any)._id : ClienteId;
      setFormData({
        clienteId: clienteId || '',
        EquipoId: equipoInfo._id || equipoId || '',
        EstadoHV: 'Guardada',
        Accesorios: [],
        Recomendaciones: '',
        RequiereCalibracion: false,
        ManualDisponible: false,
        PlanoDisponible: false,
        RequiereCapacitacion: false,
      });
    }
  }, [hvEquipo, equipoInfo, equipoId]);

  // Filtered reportes
  const reportesPreventivos = useMemo(() => 
    reportes.filter(r => r.tipoMtto === 'Preventivo'),
    [reportes]
  );

  const reportesCorrectivos = useMemo(() => 
    reportes.filter(r => r.tipoMtto !== 'Preventivo'),
    [reportes]
  );

  // Timeline data - Changes in location/service
  const timelineData = useMemo(() => {
    if (!reportes.length) return [];
    
    // Ordenar reportes por fecha
    const sortedReportes = reportes
      .filter(r => r.equipoSnapshot)
      .sort((a, b) => new Date(a.fechaProcesado || a.fechaMtto || '').getTime() - new Date(b.fechaProcesado || b.fechaMtto || '').getTime());

    if (sortedReportes.length === 0) return [];

    // Detectar cambios entre reportes sucesivos
    const cambios: any[] = [];
    
    // Siempre incluir el primer registro (estado inicial)
    const primerReporte = sortedReportes[0];
    cambios.push({
      fecha: primerReporte.fechaProcesado || primerReporte.fechaMtto || '',
      reporteId: primerReporte._id,
      consecutivo: primerReporte.consecutivo,
      tipoMtto: primerReporte.tipoMtto,
      snapshot: primerReporte.equipoSnapshot,
      cambiosDetectados: ['Estado Inicial'],
      esInicial: true
    });

    // Comparar cada reporte con el anterior
    for (let i = 1; i < sortedReportes.length; i++) {
      const reporteActual = sortedReportes[i];
      const reporteAnterior = sortedReportes[i - 1];
      
      const snapActual = reporteActual.equipoSnapshot;
      const snapAnterior = reporteAnterior.equipoSnapshot;
      
      const cambiosEncontrados: string[] = [];
      
      // Comparar campos relevantes
      if (snapActual.Sede !== snapAnterior.Sede) {
        cambiosEncontrados.push(`Sede: ${snapAnterior.Sede || 'N/A'} → ${snapActual.Sede || 'N/A'}`);
      }
      if (snapActual.Servicio !== snapAnterior.Servicio) {
        cambiosEncontrados.push(`Servicio: ${snapAnterior.Servicio || 'N/A'} → ${snapActual.Servicio || 'N/A'}`);
      }
      if (snapActual.Ubicacion !== snapAnterior.Ubicacion) {
        cambiosEncontrados.push(`Ubicación: ${snapAnterior.Ubicacion || 'N/A'} → ${snapActual.Ubicacion || 'N/A'}`);
      }
      if (snapActual.Marca !== snapAnterior.Marca) {
        cambiosEncontrados.push(`Marca: ${snapAnterior.Marca || 'N/A'} → ${snapActual.Marca || 'N/A'}`);
      }
      if (snapActual.Modelo !== snapAnterior.Modelo) {
        cambiosEncontrados.push(`Modelo: ${snapAnterior.Modelo || 'N/A'} → ${snapActual.Modelo || 'N/A'}`);
      }
      if (snapActual.Serie !== snapAnterior.Serie) {
        cambiosEncontrados.push(`Serie: ${snapAnterior.Serie || 'N/A'} → ${snapActual.Serie || 'N/A'}`);
      }
      if (snapActual.Inventario !== snapAnterior.Inventario) {
        cambiosEncontrados.push(`Inventario: ${snapAnterior.Inventario || 'N/A'} → ${snapActual.Inventario || 'N/A'}`);
      }
      
      // Solo agregar si hay cambios detectados
      if (cambiosEncontrados.length > 0) {
        cambios.push({
          fecha: reporteActual.fechaProcesado || reporteActual.fechaMtto || '',
          reporteId: reporteActual._id,
          consecutivo: reporteActual.consecutivo,
          tipoMtto: reporteActual.tipoMtto,
          snapshot: snapActual,
          cambiosDetectados: cambiosEncontrados,
          esInicial: false
        });
      }
    }
    
    return cambios;
  }, [reportes]);
  // Repuestos data
  const repuestosHistorial = useMemo(() => {
    return reportes
      .filter(r => r.repuestos && r.repuestos.length > 0)
      .flatMap(r => r.repuestos?.map(rep => ({
        ...rep,
        reporteId: r._id,
        fechaReporte: r.fechaMtto
      })) || []);
  }, [reportes]);

  const handlePrint = () => {
    window.print();
  };

  const handleEditHV = () => {
    setIsEditingHV(true);
  };

  const handleAutocompletar = async () => {
    if (!equipoInfo?.Marca || !equipoInfo?.Modelo) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos Incompletos',
        text: 'El equipo debe tener marca y modelo para autocompletar',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      const result = await Swal.fire({
        icon: 'question',
        title: 'Autocompletar Hoja de Vida',
        html: `¿Desea buscar una HV aprobada con la misma marca y modelo?<br/><br/><strong>Marca:</strong> ${equipoInfo.Marca}<br/><strong>Modelo:</strong> ${equipoInfo.Modelo}`,
        showCancelButton: true,
        confirmButtonText: 'Buscar y Autocompletar',
        cancelButtonText: 'Cancelar',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            // Importar el servicio directamente para hacer la llamada
            const { hvEquipoService } = await import('@/services/hvEquipo.service');
            const response = await hvEquipoService.getByMarcaModelo(
              equipoInfo.Marca || '',
              equipoInfo.Modelo || '',
              { EstadoHV: 'Aprobada' }
            );
            return response;
          } catch (error) {
            console.error('Error en preConfirm:', error);
            Swal.showValidationMessage('Error al buscar HV aprobadas');
            return null;
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
      });

      if (result.isConfirmed && result.value?.data && result.value.data.length > 0) {
        const hvAprobada = result.value.data[0];
        
        // Copiar datos de la HV aprobada (excepto IDs y estado)
        setFormData(prev => ({
          ...prev,
          TecnologiaPredominante: hvAprobada.TecnologiaPredominante,
          Fabricante: hvAprobada.Fabricante,
          TipoAdquisicion: hvAprobada.TipoAdquisicion,
          UsoEquipo: hvAprobada.UsoEquipo,
          RequiereCalibracion: hvAprobada.RequiereCalibracion,
          PeriodicidadCalibracion: hvAprobada.PeriodicidadCalibracion,
          PeriodicidadMantenimiento: hvAprobada.PeriodicidadMantenimiento,
          RegistroINVIMA: hvAprobada.RegistroINVIMA,
          ClasificacinRiesgo: hvAprobada.ClasificacinRiesgo,
          TipoEquipo: hvAprobada.TipoEquipo,
          Voltaje: hvAprobada.Voltaje,
          Frecuencia: hvAprobada.Frecuencia,
          Potencia: hvAprobada.Potencia,
          Corriente: hvAprobada.Corriente,
          Peso: hvAprobada.Peso,
          FuenteAlimentacion: hvAprobada.FuenteAlimentacion,
          AutonomiaBatería: hvAprobada.AutonomiaBatería,
          TemperaturaOperacion: hvAprobada.TemperaturaOperacion,
          HumedadOperacion: hvAprobada.HumedadOperacion,
          NombreProveedor: hvAprobada.NombreProveedor,
          TelefonoProveedor: hvAprobada.TelefonoProveedor,
          EmailProveedor: hvAprobada.EmailProveedor,
          DireccionProveedor: hvAprobada.DireccionProveedor,
          ManualDisponible: hvAprobada.ManualDisponible,
          PlanoDisponible: hvAprobada.PlanoDisponible,
          RequiereCapacitacion: hvAprobada.RequiereCapacitacion,
          Recomendaciones: hvAprobada.Recomendaciones,
          Accesorios: hvAprobada.Accesorios,
        }));

        Swal.fire({
          icon: 'success',
          title: '¡Autocompletado Exitoso!',
          text: 'Los datos fueron copiados desde una HV aprobada',
          timer: 2000,
          showConfirmButton: false
        });
      } else if (result.isConfirmed) {
        Swal.fire({
          icon: 'info',
          title: 'Sin Resultados',
          text: 'No se encontró ninguna HV aprobada con esta marca y modelo',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error) {
      console.error('Error al autocompletar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al buscar HV aprobadas',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleSaveHV = async () => {
    try {
      // Validación básica
      if (!formData.EquipoId || !formData.clienteId) {
        Swal.fire({
          icon: 'warning',
          title: 'Datos Incompletos',
          text: 'Faltan datos requeridos para guardar la hoja de vida',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      Swal.fire({
        title: 'Guardando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Construir equipoSnapshot con los datos actuales del equipo
      const equipoSnapshot = equipoInfo ? {
        ItemText: equipoInfo.ItemId?.Nombre || '',
        Marca: equipoInfo.Marca || '',
        Modelo: equipoInfo.Modelo || '',
        Serie: equipoInfo.Serie || '',
        Inventario: equipoInfo.Inventario || '',
        Servicio: typeof equipoInfo.Servicio === 'object' 
          ? equipoInfo.Servicio?.nombre 
          : equipoInfo.Servicio || '',
        Ubicacion: equipoInfo.Ubicacion || '',
        Sede: equipoInfo.SedeId?.nombreSede || '',
        MesesMtto: equipoInfo.mesesMtto || []
      } : undefined;

      // Agregar equipoSnapshot al formData
      const dataToSave = {
        ...formData,
        equipoSnapshot
      };

      if (hvEquipo?._id) {
        // Actualizar HV existente
        await updateHVMutation.mutateAsync({
          id: hvEquipo._id,
          data: dataToSave as UpdateHVEquipoDto
        });
      } else {
        // Crear nueva HV
        await createHVMutation.mutateAsync(dataToSave as CreateHVEquipoDto);
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Guardado Exitoso!',
        text: hvEquipo ? 'La hoja de vida ha sido actualizada' : 'La hoja de vida ha sido creada',
        timer: 2000,
        showConfirmButton: false
      });
      
      setIsEditingHV(false);
      refetchHV();
    } catch (error: any) {
      console.error('Error al guardar HV:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo guardar la hoja de vida',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleAprobar = async () => {
    if (!hvEquipo?._id) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede aprobar',
        text: 'Debe guardar la hoja de vida antes de aprobarla',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: '¿Aprobar Hoja de Vida?',
      text: 'Una vez aprobada, esta HV podrá usarse como referencia para autocompletar',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Aprobando...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        // Construir equipoSnapshot con los datos actuales del equipo
        const equipoSnapshot = equipoInfo ? {
          ItemText: equipoInfo.ItemId?.Nombre || '',
          Marca: equipoInfo.Marca || '',
          Modelo: equipoInfo.Modelo || '',
          Serie: equipoInfo.Serie || '',
          Inventario: equipoInfo.Inventario || '',
          Servicio: typeof equipoInfo.Servicio === 'object' 
            ? equipoInfo.Servicio?.nombre 
            : equipoInfo.Servicio || '',
          Ubicacion: equipoInfo.Ubicacion || '',
          Sede: equipoInfo.SedeId?.nombreSede || '',
          MesesMtto: equipoInfo.mesesMtto || []
        } : undefined;

        await updateHVMutation.mutateAsync({
          id: hvEquipo._id,
          data: { 
            ...formData, 
            EstadoHV: 'Aprobada',
            equipoSnapshot 
          } as UpdateHVEquipoDto
        });

        await Swal.fire({
          icon: 'success',
          title: '¡HV Aprobada!',
          text: 'La hoja de vida ha sido aprobada exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
        
        setIsEditingHV(false);
        refetchHV();
      } catch (error: any) {
        console.error('Error al aprobar HV:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'No se pudo aprobar la hoja de vida',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funciones para manejar accesorios
  const handleAddAccesorio = () => {
    const newAccesorio = {
      nombre: '',
      descripcion: '',
      cantidad: 1,
      estado: 'Bueno' as const,
      observaciones: ''
    };
    setFormData(prev => ({
      ...prev,
      Accesorios: [...(prev.Accesorios || []), newAccesorio]
    }));
  };

  const handleRemoveAccesorio = (index: number) => {
    setFormData(prev => ({
      ...prev,
      Accesorios: (prev.Accesorios || []).filter((_, i) => i !== index)
    }));
  };

  const handleAccesorioChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      Accesorios: (prev.Accesorios || []).map((acc, i) => 
        i === index ? { ...acc, [field]: value } : acc
      )
    }));
  };

  // Función para manejar recomendaciones
  const handleRecomendacionesChange = (text: string) => {
    // Guardar el texto tal como está (Recomendaciones es un string en el backend)
    setFormData(prev => ({
      ...prev,
      Recomendaciones: text
    }));
  };

  const getRecomendacionesText = (): string => {
    // Devolver Recomendaciones como string, manejar tanto string como array
    const rec = formData.Recomendaciones as any;
    
    if (!rec) return '';
    
    if (typeof rec === 'string') {
      return rec;
    }
    
    if (Array.isArray(rec)) {
      return (rec as string[]).join('\n');
    }
    
    return '';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CO');
  };

  if (loadingHV || loadingEquipo) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Cargando información del equipo...</p>
      </Container>
   );
  }

  if (!equipo) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Equipo no encontrado</Alert.Heading>
          <p>No se pudo cargar la información del equipo.</p>
          <Button variant="outline-warning" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </Alert>
      </Container>
    );
  }

  // Datos compilados para la vista
  const clienteInfo = hvEquipo && typeof hvEquipo.clienteId === 'object' ? hvEquipo.clienteId : null;
  const clienteInfoEquipo = (equipoInfo && typeof equipoInfo.ClienteId === 'object' ? equipoInfo.ClienteId : null) as any;
  const itemFoto = equipoInfo?.ItemId ? (equipoInfo.ItemId as any)?.Foto : null;
  
  return (
    <Container fluid className="hv-equipo-page py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-3">
            <div className="logo-container">
              {(clienteInfo?.Logo || clienteInfoEquipo?.Logo) ? (
                <img src={clienteInfo?.Logo || clienteInfoEquipo?.Logo} alt="Logo" className="client-logo" />
              ) : (
                <div className="logo-placeholder">
                  <FaFileAlt size={32} />
                </div>
              )}
            </div>
            <div className="flex-grow-1">
              <h1 className="mb-1">Hoja de Vida de Equipo Biomédico</h1>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <Badge bg="primary">{equipoInfo?.ItemId?.Nombre || 'Equipo'}</Badge>
                <Badge bg="secondary">{equipoInfo?.Marca || 'N/A'} {equipoInfo?.Modelo || ''}</Badge>
                <Badge bg="info">Serie: {equipoInfo?.Serie || 'N/A'}</Badge>
                {hvEquipo && (
                  <Badge bg={hvEquipo.EstadoHV === 'Aprobada' ? 'success' : 'warning'}>
                    {hvEquipo.EstadoHV}
                  </Badge>
                )}
              </div>
            </div>
            <div className="action-buttons">
              <Button variant="outline-primary" size="sm" onClick={handlePrint}>
                <FaPrint className="me-1" /> Imprimir
              </Button>
              {!isEditingHV ? (
                <>
                  <Button variant="primary" size="sm" onClick={handleEditHV}>
                    <FaEdit className="me-1" /> Editar
                  </Button>
                  {hvEquipo && hvEquipo.EstadoHV !== 'Aprobada' && (
                    <Button variant="success" size="sm" onClick={handleAprobar}>
                      <FaCheck className="me-1" /> Aprobar
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button 
                    variant="outline-info" 
                    size="sm" 
                    onClick={handleAutocompletar}
                    title="Buscar HV aprobada con misma marca/modelo"
                  >
                    <FaMagic className="me-1" /> Autocompletar
                  </Button>
                  <Button variant="success" size="sm" onClick={handleSaveHV}>
                    <FaSave className="me-1" /> Guardar
                  </Button>
                  {hvEquipo && hvEquipo.EstadoHV !== 'Aprobada' && (
                    <Button variant="warning" size="sm" onClick={handleAprobar}>
                      <FaCheck className="me-1" /> Guardar y Aprobar
                    </Button>
                  )}
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => {
                      setIsEditingHV(false);
                      // Los datos se recargarán automáticamente desde el useEffect
                    }}
                  >
                    <FaTimes className="me-1" /> Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Tabs Navigation */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'hoja-vida')}
        className="mb-4 hv-tabs"
      >
        {/* TAB 1: HOJA DE VIDA */}
        <Tab
          eventKey="hoja-vida"
          title={
            <span>
              <FaFileAlt className="me-2" />
              Hoja de Vida
            </span>
          }
        >
          <Card>
            <Card.Body>
              {/* Mensaje informativo si no hay HV */}
              {!hvEquipo && !isEditingHV && (
                <Alert variant="info" className="mb-4">
                  <Alert.Heading>📋 Sin Hoja de Vida Guardada</Alert.Heading>
                  <p>Este equipo aún no tiene una hoja de vida registrada. Puede ver los datos del equipo y crear una nueva hoja de vida.</p>
                </Alert>
              )}
              
              {isEditingHV && (
                <Alert variant="warning" className="mb-4">
                  <strong>Modo Edición:</strong> Complete los campos y haga clic en "Guardar" para {hvEquipo ? 'actualizar' : 'crear'} la hoja de vida.
                </Alert>
              )}

              <div className="hv-content">
                  {/* Foto del Equipo */}
                  {itemFoto && (
                    <Row className="mb-4">
                      <Col md={12} className="text-center">
                        <Card className="shadow-sm">
                          <Card.Body>
                            <img 
                              src={itemFoto} 
                              alt={equipoInfo?.ItemId?.Nombre}
                              className="equipo-foto"
                              style={{ maxHeight: '300px', objectFit: 'contain' }}
                            />
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}

                  {/* Identificación de la Institución */}
                  <div className="hv-section">
                    <h5 className="section-header">Identificación de la Institución</h5>
                    <Row>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Institución:</label>
                          <div className="field-value">
                            {(clienteInfo?.Razonsocial || clienteInfoEquipo?.Razonsocial) || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>NIT:</label>
                          <div className="field-value">
                            {(clienteInfo?.Nit || clienteInfoEquipo?.Nit) || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Ciudad:</label>
                          <div className="field-value">
                            {(clienteInfo?.Ciudad || clienteInfoEquipo?.Ciudad)}, {(clienteInfo?.Departamento || clienteInfoEquipo?.Departamento)}
                          </div>
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Dirección:</label>
                          <div className="field-value">
                            {(clienteInfo?.Direccion || clienteInfoEquipo?.Direccion) || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Teléfono:</label>
                          <div className="field-value">
                            {(clienteInfo?.TelContacto || clienteInfoEquipo?.TelContacto) || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Email:</label>
                          <div className="field-value">
                            {(clienteInfo?.Email || clienteInfoEquipo?.Email) || 'N/A'}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                {/* Datos del Equipo */}
                  <div className="hv-section">
                    <h5 className="section-header">Datos del Equipo</h5>

                    <Row className="mb-3">
                      <Col md={6}>
                        <div className="field-group">
                          <label>Equipo:</label>
                          <div className="field-value">{equipoInfo?.ItemId?.Nombre || 'N/A'}</div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Marca:</label>
                          <div className="field-value">{equipoInfo?.Marca || 'N/A'}</div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Modelo:</label>
                          <div className="field-value">{equipoInfo?.Modelo || 'N/A'}</div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>No. Serie:</label>
                          <div className="field-value">{equipoInfo?.Serie || 'N/A'}</div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Inventario:</label>
                          <div className="field-value">{equipoInfo?.Inventario || 'N/A'}</div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Ubicación:</label>
                          <div className="field-value">{equipoInfo?.Ubicacion || 'N/A'}</div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Servicio:</label>
                          <div className="field-value">
                            {typeof equipoInfo?.Servicio === 'object'
                              ? equipoInfo?.Servicio?.nombre
                              : 'N/A'}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Proveedor */}
                  <div className="hv-section">
                    <h5 className="section-header">Información del Proveedor</h5>
                    <Row className="mb-2">
                      <Col md={4}>
                        <div className="field-group">
                          <label>Proveedor:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.NombreProveedor || ''}
                              onChange={(e) => handleFieldChange('NombreProveedor', e.target.value)}
                              size="sm"
                              placeholder="Nombre del proveedor"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.NombreProveedor || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Teléfono:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.TelefonoProveedor || ''}
                              onChange={(e) => handleFieldChange('TelefonoProveedor', e.target.value)}
                              size="sm"
                              placeholder="Teléfono"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.TelefonoProveedor || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Email:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="email"
                              value={formData.EmailProveedor || ''}
                              onChange={(e) => handleFieldChange('EmailProveedor', e.target.value)}
                              size="sm"
                              placeholder="Email"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.EmailProveedor || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                        <div className="field-group">
                          <label>Dirección:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.DireccionProveedor || ''}
                              onChange={(e) => handleFieldChange('DireccionProveedor', e.target.value)}
                              size="sm"
                              placeholder="Dirección del proveedor"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.DireccionProveedor || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Adquisición */}
                  <div className="hv-section">
                    <h5 className="section-header">Información de Adquisición</h5>
                    <Row>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Tipo Adquisición:</label>
                          {isEditingHV ? (
                            <Form.Select
                              value={formData.TipoAdquisicion || ''}
                              onChange={(e) => handleFieldChange('TipoAdquisicion', e.target.value)}
                              size="sm"
                            >
                              <option value="">Seleccionar...</option>
                              <option value="Compra">Compra</option>
                              <option value="Donación">Donación</option>
                              <option value="Comodato">Comodato</option>
                              <option value="Leasing">Leasing</option>
                              <option value="Otro">Otro</option>
                            </Form.Select>
                          ) : (
                            <div className="field-value">
                              <Badge bg="info">{hvEquipo?.TipoAdquisicion || 'N/A'}</Badge>
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Valor Adquisición:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="number"
                              value={formData.ValorAdquisicion || ''}
                              onChange={(e) => handleFieldChange('ValorAdquisicion', parseFloat(e.target.value) || 0)}
                              size="sm"
                              placeholder="Valor en COP"
                            />
                          ) : (
                            <div className="field-value fw-bold">
                              {hvEquipo?.ValorAdquisicion 
                                ? formatCurrency(hvEquipo.ValorAdquisicion) 
                                : 'N/A'}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Uso del Equipo:</label>
                          {isEditingHV ? (
                            <Form.Select
                              value={formData.UsoEquipo || ''}
                              onChange={(e) => handleFieldChange('UsoEquipo', e.target.value)}
                              size="sm"
                            >
                              <option value="">Seleccionar...</option>
                              <option value="Apoyo">Apoyo</option>
                              <option value="Soporte">Soporte</option>
                              <option value="Produccion">Producción</option>
                              <option value="Investigacion">Investigación</option>
                              <option value="Docencia">Docencia</option>
                            </Form.Select>
                          ) : (
                            <div className="field-value">
                              <Badge bg="warning" text="dark">{hvEquipo?.UsoEquipo || 'N/A'}</Badge>
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>
                                    {/* Fechas Importantes */}
                  <div className="hv-section">
                    <h5 className="section-header">Fechas Importantes</h5>
                    <Row>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Fecha Adquisición:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="date"
                              value={formData.FechaAdquisicin ? formData.FechaAdquisicin.split('T')[0] : ''}
                              onChange={(e) => handleFieldChange('FechaAdquisicin', e.target.value)}
                              size="sm"
                            />
                          ) : (
                            <div className="field-value">
                              {formatDate(hvEquipo?.FechaAdquisicin)}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Fecha Instalación:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="date"
                              value={formData.FechaInstalacion ? formData.FechaInstalacion.split('T')[0] : ''}
                              onChange={(e) => handleFieldChange('FechaInstalacion', e.target.value)}
                              size="sm"
                            />
                          ) : (
                            <div className="field-value">
                              {formatDate(hvEquipo?.FechaInstalacion)}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Puesta en Funcionamiento:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="date"
                              value={formData.FechaFuncionamiento ? formData.FechaFuncionamiento.split('T')[0] : ''}
                              onChange={(e) => handleFieldChange('FechaFuncionamiento', e.target.value)}
                              size="sm"
                            />
                          ) : (
                            <div className="field-value">
                              {formatDate(hvEquipo?.FechaFuncionamiento)}
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Características Eléctricas */}
                  <div className="hv-section">
                    <h5 className="section-header">Registro Técnico y Características Eléctricas</h5>
                    <Row className="mb-3">
                      <Col md={3}>
                        <div className="field-group">
                          <label>Voltaje (V):</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.Voltaje || ''}
                              onChange={(e) => handleFieldChange('Voltaje', e.target.value)}
                              size="sm"
                              placeholder="Ej: 110-220"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.Voltaje || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Corriente (A):</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.Corriente || ''}
                              onChange={(e) => handleFieldChange('Corriente', e.target.value)}
                              size="sm"
                              placeholder="Ej: 5"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.Corriente || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Frecuencia (Hz):</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.Frecuencia || ''}
                              onChange={(e) => handleFieldChange('Frecuencia', e.target.value)}
                              size="sm"
                              placeholder="Ej: 50/60"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.Frecuencia || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Potencia (W):</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.Potencia || ''}
                              onChange={(e) => handleFieldChange('Potencia', e.target.value)}
                              size="sm"
                              placeholder="Ej: 500"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.Potencia || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Peso (kg):</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="number"
                              value={formData.Peso || ''}
                              onChange={(e) => handleFieldChange('Peso', parseFloat(e.target.value))}
                              size="sm"
                              placeholder="Peso"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.Peso || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Temperatura Operación:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.TemperaturaOperacion || ''}
                              onChange={(e) => handleFieldChange('TemperaturaOperacion', e.target.value)}
                              size="sm"
                              placeholder="Ej: 10-35°C"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.TemperaturaOperacion || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Humedad Operación:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.HumedadOperacion || ''}
                              onChange={(e) => handleFieldChange('HumedadOperacion', e.target.value)}
                              size="sm"
                              placeholder="Ej: 30-75%"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.HumedadOperacion || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Fuente Alimentación:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.FuenteAlimentacion || ''}
                              onChange={(e) => handleFieldChange('FuenteAlimentacion', e.target.value)}
                              size="sm"
                              placeholder="Ej: Red eléctrica"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.FuenteAlimentacion || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                    </Row>
                    {(isEditingHV || hvEquipo?.AutonomiaBatería) && (
                      <Row className="mt-2">
                        <Col md={4}>
                          <div className="field-group">
                            <label>Autonomía Batería:</label>
                            {isEditingHV ? (
                              <Form.Control
                                type="text"
                                value={formData.AutonomiaBatería || ''}
                                onChange={(e) => handleFieldChange('AutonomiaBatería', e.target.value)}
                                size="sm"
                                placeholder="Ej: 4 horas"
                              />
                            ) : (
                              <div className="field-value">{hvEquipo?.AutonomiaBatería}</div>
                            )}
                          </div>
                        </Col>
                      </Row>
                    )}
                  </div>

                  {/* Clasificación y Registro */}
                  <div className="hv-section">
                    <h5 className="section-header">Registro Sanitario y Clasificación</h5>
                    <Row>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Registro INVIMA:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.RegistroINVIMA || ''}
                              onChange={(e) => handleFieldChange('RegistroINVIMA', e.target.value)}
                              size="sm"
                              placeholder="Número de registro"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.RegistroINVIMA || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Clasificación por Riesgo:</label>
                          {isEditingHV ? (
                            <Form.Select
                              value={formData.ClasificacinRiesgo || ''}
                              onChange={(e) => handleFieldChange('ClasificacinRiesgo', e.target.value)}
                              size="sm"
                            >
                              <option value="">Seleccionar...</option>
                              <option value="I">Clase I</option>
                              <option value="IIA">Clase IIA</option>
                              <option value="IIB">Clase IIB</option>
                              <option value="III">Clase III</option>
                            </Form.Select>
                          ) : (
                            <div className="field-value">
                              <Badge 
                                bg={
                                  hvEquipo?.ClasificacinRiesgo === 'III' ? 'danger' :
                                  hvEquipo?.ClasificacinRiesgo === 'IIB' ? 'warning' :
                                  hvEquipo?.ClasificacinRiesgo === 'IIA' ? 'info' : 'secondary'
                                }
                              >
                                Clase {hvEquipo?.ClasificacinRiesgo || 'N/A'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Tecnología Predominante:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.TecnologiaPredominante || ''}
                              onChange={(e) => handleFieldChange('TecnologiaPredominante', e.target.value)}
                              size="sm"
                              placeholder="Ej: Electrónica"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.TecnologiaPredominante || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="field-group">
                          <label>Tipo de Equipo:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.TipoEquipo || ''}
                              onChange={(e) => handleFieldChange('TipoEquipo', e.target.value)}
                              size="sm"
                              placeholder="Ej: Equipo Electromédico"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.TipoEquipo || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Metrología y Mantenimiento */}
                  <div className="hv-section">
                    <h5 className="section-header">Metrología y Mantenimiento</h5>
                    <Row>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Requiere Calibración:</label>
                          {isEditingHV ? (
                            <Form.Check
                              type="switch"
                              checked={formData.RequiereCalibracion || false}
                              onChange={(e) => handleFieldChange('RequiereCalibracion', e.target.checked)}
                              label={formData.RequiereCalibracion ? 'SÍ' : 'NO'}
                            />
                          ) : (
                            <div className="field-value">
                              {hvEquipo?.RequiereCalibracion ? (
                                <Badge bg="success"><FaCheck /> SÍ</Badge>
                              ) : (
                                <Badge bg="secondary"><FaTimes /> NO</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Periodicidad Calibración:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.PeriodicidadCalibracion || ''}
                              onChange={(e) => handleFieldChange('PeriodicidadCalibracion', e.target.value)}
                              size="sm"
                              placeholder="Ej: Anual"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.PeriodicidadCalibracion || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Mantenimiento Preventivo:</label>
                          {isEditingHV ? (
                            <Form.Control
                              type="text"
                              value={formData.PeriodicidadMantenimiento || ''}
                              onChange={(e) => handleFieldChange('PeriodicidadMantenimiento', e.target.value)}
                              size="sm"
                              placeholder="Ej: Semestral"
                            />
                          ) : (
                            <div className="field-value">{hvEquipo?.PeriodicidadMantenimiento || 'N/A'}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="field-group">
                          <label>Meses de Mantenimiento:</label>
                          <div className="field-value">
                            {equipoInfo?.mesesMtto && equipoInfo.mesesMtto.length > 0
                              ? equipoInfo.mesesMtto.map(mes => mes.toUpperCase()).join(', ')
                              : 'N/A'}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Accesorios */}
                  <div className="hv-section">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="section-header mb-0">Accesorios</h5>
                      {isEditingHV && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={handleAddAccesorio}
                        >
                          <FaPlus className="me-1" /> Agregar Accesorio
                        </Button>
                      )}
                    </div>
                    
                    {isEditingHV ? (
                      // Modo edición
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th style={{ width: '5%' }}>No.</th>
                            <th style={{ width: '20%' }}>Nombre</th>
                            <th style={{ width: '20%' }}>Descripción</th>
                            <th style={{ width: '10%' }}>Cantidad</th>
                            <th style={{ width: '15%' }}>Estado</th>
                            <th style={{ width: '25%' }}>Observaciones</th>
                            <th style={{ width: '5%' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(formData.Accesorios && formData.Accesorios.length > 0) ? (
                            formData.Accesorios.map((acc, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                  <Form.Control
                                    type="text"
                                    value={acc.nombre || ''}
                                    onChange={(e) => handleAccesorioChange(index, 'nombre', e.target.value)}
                                    size="sm"
                                    placeholder="Nombre"
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    type="text"
                                    value={acc.descripcion || ''}
                                    onChange={(e) => handleAccesorioChange(index, 'descripcion', e.target.value)}
                                    size="sm"
                                    placeholder="Descripción"
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    type="number"
                                    value={acc.cantidad || 1}
                                    onChange={(e) => handleAccesorioChange(index, 'cantidad', parseInt(e.target.value) || 1)}
                                    size="sm"
                                    min="1"
                                  />
                                </td>
                                <td>
                                  <Form.Select
                                    value={acc.estado || 'Bueno'}
                                    onChange={(e) => handleAccesorioChange(index, 'estado', e.target.value)}
                                    size="sm"
                                  >
                                    <option value="Nuevo">Nuevo</option>
                                    <option value="Bueno">Bueno</option>
                                    <option value="Regular">Regular</option>
                                    <option value="Malo">Malo</option>
                                  </Form.Select>
                                </td>
                                <td>
                                  <Form.Control
                                    type="text"
                                    value={acc.observaciones || ''}
                                    onChange={(e) => handleAccesorioChange(index, 'observaciones', e.target.value)}
                                    size="sm"
                                    placeholder="Observaciones"
                                  />
                                </td>
                                <td className="text-center">
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRemoveAccesorio(index)}
                                    title="Eliminar"
                                  >
                                    <FaTimes />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center text-muted">
                                No hay accesorios. Haz clic en "Agregar Accesorio" para añadir uno.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    ) : (
                      // Modo visualización
                      <>
                        {hvEquipo && hvEquipo.Accesorios && hvEquipo.Accesorios.length > 0 ? (
                          <Table striped bordered hover size="sm">
                            <thead>
                              <tr>
                                <th style={{ width: '5%' }}>No.</th>
                                <th style={{ width: '30%' }}>Nombre</th>
                                <th style={{ width: '10%' }}>Cantidad</th>
                                <th style={{ width: '15%' }}>Estado</th>
                                <th style={{ width: '40%' }}>Observaciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {hvEquipo.Accesorios.map((acc, index) => (
                                <tr key={acc._id || index}>
                                  <td>{index + 1}</td>
                                  <td>
                                    <strong>{acc.nombre}</strong>
                                    {acc.descripcion && (
                                      <div className="text-muted small">{acc.descripcion}</div>
                                    )}
                                  </td>
                                  <td className="text-center">{acc.cantidad}</td>
                                  <td>
                                    <Badge bg={
                                      acc.estado === 'Nuevo' ? 'success' :
                                      acc.estado === 'Bueno' ? 'info' :
                                      acc.estado === 'Regular' ? 'warning' : 'danger'
                                    }>
                                      {acc.estado || 'N/A'}
                                    </Badge>
                                  </td>
                                  <td>{acc.observaciones || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : (
                          <Alert variant="secondary" className="mb-0">
                            No hay accesorios registrados
                          </Alert>
                        )}
                      </>
                    )}
                  </div>

                  {/* Documentación */}
                  <div className="hv-section">
                    <h5 className="section-header">Documentación Disponible</h5>
                    <Row>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Manual Disponible:</label>
                          {isEditingHV ? (
                            <Form.Check
                              type="switch"
                              checked={formData.ManualDisponible || false}
                              onChange={(e) => handleFieldChange('ManualDisponible', e.target.checked)}
                              label={formData.ManualDisponible ? 'SÍ' : 'NO'}
                            />
                          ) : (
                            <div className="field-value">
                              {hvEquipo?.ManualDisponible ? (
                                <Badge bg="success"><FaCheck /> SÍ</Badge>
                              ) : (
                                <Badge bg="danger"><FaTimes /> NO</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Planos Disponibles:</label>
                          {isEditingHV ? (
                            <Form.Check
                              type="switch"
                              checked={formData.PlanoDisponible || false}
                              onChange={(e) => handleFieldChange('PlanoDisponible', e.target.checked)}
                              label={formData.PlanoDisponible ? 'SÍ' : 'NO'}
                            />
                          ) : (
                            <div className="field-value">
                              {hvEquipo?.PlanoDisponible ? (
                                <Badge bg="success"><FaCheck /> SÍ</Badge>
                              ) : (
                                <Badge bg="danger"><FaTimes /> NO</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="field-group">
                          <label>Requiere Capacitación:</label>
                          {isEditingHV ? (
                            <Form.Check
                              type="switch"
                              checked={formData.RequiereCapacitacion || false}
                              onChange={(e) => handleFieldChange('RequiereCapacitacion', e.target.checked)}
                              label={formData.RequiereCapacitacion ? 'SÍ' : 'NO'}
                            />
                          ) : (
                            <div className="field-value">
                              {hvEquipo?.RequiereCapacitacion ? (
                                <Badge bg="warning"><FaCheck /> SÍ</Badge>
                              ) : (
                                <Badge bg="secondary"><FaTimes /> NO</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Recomendaciones */}
                  <div className="hv-section">
                    <h5 className="section-header">Recomendaciones de Uso y Mantenimiento</h5>
                    {isEditingHV ? (
                      // Modo edición con textarea
                      <div>
                        <Form.Group>
                          <Form.Label>
                            Ingrese las recomendaciones (una por línea). Puede incluir numeración manual si lo desea:
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={8}
                            value={getRecomendacionesText()}
                            onChange={(e) => handleRecomendacionesChange(e.target.value)}
                            placeholder={`Ejemplo:\n1. Se recomienda realizar limpieza externa cada 3 meses\n2. Se recomienda utilizarlo en ambientes con temperatura controlada\n3. Verificar calibración anualmente según protocolo del fabricante`}
                            style={{ fontFamily: 'monospace' }}
                          />
                          <Form.Text className="text-muted">
                            {getRecomendacionesText().split('\n').filter((line: string) => line.trim().length > 0).length} recomendación(es) registrada(s)
                          </Form.Text>
                        </Form.Group>
                      </div>
                    ) : (
                      // Modo visualización
                      <>
                        {(() => {
                          const recomendaciones = hvEquipo?.Recomendaciones;
                          
                          if (!recomendaciones) {
                            return (
                              <Alert variant="secondary" className="mb-0">
                                No hay recomendaciones registradas
                              </Alert>
                            );
                          }

                          let recomendacionesArray: string[] = [];
                          
                          if (typeof recomendaciones === 'string') {
                            const trimmed = recomendaciones.trim();
                            if (trimmed.length === 0) {
                              return (
                                <Alert variant="secondary" className="mb-0">
                                  No hay recomendaciones registradas
                                </Alert>
                              );
                            }
                            
                            // Primero intentar dividir por \n real
                            let lines = trimmed.split('\n');
                            
                            // Si no funcionó, intentar con el string literal '\n'
                            if (lines.length === 1 && trimmed.includes('\\n')) {
                              lines = trimmed.split('\\n');
                            }
                            
                            recomendacionesArray = lines
                              .map(line => line.trim())
                              .filter(line => line.length > 0);
                          } else if (Array.isArray(recomendaciones)) {
                            if (!hvEquipo.Recomendaciones) {
                              return (
                                <Alert variant="secondary" className="mb-0">
                                  No hay recomendaciones registradas
                                </Alert>
                              );
                            }
                            recomendacionesArray = recomendaciones as string[];
                          }

                          if (recomendacionesArray.length === 0) {
                            return (
                              <Alert variant="secondary" className="mb-0">
                                No hay recomendaciones registradas
                              </Alert>
                            );
                          }

                          return (
                            <ol className="recommendations-list">
                              {recomendacionesArray.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ol>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {/* Info de Auditoría - Solo si existe HV guardada */}
                  {hvEquipo && (
                    <div className="hv-section mt-4">
                      <Row>
                        <Col md={6}>
                          <Card className="shadow-sm border-info">
                            <Card.Body>
                              <h6 className="text-info">Información de Registro</h6>
                              <div className="field-group mb-2">
                                <label>Estado:</label>
                                <div className="field-value">
                                  <Badge bg={hvEquipo.EstadoHV === 'Aprobada' ? 'success' : 'warning'}>
                                    {hvEquipo.EstadoHV}
                                  </Badge>
                                </div>
                              </div>
                              <div className="field-group">
                                <label>Creado:</label>
                                <div className="field-value">{formatDate(hvEquipo.createdAt)}</div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        {hvEquipo.EstadoHV === 'Aprobada' && hvEquipo.FechaAprobacion && (
                          <Col md={6}>
                            <Card className="shadow-sm border-success">
                              <Card.Body>
                                <h6 className="text-success">✓ HV Aprobada</h6>
                                <div className="field-group">
                                  <label>Fecha Aprobación:</label>
                                  <div className="field-value">{formatDate(hvEquipo.FechaAprobacion)}</div>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                      </Row>
                    </div>
                  )}
                </div>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 2: HISTORIAL MANTENIMIENTOS PREVENTIVOS */}
        <Tab
          eventKey="preventivos"
          title={
            <span>
              <FaHistory className="me-2" />
              Mantenimientos Preventivos
              <Badge bg="primary" className="ms-2">{reportesPreventivos.length}</Badge>
            </span>
          }
        >
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaClipboardList className="me-2" />
                Historial de Mantenimientos Preventivos
              </h5>
            </Card.Header>
            <Card.Body>
              {reportesPreventivos.length === 0 ? (
                <Alert variant="info">
                  No hay registros de mantenimientos preventivos para este equipo.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Consecutivo</th>
                      <th>Estado</th>
                      <th>Responsable</th>
                      <th>Actividades</th>
                      <th>Estado Operativo</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportesPreventivos.map((reporte) => (
                      <tr key={reporte._id}>
                        <td>{formatDate(reporte.fechaProcesado)}</td>
                        <td>
                          <Badge bg="primary">{reporte.consecutivo || 'N/A'}</Badge>
                        </td>
                        <td>
                          <Badge bg={
                            reporte.estado === 'Cerrado' ? 'success' :
                            reporte.estado === 'En_Progreso' ? 'warning' :
                            reporte.estado === 'Cancelado' ? 'danger' : 'secondary'
                          }>
                            {reporte.estado}
                          </Badge>
                        </td>
                        <td>
                          {reporte.ResponsableMtto?.firstName} {reporte.ResponsableMtto?.lastName}
                        </td>
                        <td>
                          {reporte.actividadesRealizadas?.filter(a => a.realizado).length || 0} 
                          {' / '}
                          {reporte.actividadesRealizadas?.length || 0}
                        </td>
                        <td>
                          <Badge bg={
                            reporte.estadoOperativo === 'Operativo' ? 'success' :
                            reporte.estadoOperativo === 'En Mantenimiento' ? 'warning' :
                            reporte.estadoOperativo === 'Fuera de Servicio' ? 'danger' : 'dark'
                          }>
                            {reporte.estadoOperativo || 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          <small>{reporte.observacion?.substring(0, 50) || '-'}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 3: HISTORIAL DE CAMBIOS (TIMELINE) */}
        <Tab
          eventKey="timeline"
          title={
            <span>
              <FaExchangeAlt className="me-2" />
              Historial de Cambios
              <Badge bg="info" className="ms-2">{timelineData.length}</Badge>
            </span>
          }
        >
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaExchangeAlt className="me-2" />
                Línea de Tiempo - Cambios de Ubicación y Servicio
              </h5>
            </Card.Header>
            <Card.Body>
              {timelineData.length === 0 ? (
                <Alert variant="info">
                  No hay registros de cambios para este equipo.
                </Alert>
              ) : (
                <>
                  <Alert variant="secondary" className="mb-4">
                    <strong>ℹ️ Trazabilidad del Equipo:</strong> Se muestran solo los reportes donde se detectaron cambios en las propiedades del equipo (ubicación, sede, servicio, marca, modelo, serie, inventario).
                    <br />
                    <strong>Total de cambios registrados:</strong> {timelineData.length} {timelineData.length === 1 ? '(Estado inicial)' : `(1 estado inicial + ${timelineData.length - 1} cambios)`}
                  </Alert>

                  {/* Timeline Visual */}
                  <div className="timeline-container mb-4">
                    <div className="timeline">
                      {timelineData.map((item, index) => (
                        <div key={item.reporteId || index} className="timeline-item">
                          <div className={`timeline-dot ${item.esInicial ? 'initial' : 'change'}`}></div>
                          <div className="timeline-content">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="timeline-date">{formatDate(item?.fecha)}</div>
                              <div>
                                <Badge bg="secondary" className="me-1">{item.consecutivo || 'N/A'}</Badge>
                                <Badge bg={item.tipoMtto === 'Preventivo' ? 'primary' : 'warning'}>
                                  {item.tipoMtto}
                                </Badge>
                              </div>
                            </div>
                            
                            {item.esInicial ? (
                              <div className="timeline-initial">
                                <Badge bg="info" className="mb-2">📍 Estado Inicial del Equipo</Badge>
                                <div className="timeline-details mt-2">
                                  <Row>
                                    <Col md={6}>
                                      <div><strong>Sede:</strong> {item.snapshot.Sede || 'N/A'}</div>
                                      <div><strong>Servicio:</strong> {item.snapshot.Servicio || 'N/A'}</div>
                                      <div><strong>Ubicación:</strong> {item.snapshot.Ubicacion || 'N/A'}</div>
                                    </Col>
                                    <Col md={6}>
                                      <div><strong>Marca:</strong> {item.snapshot.Marca || 'N/A'}</div>
                                      <div><strong>Modelo:</strong> {item.snapshot.Modelo || 'N/A'}</div>
                                      <div><strong>Serie:</strong> {item.snapshot.Serie || 'N/A'}</div>
                                      <div><strong>Inventario:</strong> {item.snapshot.Inventario || 'N/A'}</div>
                                    </Col>
                                  </Row>
                                </div>
                              </div>
                            ) : (
                              <div className="timeline-changes">
                                <Badge bg="warning" text="dark" className="mb-2">⚠️ Cambios Detectados</Badge>
                                <ul className="changes-list mt-2 mb-0">
                                  {item.cambiosDetectados.map((cambio: string, idx: number) => (
                                    <li key={idx}>
                                      <small>{cambio}</small>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabla de cambios detallados */}
                  <h6 className="mt-4 mb-3">📊 Tabla Detallada de Cambios</h6>
                  <Table striped bordered hover size="sm" responsive>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Consecutivo</th>
                        <th>Tipo Mtto</th>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Serie</th>
                        <th>Inventario</th>
                        <th>Sede</th>
                        <th>Servicio</th>
                        <th>Ubicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timelineData.map((item, index) => (
                        <tr key={item.reporteId || index} className={item.esInicial ? 'table-info' : ''}>
                          <td>{formatDate(item.fecha)}</td>
                          <td>
                            <Badge bg="secondary">{item.consecutivo || 'N/A'}</Badge>
                          </td>
                          <td>
                            <Badge bg={item.tipoMtto === 'Preventivo' ? 'primary' : 'warning'}>
                              {item.tipoMtto}
                            </Badge>
                          </td>
                          <td>{item.snapshot.Marca || '-'}</td>
                          <td>{item.snapshot.Modelo || '-'}</td>
                          <td>{item.snapshot.Serie || '-'}</td>
                          <td>{item.snapshot.Inventario || '-'}</td>
                          <td>{item.snapshot.Sede || '-'}</td>
                          <td>{item.snapshot.Servicio || '-'}</td>
                          <td>{item.snapshot.Ubicacion || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 4: MANTENIMIENTOS CORRECTIVOS/OTROS */}
        <Tab
          eventKey="correctivos"
          title={
            <span>
              <FaTools className="me-2" />
              Correctivos/Otros
              <Badge bg="warning" text="dark" className="ms-2">{reportesCorrectivos.length}</Badge>
            </span>
          }
        >
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaTools className="me-2" />
                Mantenimientos Correctivos y Otros Servicios
              </h5>
            </Card.Header>
            <Card.Body>
              {reportesCorrectivos.length === 0 ? (
                <Alert variant="info">
                  No hay registros de mantenimientos correctivos u otros servicios para este equipo.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Consecutivo</th>
                      <th>Estado</th>
                      <th>Falla Reportada</th>
                      <th>Diagnóstico</th>
                      <th>Acción Tomada</th>
                      <th>Estado Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportesCorrectivos.map((reporte) => (
                      <tr key={reporte._id}>
                        <td>{formatDate(reporte.fechaProcesado)}</td>
                        <td>
                          <Badge bg="warning" text="dark">{reporte.tipoMtto || 'Correctivo'}</Badge>
                        </td>
                        <td>
                          <Badge bg="primary">{reporte.consecutivo || 'N/A'}</Badge>
                        </td>
                        <td>
                          <Badge bg={
                            reporte.estado === 'Cerrado' ? 'success' :
                            reporte.estado === 'En_Progreso' ? 'warning' :
                            reporte.estado === 'Cancelado' ? 'danger' : 'secondary'
                          }>
                            {reporte.estado}
                          </Badge>
                        </td>
                        <td>
                          <small>{reporte.fallaReportada?.substring(0, 50) || '-'}</small>
                        </td>
                        <td>
                          <small>{reporte.diagnostico?.substring(0, 50) || '-'}</small>
                        </td>
                        <td>
                          <small>{reporte.accionTomada?.substring(0, 50) || '-'}</small>
                        </td>
                        <td>
                          <Badge bg={
                            reporte.estadoOperativo === 'Operativo' ? 'success' :
                            reporte.estadoOperativo === 'En Mantenimiento' ? 'warning' :
                            reporte.estadoOperativo === 'Fuera de Servicio' ? 'danger' : 'dark'
                          }>
                            {reporte.estadoOperativo || 'N/A'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 5: TRAZABILIDAD DE REPUESTOS */}
        <Tab
          eventKey="repuestos"
          title={
            <span>
              <FaCog className="me-2" />
              Repuestos
              <Badge bg="success" className="ms-2">{repuestosHistorial.length}</Badge>
            </span>
          }
        >
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaCog className="me-2" />
                Trazabilidad de Repuestos
              </h5>
            </Card.Header>
            <Card.Body>
              {repuestosHistorial.length === 0 ? (
                <Alert variant="info">
                  No hay registros de repuestos utilizados en este equipo.
                </Alert>
              ) : (
                <>
                  <Row className="mb-3">
                    <Col md={3}>
                      <Card bg="light">
                        <Card.Body>
                          <h6>Total Repuestos</h6>
                          <h3>{repuestosHistorial.length}</h3>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card bg="success" text="white">
                        <Card.Body>
                          <h6>Instalados</h6>
                          <h3>
                            {repuestosHistorial.filter(r => r.estado === 'Instalado').length}
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card bg="warning">
                        <Card.Body>
                          <h6>Pendientes</h6>
                          <h3>
                            {repuestosHistorial.filter(r => 
                              r.estado === 'Solicitado' || r.estado === 'Aprobado'
                            ).length}
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card bg="info" text="white">
                        <Card.Body>
                          <h6>Costo Total</h6>
                          <h3>
                            {formatCurrency(
                              repuestosHistorial.reduce((sum, r) => sum + (r.costo || 0), 0)
                            )}
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Fecha Solicitud</th>
                        <th>Fecha Instalación</th>
                        <th>Repuesto</th>
                        <th>Cantidad</th>
                        <th>Estado</th>
                        <th>Costo</th>
                        <th>Motivo</th>
                        <th>Reporte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repuestosHistorial.map((repuesto: any, index) => (
                        <tr key={repuesto._id || index}>
                          <td>{formatDate(repuesto.fechaSolicitud)}</td>
                          <td>{formatDate(repuesto.fechaInstalacion)}</td>
                          <td><strong>{repuesto.nombre}</strong></td>
                          <td className="text-center">{repuesto.cantidad}</td>
                          <td>
                            <Badge bg={
                              repuesto.estado === 'Instalado' ? 'success' :
                              repuesto.estado === 'Aprobado' ? 'info' :
                              repuesto.estado === 'Solicitado' ? 'warning' : 'danger'
                            }>
                              {repuesto.estado}
                            </Badge>
                          </td>
                          <td className="text-end">
                            {repuesto.costo ? formatCurrency(repuesto.costo) : '-'}
                          </td>
                          <td>
                            <small>{repuesto.motivo?.substring(0, 40) || '-'}</small>
                          </td>
                          <td>
                            <Badge bg="primary">{repuesto.reporteId?.substring(0, 8) || 'N/A'}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default HVEquipoPage;
