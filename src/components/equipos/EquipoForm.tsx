import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, Form, Button, Row, Col, Spinner, Alert, Modal 
} from 'react-bootstrap';
import Select from 'react-select';
import { useItems } from '@/hooks/useItems';
import { useCreateEquipoItem } from '@/hooks/useEquipoItems';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { Sede } from '@/types/sede.types';
import { Servicio } from '@/types/servicio.types';
import { CreateEquipoItemDto } from '@/types/equipoItem.types';
import SedeFormModal from '@/components/customers/SedeFormModal';
import ServicioFormModal from '@/components/customers/ServicioFormModal';
import ItemFormModal from '@/components/items/ItemFormModal';
import Swal from 'sweetalert2';

interface EquipoFormProps {
  customerId: string;
  sedes: Sede[];
  servicios: Servicio[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EquipoForm: React.FC<EquipoFormProps> = ({ 
  customerId, 
  sedes, 
  servicios,  
  onSuccess, 
  onCancel 
}) => {
  const { data: itemsData, isLoading: loadingItems } = useItems({
    limit: 100 // Cargar muchos items para el dropdown
  });

  const createMutation = useCreateEquipoItem();
  
  // Refetch sedes, servicios e items
  const { refetch: refetchSedes } = useSedesByCustomer(customerId);
  const { refetch: refetchServicios } = useServiciosByCustomer(customerId);
  const { refetch: refetchItems } = useItems({ limit: 100 });
  
  // Estados para modales
  const [showSedeModal, setShowSedeModal] = useState(false);
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  
  const [formData, setFormData] = useState({
    ClienteId: customerId,
    item: '',
    Precio: 0,
    ItemId: '',
    Marca: '',
    Modelo: '',
    Serie: '',
    Servicio: '',
    SedeId: '',
    Ubicacion: '',
    Inventario: '',
    Estado: 'Activo',
    mesesMtto: [] as string[]
  });

  console.log('EquipoForm renderizado con formData:', formData);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Items ordenados alfabéticamente
  const items = useMemo(() => {
    const rawItems = itemsData?.data || [];
    return [...rawItems].sort((a, b) => {
      const nameA = a.Nombre?.toUpperCase() || '';
      const nameB = b.Nombre?.toUpperCase() || '';
      return nameA.localeCompare(nameB);
    });
  }, [itemsData?.data]);

  // Opciones para react-select
  const itemOptions = useMemo(() => [
    { value: 'CREATE_NEW', label: '+ Crear Nuevo Item', isSpecial: true },
    ...items.map(item => ({
      value: item._id,
      label: item.Nombre
    }))
  ], [items]);
  
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.Servicio) {
      errors.push('Debe seleccionar un servicio');
    }
    if (!formData.SedeId) {
      errors.push('Debe seleccionar una sede');
    }
    if (formData.mesesMtto.length === 0) {
      errors.push('Debe seleccionar al menos un mes de mantenimiento');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload: CreateEquipoItemDto = {
        item: formData.item,
        ClienteId: customerId,
        ItemId: formData.ItemId || undefined,
        Marca: formData.Marca || undefined,
        Modelo: formData.Modelo || undefined,
        Serie: formData.Serie || undefined,
        Inventario: formData.Inventario || undefined,
        Servicio: formData.Servicio,
        SedeId: formData.SedeId,
        Ubicacion: formData.Ubicacion || undefined,
        Estado: formData.Estado || undefined,
        mesesMtto: formData.mesesMtto,
        Precio: formData.Precio || 0
      };

      await createMutation.mutateAsync(payload);
      onSuccess?.();
    } catch (error) {
      console.error('Error al crear equipo:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMesesMttoChange = (mes: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      mesesMtto: checked 
        ? [...prev.mesesMtto, mes]
        : prev.mesesMtto.filter(m => m !== mes)
    }));
  };

  const meses = [
    { value: 'ene', label: 'Enero' },
    { value: 'feb', label: 'Febrero' },
    { value: 'mar', label: 'Marzo' },
    { value: 'abr', label: 'Abril' },
    { value: 'may', label: 'Mayo' },
    { value: 'jun', label: 'Junio' },
    { value: 'jul', label: 'Julio' },
    { value: 'ago', label: 'Agosto' },
    { value: 'sep', label: 'Septiembre' },
    { value: 'oct', label: 'Octubre' },
    { value: 'nov', label: 'Noviembre' },
    { value: 'dic', label: 'Diciembre' }
  ];

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Crear Nuevo Equipo</h5>
      </Card.Header>
      <Card.Body>
        {/* Validaciones */}
        {validationErrors.length > 0 && (
          <Alert variant="danger">
            <ul className="mb-0">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Contexto Superior - Dropdowns fijos */}
          <Card className="mb-4 bg-light">
            <Card.Body>
              <h6 className="text-muted mb-3">Contexto del Equipo</h6>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cliente</Form.Label>
                    <Form.Control 
                      value="Cliente actual" 
                      disabled 
                      className="bg-white"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Servicio *</Form.Label>
                    <Form.Select
                      value={formData.Servicio}
                      onChange={(e) => {
                        if (e.target.value === 'CREATE_NEW') {
                          setShowServicioModal(true);
                          e.target.value = '';
                        } else {
                          handleInputChange('Servicio', e.target.value);
                        }
                      }}
                      required
                    >
                      <option value="">Seleccionar servicio...</option>
                      <option value="CREATE_NEW" style={{ color: '#0d6efd', fontWeight: 'bold' }}>+ Crear Nuevo Servicio</option>
                      {servicios.map((servicio) => (
                        <option key={servicio._id} value={servicio._id}>
                          {servicio.nombre}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sede *</Form.Label>
                    <Form.Select
                      value={formData.SedeId}
                      onChange={(e) => {
                        if (e.target.value === 'CREATE_NEW') {
                          setShowSedeModal(true);
                          e.target.value = '';
                        } else {
                          handleInputChange('SedeId', e.target.value);
                        }
                      }}
                      required
                    >
                      <option value="">Seleccionar sede...</option>
                      <option value="CREATE_NEW" style={{ color: '#0d6efd', fontWeight: 'bold' }}>+ Crear Nueva Sede</option>
                      {sedes.map((sede) => (
                        <option key={sede._id} value={sede._id}>
                          {sede.nombreSede}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ubicación *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.Ubicacion}
                      required
                      onChange={(e) => handleInputChange('Ubicacion', e.target.value)}
                      placeholder="Ej: UCI, Quirófano, Laboratorio..."
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Información del Equipo */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Item Relacionado</Form.Label>
                {loadingItems ? (
                  <div className="d-flex align-items-center">
                    <Spinner size="sm" className="me-2" />
                    Cargando items...
                  </div>
                ) : (
                  <Select
                    options={itemOptions}
                    value={itemOptions.find(opt => opt.value === formData.ItemId) || null}
                    onChange={(selected) => {
                      if (selected?.value === 'CREATE_NEW') {
                        setShowItemModal(true);
                      } else {
                        const itemId = selected?.value || '';
                        const selectedItem = items.find(item => item._id === itemId);
                        
                        let precioFinal = 0;
                        if (selectedItem) {
                          const precioBase = selectedItem.Precio || 0;
                          if (selectedItem.IvaIncluido) {
                            // Si el IVA ya está incluido, usar el precio tal cual
                            precioFinal = precioBase;
                          } else {
                            // Si el IVA no está incluido, aplicar el IVA
                            const iva = selectedItem.Iva || 0;
                            precioFinal = precioBase * (1 + iva / 100);
                          }
                        }
                        
                        setFormData(prev => ({
                          ...prev,
                          ItemId: itemId,
                          item: selectedItem?.Nombre || prev.item,
                          Precio: precioFinal
                        }));
                      }
                    }}
                    placeholder="Sin item relacionado"
                    isClearable
                    isSearchable
                    noOptionsMessage={() => 'No se encontraron items'}
                    styles={{
                      option: (base, { data }: any) => ({
                        ...base,
                        color: data.isSpecial ? '#0d6efd' : base.color,
                        fontWeight: data.isSpecial ? 'bold' : base.fontWeight
                      }),
                      menuPortal: (base) => ({ ...base, zIndex: 9999 })
                    }}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
                <Form.Text className="text-muted">
                  Opcional: Relacionar con un item del catálogo
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Marca</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.Marca}
                  onChange={(e) => handleInputChange('Marca', e.target.value)}
                  placeholder="Ej: Philips, GE Healthcare..."
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Modelo</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.Modelo}
                  onChange={(e) => handleInputChange('Modelo', e.target.value)}
                  placeholder="Modelo específico del equipo"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Serie</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.Serie}
                  onChange={(e) => handleInputChange('Serie', e.target.value)}
                  placeholder="Número de serie"
                />
              </Form.Group>

                            <Form.Group className="mb-3">
                <Form.Label>Inventario</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.Inventario}
                  onChange={(e) => handleInputChange('Inventario', e.target.value)}
                  placeholder="Número de inventario"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={formData.Estado}
                  onChange={(e) => handleInputChange('Estado', e.target.value)}
                >
                  <option value="Active">Activo</option>
                  <option value="Inactive">Inactivo</option>
                  <option value="Maintenance">En Mantenimiento</option>
                  <option value="Damaged">Dañado</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Meses de Mantenimiento */}
          <Card className="mb-4">
            <Card.Body>
              <h6 className="mb-3">Meses de Mantenimiento *</h6>
              <Row>
                {meses.map((mes) => (
                  <Col md={3} key={mes.value} className="mb-2">
                    <Form.Check
                      type="checkbox"
                      label={mes.label}
                      checked={formData.mesesMtto.includes(mes.value)}
                      onChange={(e) => handleMesesMttoChange(mes.value, e.target.checked)}
                    />
                  </Col>
                ))}
              </Row>
              <Form.Text className="text-muted">
                Seleccione los meses en que se realizará el mantenimiento
              </Form.Text>
            </Card.Body>
          </Card>

          {/* Botones de Acción */}
          <div className="d-flex gap-2 justify-content-end">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={createMutation.isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Creando...
                </>
              ) : (
                'Crear Equipo'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>

      {/* Modal para Crear Sede */}
      <SedeFormModal
        show={showSedeModal}
        onHide={() => setShowSedeModal(false)}
        customerId={customerId}
        onSuccess={async () => {
          await refetchSedes();
          await Swal.fire({
            icon: 'success',
            title: '¡Sede creada!',
            text: 'La sede se ha creado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        }}
      />

      {/* Modal para Crear Servicio */}
      <ServicioFormModal
        show={showServicioModal}
        onHide={() => setShowServicioModal(false)}
        customerId={customerId}
        onSuccess={async () => {
          await refetchServicios();
          await Swal.fire({
            icon: 'success',
            title: '¡Servicio creado!',
            text: 'El servicio se ha creado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        }}
      />

      {/* Modal para Crear Item */}
      <ItemFormModal 
        show={showItemModal}
        onHide={() => setShowItemModal(false)}
        onSuccess={async () => {
          await refetchItems();
          await Swal.fire({
            icon: 'success',
            title: '¡Item creado!',
            text: 'El item se ha creado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        }}
      />
    </Card>
  );
};

export default EquipoForm;

