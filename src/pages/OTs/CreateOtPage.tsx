import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Table, Alert, 
  Badge, Spinner, Modal 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCustomers, useCreateCustomer } from '@/hooks/useCustomers';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { useEquipoItems } from '@/hooks/useEquipoItems';
import { useCreateOt } from '@/hooks/useOTs';
import { Customer } from '@/types/customer.types';
import { EquipoItem } from '@/types/equipoItem.types';
import { Sede } from '@/types/sede.types';
import { Servicio } from '@/types/servicio.types';
import { toast } from 'react-toastify';
import { FaPlus, FaCheck, FaMinus, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EquipoForm from '@/components/equipos/EquipoForm';

interface CreateOtFormData {
  customerId: string;
  sedeId: string;
  servicioId: string;
  mes: string;
  tipoServicio: string;
  urgencia: string;
  equiposSeleccionados: string[];
}

const CreateOtPage: React.FC = () => {
  const navigate = useNavigate();
  const createOtMutation = useCreateOt();
  const createCustomerMutation = useCreateCustomer();

  // Estados principales
  const [formData, setFormData] = useState<CreateOtFormData>({
    customerId: '',
    sedeId: '',
    servicioId: '',
    mes: '',
    tipoServicio: 'Preventivo',
    urgencia: 'Baja',
    equiposSeleccionados: []
  });

  console.log(formData)
  // Estados de filtros de tabla
  const [filtros, setFiltros] = useState({
    codigo: '',
    nombre: '',
    sede: '',
    servicio: '',
    estado: ''
  });

  console.log(filtros);

  // Estados de UI
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para modal de crear cliente
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    Razonsocial: '',
    Ciudad: '',
    Departamento: '',
    Email: '',
    Nit: '',
    Direccion: '',
    TelContacto: '',
    UserContacto: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  
  // Estados para modal de crear equipo
  const [showCreateEquipoModal, setShowCreateEquipoModal] = useState(false);

  // Queries principales
  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const customers = useMemo(() => customersData?.data || [], [customersData?.data]);

  // Queries dependientes del customer seleccionado
  const { data: sedesData, isLoading: loadingSedes } = useSedesByCustomer(
    formData.customerId,
    {},
    { enabled: !!formData.customerId }
  );
  const sedes = useMemo(() => sedesData?.data || [], [sedesData?.data]);

  const { data: serviciosData, isLoading: loadingServicios } = useServiciosByCustomer(
    formData.customerId,
    {},
    { enabled: !!formData.customerId }
  );
  const servicios = useMemo(() => serviciosData?.data || [], [serviciosData?.data]);

  const { data: equiposData, isLoading: loadingEquipos, refetch: refetchEquipos } = useEquipoItems(
    formData.customerId ? { ClienteId: formData.customerId } : null,
    //{ enabled: !!formData.customerId }
  );

  
  const equipos = useMemo(() => equiposData?.data || [], [equiposData?.data]);

  console.log('Equipos cargados:', equipos);
  // Datos procesados y memoizados
  const mesesDisponibles = useMemo(() => {
    // const meses = new Set<string>();
    // equipos.forEach(equipo => {
    //   if (equipo.Mes) {
    //     meses.add(equipo.Mes);
    //   }
    // });
    // return Array.from(meses).sort();
    return []; // Mes no disponible en EquipoItem type
  }, [equipos]);

  // Equipos filtrados
  const equiposFiltrados = useMemo(() => {
    return equipos.filter(equipo => {
      const cumpleCodigo = !filtros.codigo || 
        (equipo.item?.toLowerCase().includes(filtros.codigo.toLowerCase()) ||
         equipo.Serie?.toLowerCase().includes(filtros.codigo.toLowerCase()));
      
      const cumpleNombre = !filtros.nombre || 
        equipo.ItemId?.Nombre?.toLowerCase().includes(filtros.nombre.toLowerCase());
      
      const cumpleSede = !filtros.sede || equipo.SedeId?._id === filtros.sede;
      
      const cumpleServicio = !filtros.servicio || equipo.Servicio?._id === filtros.servicio;
      
      const cumpleEstado = !filtros.estado || equipo.Estado === filtros.estado;
      
      // const cumpleMes = !formData.mes || equipo.Mes === formData.mes;
      const cumpleMes = true; // Mes no existe en EquipoItem type

      return cumpleCodigo && cumpleNombre && cumpleSede && cumpleServicio && cumpleEstado && cumpleMes;
    });
  }, [equipos, filtros, formData.mes]);

  // Event handlers optimizados
  const handleCustomerChange = useCallback((customerId: string) => {
    // Si selecciona la opción de crear nuevo cliente
    if (customerId === '__CREATE_NEW__') {
      setShowCreateCustomerModal(true);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      customerId,
      sedeId: '',
      servicioId: '',
      mes: '',
      equiposSeleccionados: [] // Resetear selección al cambiar customer
    }));
    setFiltros({
      codigo: '',
      nombre: '',
      sede: '',
      servicio: '',
      estado: ''
    });
  }, []);

  const handleEquipoSelect = useCallback((equipoId: string) => {
    setFormData(prev => ({
      ...prev,
      equiposSeleccionados: prev.equiposSeleccionados.includes(equipoId)
        ? prev.equiposSeleccionados.filter(id => id !== equipoId)
        : [...prev.equiposSeleccionados, equipoId]
    }));
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    const equiposVisiblesIds = equiposFiltrados.map(e => e._id).filter(Boolean) as string[];
    const todosSeleccionados = equiposVisiblesIds.every(id => 
      formData.equiposSeleccionados.includes(id)
    );
    
    if (todosSeleccionados) {
      // Deseleccionar solo los visibles
      setFormData(prev => ({
        ...prev,
        equiposSeleccionados: prev.equiposSeleccionados.filter(id => 
          !equiposVisiblesIds.includes(id)
        )
      }));
    } else {
      // Seleccionar todos los visibles (sin afectar selecciones previas)
      setFormData(prev => ({
        ...prev,
        equiposSeleccionados: [...new Set([...prev.equiposSeleccionados, ...equiposVisiblesIds])]
      }));
    }
  }, [equiposFiltrados, formData.equiposSeleccionados]);

  const clearFilters = useCallback(() => {
    setFiltros({
      codigo: '',
      nombre: '',
      sede: '',
      servicio: '',
      estado: ''
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.customerId) {
      toast.error('Debe seleccionar un cliente');
      return;
    }
    
    if (formData.equiposSeleccionados.length === 0) {
      toast.error('Debe seleccionar al menos un equipo');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        ClienteId: formData.customerId,
        TipoServicio: formData.tipoServicio,
        OtPrioridad: formData.urgencia,
        equipos: formData.equiposSeleccionados,
        ...(formData.sedeId && { SedeId: formData.sedeId }),
        ...(formData.servicioId && { ServicioId: formData.servicioId }),
      };

      await createOtMutation.mutateAsync(payload as any);
      toast.success('Orden de trabajo creada exitosamente');
      navigate('/maintenance-orders');
    } catch (error) {
      console.error('Error creating OT:', error);
      toast.error('Error al crear la orden de trabajo');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  }, [formData, createOtMutation, navigate]);

  // Manejadores para crear cliente
  const handleNewCustomerInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleLogoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    
    if (!file) {
      setLogoFile(null);
      setLogoPreview('');
      return;
    }

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setFileError('Solo se permiten archivos PNG o JPG');
      setLogoFile(null);
      setLogoPreview('');
      e.target.value = '';
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('El archivo no debe superar los 5MB');
      setLogoFile(null);
      setLogoPreview('');
      e.target.value = '';
      return;
    }

    setLogoFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveLogo = useCallback(() => {
    setLogoFile(null);
    setLogoPreview('');
    setFileError('');
    const fileInput = document.getElementById('newCustomerLogoInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, []);

  const resetNewCustomerForm = useCallback(() => {
    setNewCustomerData({
      Razonsocial: '',
      Ciudad: '',
      Departamento: '',
      Email: '',
      Nit: '',
      Direccion: '',
      TelContacto: '',
      UserContacto: ''
    });
    setLogoFile(null);
    setLogoPreview('');
    setFileError('');
  }, []);

  const handleCreateCustomer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCustomer(true);
    
    try {
      // Crear FormData para enviar archivo
      const formDataToSend = new FormData();
      
      // Agregar todos los campos del formulario
      formDataToSend.append('Razonsocial', newCustomerData.Razonsocial);
      formDataToSend.append('Ciudad', newCustomerData.Ciudad);
      formDataToSend.append('Departamento', newCustomerData.Departamento);
      formDataToSend.append('Email', newCustomerData.Email);
      if (newCustomerData.Nit) formDataToSend.append('Nit', newCustomerData.Nit);
      if (newCustomerData.Direccion) formDataToSend.append('Direccion', newCustomerData.Direccion);
      if (newCustomerData.TelContacto) formDataToSend.append('TelContacto', newCustomerData.TelContacto);
      if (newCustomerData.UserContacto) formDataToSend.append('UserContacto', newCustomerData.UserContacto);
      
      // Agregar archivo de logo si existe
      if (logoFile) {
        formDataToSend.append('logo', logoFile, logoFile.name);
      }

      const response = await createCustomerMutation.mutateAsync(formDataToSend);
      
      // Cerrar modal
      setShowCreateCustomerModal(false);
      resetNewCustomerForm();
      
      // Notificar con SweetAlert2
      await Swal.fire({
        icon: 'success',
        title: '¡Cliente creado!',
        text: `${newCustomerData.Razonsocial} ha sido creado exitosamente`,
        confirmButtonText: 'Aceptar',
        timer: 3000
      });
      
      // Seleccionar el cliente recién creado
      if (response.data?._id) {
        setFormData(prev => ({
          ...prev,
          customerId: response.data._id!,
          sedeId: '',
          servicioId: '',
          mes: '',
          equiposSeleccionados: []
        }));
      }
    } catch (error: any) {
      console.error('Error creating customer:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al crear el cliente',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  }, [newCustomerData, logoFile, createCustomerMutation, resetNewCustomerForm]);

  // Estadísticas de selección
  const statsSeleccion = useMemo(() => {
    const totalEquipos = equipos.length;
    const equiposVisibles = equiposFiltrados.length;
    const equiposSeleccionados = formData.equiposSeleccionados.length;
    const equiposVisiblesSeleccionados = equiposFiltrados.filter(e => 
      formData.equiposSeleccionados.includes(e._id!)
    ).length;
    
    return {
      totalEquipos,
      equiposVisibles,
      equiposSeleccionados,
      equiposVisiblesSeleccionados
    };
  }, [equipos.length, equiposFiltrados, formData.equiposSeleccionados]);

  const selectedCustomer = customers.find(c => c._id === formData.customerId);
  const allVisibleSelected = equiposFiltrados.length > 0 && 
    equiposFiltrados.every(e => formData.equiposSeleccionados.includes(e._id!));

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Crear Orden de Trabajo</h1>
          <p className="text-muted">Seleccione equipos y configure los detalles de la orden</p>
        </Col>
        <Col className="text-end">
          <Button variant="outline-secondary" onClick={() => navigate('/maintenance-orders')}>
            Cancelar
          </Button>
        </Col>
      </Row>

      {/* Sección 1: Datos Generales de la OT */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">📋 Datos Generales</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Cliente <span className="text-danger">*</span></Form.Label>
                <div className="d-flex gap-2">
                  <Form.Select 
                    value={formData.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    disabled={loadingCustomers}
                    className="flex-grow-1"
                  >
                    <option value="">Seleccionar cliente...</option>
                    <option value="__CREATE_NEW__" style={{ fontWeight: 'bold', color: '#0d6efd' }}>
                      ➕ Crear nuevo cliente...
                    </option>
                    <option disabled>──────────</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.Razonsocial}
                      </option>
                    ))}
                  </Form.Select>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setShowCreateCustomerModal(true)}
                    disabled={loadingCustomers}
                    style={{ whiteSpace: 'nowrap' }}
                    title="Crear nuevo cliente"
                  >
                    <FaPlus className="me-1" /> Nuevo
                  </Button>
                </div>
                {loadingCustomers && <small className="text-muted">Cargando clientes...</small>}
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Servicio</Form.Label>
                <Form.Select 
                  value={formData.tipoServicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipoServicio: e.target.value }))}
                >
                  <option value="Preventivo">Preventivo</option>
                  <option value="Correctivo">Correctivo</option>
                    <option value="Predictivo">Predictivo</option>
                  <option value="Instalación">Instalación</option>
                  <option value="Diagnóstico">Diagnóstico</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Urgencia</Form.Label>
                <Form.Select 
                  defaultValue={'Baja'}
                  value={formData.urgencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgencia: e.target.value }))}
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Cliente Seleccionado */}
      {selectedCustomer && (
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col>
                <h6 className="mb-1">Cliente Seleccionado</h6>
                <div className="d-flex align-items-center gap-3">
                  <strong>{selectedCustomer.Razonsocial}</strong>
                  <Badge bg="primary">{selectedCustomer.Ciudad}</Badge>
                  <small className="text-muted">{selectedCustomer.Email}</small>
                </div>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Sede (Opcional)</Form.Label>
                  <Form.Select 
                    value={formData.sedeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, sedeId: e.target.value }))}
                    disabled={loadingSedes || sedes.length === 0}
                  >
                    <option value="">Todas las sedes</option>
                    {sedes.map(sede => (
                      <option key={sede._id} value={sede._id}>
                        {sede.nombreSede}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Servicio (Opcional)</Form.Label>
                  <Form.Select 
                    value={formData.servicioId}
                    onChange={(e) => setFormData(prev => ({ ...prev, servicioId: e.target.value }))}
                    disabled={loadingServicios || servicios.length === 0}
                  >
                    <option value="">Todos los servicios</option>
                    {servicios.map(servicio => (
                      <option key={servicio._id} value={servicio._id}>
                        {servicio.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Mes</Form.Label>
                  <Form.Select 
                    value={formData.mes}
                    onChange={(e) => setFormData(prev => ({ ...prev, mes: e.target.value }))}
                    disabled={mesesDisponibles.length === 0}
                  >
                    <option value="">Todos</option>
                    {mesesDisponibles.map(mes => (
                      <option key={mes} value={mes}>{mes}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Sección 2: Filtros y Selección de Equipos */}
      {formData.customerId && (
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">⚙️ Selección de Equipos</h5>
              <small className="text-muted">
                {statsSeleccion.equiposSeleccionados} de {statsSeleccion.totalEquipos} equipos seleccionados
                {statsSeleccion.equiposVisibles < statsSeleccion.totalEquipos && (
                  <> • Mostrando {statsSeleccion.equiposVisibles} filtrados</>
                )}
              </small>
            </div>
            <div className="d-flex gap-2">
              {/* Botón para crear equipo del cliente seleccionado */}
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowCreateEquipoModal(true)}
                title="Crear nuevo equipo para este cliente"
                >
                  <FaPlus className="me-1" /> Agregar Equipo
                </Button>
              <Button 
                variant="outline-info" 
                size="sm" 
                onClick={handleSelectAllVisible}
                disabled={equiposFiltrados.length === 0}
              >
                {allVisibleSelected ? (
                  <><FaMinus className="me-1" /> Deseleccionar Visibles</>
                ) : (
                  <><FaPlus className="me-1" /> Seleccionar Visibles</>
                )}
              </Button>
              {(Object.values(filtros).some(f => f !== '') || formData.mes) && (
                <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </Card.Header>
          
          {/* Filtros */}
          <Card.Body className="border-bottom">
            <Row>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Código/Serial</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Buscar..."
                    value={filtros.codigo}
                    onChange={(e) => setFiltros(prev => ({ ...prev, codigo: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Buscar equipo..."
                    value={filtros.nombre}
                    onChange={(e) => setFiltros(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Sede</Form.Label>
                  <Form.Select 
                    value={filtros.sede}
                    onChange={(e) => setFiltros(prev => ({ ...prev, sede: e.target.value }))}
                  >
                    <option value="">Todas</option>
                    {sedes.map(sede => (
                      <option key={sede._id} value={sede._id}>
                        {sede.nombreSede}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Servicio</Form.Label>
                  <Form.Select 
                    value={filtros.servicio}
                    onChange={(e) => setFiltros(prev => ({ ...prev, servicio: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    {servicios.map(servicio => (
                      <option key={servicio._id} value={servicio._id}>
                        {servicio.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Estado</Form.Label>
                  <Form.Select 
                    value={filtros.estado}
                    onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="OPERATIVO">Operativo</option>
                    <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                    <option value="FUERA_DE_SERVICIO">Fuera de Servicio</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>

          {/* Tabla de Equipos */}
          <Card.Body className="p-0">
            {loadingEquipos ? (
              <div className="text-center p-4">
                <Spinner animation="border" className="me-2" />
                Cargando equipos...
              </div>
            ) : equipos.length === 0 ? (
              <Alert variant="info" className="m-3">
                No hay equipos disponibles para este cliente.
              </Alert>
            ) : equiposFiltrados.length === 0 ? (
              <Alert variant="warning" className="m-3">
                No hay equipos que coincidan con los filtros aplicados.
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>
                        <Form.Check
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={handleSelectAllVisible}
                          disabled={equiposFiltrados.length === 0}
                          title={allVisibleSelected ? "Deseleccionar todos los visibles" : "Seleccionar todos los visibles"}
                        />
                      </th>
                      <th>Ítem</th>
                      <th>Marca</th>
                      <th>Serie</th>
                      <th>Inventario</th>
                      <th>Sede</th>
                      <th>Servicio</th>
                      <th>Meses Mtto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equiposFiltrados.map((equipo) => {
                      const isSelected = formData.equiposSeleccionados.includes(equipo._id!);
                      const sede = sedes.find(s => s._id === equipo.SedeId?._id);
                      const servicio = servicios.find(s => s._id === equipo.Servicio?._id);
                      
                      return (
                        <tr 
                          key={equipo._id} 
                          className={isSelected ? 'table-primary' : ''}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleEquipoSelect(equipo._id!)}
                        >
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleEquipoSelect(equipo._id!)}
                            />
                          </td>
                          <td
                          style={{
                            maxWidth:'180px'
                          }}
                          ><strong>{equipo.ItemId?.Nombre || 'Sin nombre'}</strong></td>

                          <td><strong>{equipo.Marca || 'No Presenta'}</strong>
                            <div className="text-muted small">{equipo.Modelo}</div>
                          </td>
                            <td>{equipo.Serie || 'N/A'}</td>
                            <td>{equipo.Inventario || 'N/A'}</td>
                          <td>
                            {sede ? (
                              <Badge bg="secondary">{sede.nombreSede}</Badge>
                            ) : (
                              <span className="text-muted">Sin sede</span>
                            )}
                          </td>
                          <td>
                            {servicio ? (
                                <>
                              <Badge bg="info">{servicio.nombre}</Badge>
                              <div className="text-muted small">{equipo.Ubicacion}</div>
                              </>
                            ) : (
                              <span className="text-muted">Sin servicio</span>
                            )}
                          </td>

                          {/* Meses y viene asi mesesMtto: ['ene', 'abr', 'jul', 'oct'] */}
                          <td>
                             {equipo.mesesMtto ? (
                              <Badge bg="warning">{equipo.mesesMtto.join(', ').toUpperCase()}</Badge>
                            ) : ( 
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td>
                            <Badge bg={
                              equipo.Estado === 'Activo' ? 'success' :
                              equipo.Estado === 'EN_MANTENIMIENTO' ? 'warning' : 'danger'
                            }>
                              {equipo.Estado || 'Sin estado'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Sección 3: Resumen y Acción */}
      {formData.customerId && formData.equiposSeleccionados.length > 0 && (
        <Card className="border-success">
          <Card.Header className="bg-light-success">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">✅ Resumen de la Orden</h5>
                <small className="text-muted">
                  {formData.equiposSeleccionados.length} equipos seleccionados para {formData.tipoServicio.toLowerCase()}
                </small>
              </div>
              <div className="d-flex gap-2">
                <Button 
                  variant="success" 
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Spinner animation="border" size="sm" className="me-2" />Creando...</>
                  ) : (
                    <><FaCheck className="me-2" />Crear Orden de Trabajo</>
                  )}
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <strong>Cliente:</strong><br />
                <span className="text-muted">{selectedCustomer?.Razonsocial}</span>
              </Col>
              <Col md={3}>
                <strong>Tipo:</strong><br />
                <Badge bg="primary" className="fs-6">{formData.tipoServicio}</Badge>
              </Col>
              <Col md={3}>
                <strong>Urgencia:</strong><br />
                <Badge bg={
                  formData.urgencia === 'Crítica' ? 'danger' :
                  formData.urgencia === 'Alta' ? 'warning' : 'secondary'
                } className="fs-6">
                  {formData.urgencia}
                </Badge>
              </Col>
              <Col md={3}>
                <strong>Equipos:</strong><br />
                <Badge bg="success" className="fs-6">
                  {formData.equiposSeleccionados.length} seleccionados
                </Badge>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Modal de Confirmación */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Creación de OT</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Está seguro de crear la orden de trabajo con los siguientes datos?</p>
          <ul>
            <li><strong>Cliente:</strong> {selectedCustomer?.Razonsocial}</li>
            <li><strong>Tipo de Servicio:</strong> {formData.tipoServicio}</li>
            <li><strong>Urgencia:</strong> {formData.urgencia}</li>
            <li><strong>Equipos:</strong> {formData.equiposSeleccionados.length} seleccionados</li>
            {formData.sedeId && (
              <li><strong>Sede:</strong> {sedes.find(s => s._id === formData.sedeId)?.nombreSede}</li>
            )}
            {formData.servicioId && (
              <li><strong>Servicio:</strong> {servicios.find(s => s._id === formData.servicioId)?.nombre}</li>
            )}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Confirmar'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Crear Cliente */}
      <Modal 
        show={showCreateCustomerModal} 
        onHide={() => {
          if (!isCreatingCustomer) {
            setShowCreateCustomerModal(false);
            resetNewCustomerForm();
            // Si el usuario cerró sin crear, resetear el select
            if (formData.customerId === '__CREATE_NEW__' || !formData.customerId) {
              setFormData(prev => ({ ...prev, customerId: '' }));
            }
          }
        }}
        size="lg"
        backdrop={isCreatingCustomer ? 'static' : true}
        keyboard={!isCreatingCustomer}
      >
        <Modal.Header closeButton={!isCreatingCustomer}>
          <Modal.Title>Crear Nuevo Cliente</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateCustomer}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Razón social <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                name="Razonsocial" 
                value={newCustomerData.Razonsocial} 
                onChange={handleNewCustomerInputChange} 
                required
                disabled={isCreatingCustomer}
                placeholder="Ingrese la razón social"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>NIT <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    name="Nit" 
                    type="text" 
                    value={newCustomerData.Nit} 
                    onChange={handleNewCustomerInputChange} 
                    required
                    disabled={isCreatingCustomer}
                    placeholder="000000000-0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Ciudad <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    name="Ciudad" 
                    value={newCustomerData.Ciudad} 
                    onChange={handleNewCustomerInputChange} 
                    required
                    disabled={isCreatingCustomer}
                    placeholder="Ej: Bogotá"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Departamento <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    name="Departamento" 
                    value={newCustomerData.Departamento} 
                    onChange={handleNewCustomerInputChange} 
                    required
                    disabled={isCreatingCustomer}
                    placeholder="Ej: Cundinamarca"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    name="Email" 
                    type="email" 
                    value={newCustomerData.Email} 
                    onChange={handleNewCustomerInputChange} 
                    required
                    disabled={isCreatingCustomer}
                    placeholder="correo@ejemplo.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control 
                    name="Direccion" 
                    value={newCustomerData.Direccion} 
                    onChange={handleNewCustomerInputChange}
                    disabled={isCreatingCustomer}
                    placeholder="Dirección completa"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono contacto</Form.Label>
                  <Form.Control 
                    name="TelContacto" 
                    value={newCustomerData.TelContacto} 
                    onChange={handleNewCustomerInputChange}
                    disabled={isCreatingCustomer}
                    placeholder="3001234567"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Persona contacto</Form.Label>
                  <Form.Control 
                    name="UserContacto" 
                    value={newCustomerData.UserContacto} 
                    onChange={handleNewCustomerInputChange}
                    disabled={isCreatingCustomer}
                    placeholder="Nombre del contacto"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Logo (Opcional)</Form.Label>
              <Form.Control 
                id="newCustomerLogoInput"
                type="file" 
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleLogoFileChange}
                disabled={isCreatingCustomer}
              />
              {fileError && <Alert variant="danger" className="mt-2 mb-0 py-2">{fileError}</Alert>}
              <Form.Text className="text-muted">
                Formatos permitidos: PNG, JPG. Tamaño máximo: 5MB
              </Form.Text>
              
              {logoPreview && (
                <div className="mt-3 position-relative d-inline-block">
                  <img 
                    src={logoPreview} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '150px' }}
                    className="img-thumbnail"
                  />
                  {!isCreatingCustomer && (
                    <Button 
                      variant="danger" 
                      size="sm" 
                      className="position-absolute top-0 end-0 m-1"
                      onClick={handleRemoveLogo}
                      style={{ padding: '0.25rem 0.5rem' }}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowCreateCustomerModal(false);
                resetNewCustomerForm();
                // Si el usuario canceló, resetear el select
                if (formData.customerId === '__CREATE_NEW__' || !formData.customerId) {
                  setFormData(prev => ({ ...prev, customerId: '' }));
                }
              }}
              disabled={isCreatingCustomer}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isCreatingCustomer}
            >
              {isCreatingCustomer ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Creando cliente...
                </>
              ) : (
                <>
                  <FaCheck className="me-2" />
                  Crear Cliente
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Crear Equipo */}
      <Modal 
        show={showCreateEquipoModal} 
        onHide={() => setShowCreateEquipoModal(false)}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Equipo - {selectedCustomer?.Razonsocial}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCustomer && (
            <EquipoForm
              customerId={formData.customerId}
              sedes={sedes}
              servicios={servicios}
              onSuccess={async () => {
                // Cerrar el modal
                setShowCreateEquipoModal(false);
                
                // Notificación con SweetAlert2
                await Swal.fire({
                  icon: 'success',
                  title: '¡Equipo creado!',
                  text: 'El equipo ha sido creado exitosamente y está disponible para selección',
                  confirmButtonText: 'Aceptar',
                  timer: 3000
                });
                
                // Refrescar la lista de equipos
                await refetchEquipos();
              }}
              onCancel={() => setShowCreateEquipoModal(false)}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CreateOtPage;