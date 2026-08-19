import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Form, Button, Row, Col, Spinner, Alert, Modal
} from 'react-bootstrap';
import Select from 'react-select';
import { useItems } from '@/hooks/useItems';
import { useCreateEquipoItem, useEquipoDuplicateCheck } from '@/hooks/useEquipoItems';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { useDebounce } from '@/hooks/useDebounce';
import { Sede } from '@/types/sede.types';
import { Servicio } from '@/types/servicio.types';
import { CreateEquipoItemDto, EquipoItem } from '@/types/equipoItem.types';
import SedeFormModal from '@/components/customers/SedeFormModal';
import ServicioFormModal from '@/components/customers/ServicioFormModal';
import ItemFormModal from '@/components/items/ItemFormModal';
import EquipoDuplicateModal from '@/components/equipos/EquipoDuplicateModal';
import { normalizeSerial, serialHasDigit } from '@/utils/serial';
import { handleEquipoDuplicateError } from '@/utils/handleEquipoDuplicateError';
import Swal from 'sweetalert2';

interface EquipoFormProps {
  customerId: string;
  sedes: Sede[];
  servicios: Servicio[];
  /**
   * Called after the equipo is created. Receives the freshly created equipo
   * (as returned by the backend) so callers can chain follow-up actions like
   * attaching it to an OT. Existing callers that ignore the argument keep
   * working unchanged.
   */
  onSuccess?: (created?: { _id?: string; [key: string]: unknown }) => void | Promise<void>;
  onCancel?: () => void;
  /**
   * Called when the user chooses to use the pre-existing equipo shown by
   * `EquipoDuplicateModal` (either from the live check or a 409 on submit).
   * Semantics are owned by the caller (attach to OT, reuse, navigate...).
   */
  onUseExisting?: (existing: EquipoItem) => void | Promise<void>;
  /** Overrides the modal's primary button label. Default: "Usar este equipo". */
  onUseExistingLabel?: string;
}

const EquipoForm: React.FC<EquipoFormProps> = ({
  customerId,
  sedes,
  servicios,
  onSuccess,
  onCancel,
  onUseExisting,
  onUseExistingLabel,
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

  // Equipo devuelto por el backend (o por el live-check) cuando se detecta un
  // duplicado. No-null abre el EquipoDuplicateModal.
  const [duplicateExisting, setDuplicateExisting] = useState<EquipoItem | null>(null);

  // Live duplicate check: debounced (400ms) sobre el trío ItemId/Marca/Serie
  // para no golpear el endpoint en cada tecla.
  const duplicateCheckTuple = useMemo(
    () => ({ ItemId: formData.ItemId, Marca: formData.Marca, Serie: formData.Serie }),
    [formData.ItemId, formData.Marca, formData.Serie]
  );
  const debouncedDuplicateCheckTuple = useDebounce(duplicateCheckTuple, 400);
  const duplicateCheckEnabled = Boolean(
    debouncedDuplicateCheckTuple.ItemId &&
    debouncedDuplicateCheckTuple.Marca &&
    debouncedDuplicateCheckTuple.Serie &&
    serialHasDigit(normalizeSerial(debouncedDuplicateCheckTuple.Serie))
  );

  const { data: duplicateCheckData } = useEquipoDuplicateCheck(
    {
      ClienteId: customerId,
      ItemId: debouncedDuplicateCheckTuple.ItemId,
      Marca: debouncedDuplicateCheckTuple.Marca,
      Serie: debouncedDuplicateCheckTuple.Serie,
    },
    { enabled: duplicateCheckEnabled }
  );

  const hasLiveConflict = duplicateCheckEnabled && duplicateCheckData?.conflict === true;

  // Auto-select the single sede / servicio when the customer only has one of
  // each — avoids forcing the admin to open a dropdown with a single option.
  // Only fires when the field is still empty, so it doesn't override a manual
  // pick and doesn't fight the user if they clear the value.
  useEffect(() => {
    if (sedes.length === 1 && !formData.SedeId) {
      const only = sedes[0];
      if (only?._id) {
        setFormData((prev) => (prev.SedeId ? prev : { ...prev, SedeId: only._id! }));
      }
    }
  }, [sedes, formData.SedeId]);

  useEffect(() => {
    if (servicios.length === 1 && !formData.Servicio) {
      const only = servicios[0];
      if (only?._id) {
        setFormData((prev) => (prev.Servicio ? prev : { ...prev, Servicio: only._id! }));
      }
    }
  }, [servicios, formData.Servicio]);
  
  // Items ordenados alfabéticamente
  const items = useMemo(() => {
    const rawItems = itemsData?.data || [];
    return [...rawItems].sort((a, b) => {
      const nameA = a.Nombre?.toUpperCase() || '';
      const nameB = b.Nombre?.toUpperCase() || '';
      return nameA.localeCompare(nameB);
    });
  }, [itemsData?.data]);

  // Sedes y Servicios ordenados alfabéticamente
  const sedesOrdenadas = useMemo(() => {
    return [...sedes].sort((a, b) => {
      const nameA = (a.nombreSede || '').toUpperCase();
      const nameB = (b.nombreSede || '').toUpperCase();
      return nameA.localeCompare(nameB);
    });
  }, [sedes]);

  const serviciosOrdenados = useMemo(() => {
    return [...servicios].sort((a, b) => {
      const nameA = (a.nombre || '').toUpperCase();
      const nameB = (b.nombre || '').toUpperCase();
      return nameA.localeCompare(nameB);
    });
  }, [servicios]);

  // Opciones para react-select
  const itemOptions = useMemo(() => [
    { value: 'CREATE_NEW', label: '+ Crear Nuevo Item', isSpecial: true },
    ...items.map(item => ({
      value: item._id,
      label: item.Nombre
    }))
  ], [items]);

  const sedeOptions = useMemo(() => [
    { value: 'CREATE_NEW', label: '+ Crear Nueva Sede', isSpecial: true },
    ...sedesOrdenadas.map(sede => ({
      value: sede._id!,
      label: sede.nombreSede || 'Sin nombre'
    }))
  ], [sedesOrdenadas]);

  const servicioOptions = useMemo(() => [
    { value: 'CREATE_NEW', label: '+ Crear Nuevo Servicio', isSpecial: true },
    ...serviciosOrdenados.map(servicio => ({
      value: servicio._id!,
      label: servicio.nombre || 'Sin nombre'
    }))
  ], [serviciosOrdenados]);
  
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

      const response = await createMutation.mutateAsync(payload);
      const created = (response as { data?: { _id?: string } })?.data;
      await onSuccess?.(created);
    } catch (error) {
      console.error('Error al crear equipo:', error);

      // On EQUIPO_DUPLICATE, open the modal instead of a bare error — form
      // state is left intact so the user can cancel and keep editing.
      const duplicateResult = handleEquipoDuplicateError(error);
      if (duplicateResult.isDuplicate) {
        setDuplicateExisting(duplicateResult.existing);
      }
    }
  };

  const handleUseExisting = async (existing: EquipoItem) => {
    setDuplicateExisting(null);
    await onUseExisting?.(existing);
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
                    <Select
                      options={servicioOptions}
                      value={servicioOptions.find(opt => opt.value === formData.Servicio) || null}
                      onChange={(selected) => {
                        if (selected?.value === 'CREATE_NEW') {
                          setShowServicioModal(true);
                        } else {
                          handleInputChange('Servicio', selected?.value || '');
                        }
                      }}
                      placeholder="Seleccionar servicio..."
                      isSearchable
                      isClearable
                      noOptionsMessage={() => 'No hay servicios disponibles'}
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
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sede *</Form.Label>
                    <Select
                      options={sedeOptions}
                      value={sedeOptions.find(opt => opt.value === formData.SedeId) || null}
                      onChange={(selected) => {
                        if (selected?.value === 'CREATE_NEW') {
                          setShowSedeModal(true);
                        } else {
                          handleInputChange('SedeId', selected?.value || '');
                        }
                      }}
                      placeholder="Seleccionar sede..."
                      isSearchable
                      isClearable
                      noOptionsMessage={() => 'No hay sedes disponibles'}
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
                  isInvalid={hasLiveConflict}
                />
                {hasLiveConflict && (
                  <Form.Text className="text-danger d-block">
                    Ya existe un equipo con este ítem, marca y serie en este cliente.{' '}
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 align-baseline"
                      onClick={() => duplicateCheckData?.existing && setDuplicateExisting(duplicateCheckData.existing)}
                    >
                      Ver equipo
                    </Button>
                  </Form.Text>
                )}
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
              disabled={createMutation.isLoading || hasLiveConflict}
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

      {duplicateExisting && (
        <EquipoDuplicateModal
          show={!!duplicateExisting}
          onHide={() => setDuplicateExisting(null)}
          existing={duplicateExisting}
          onUseExisting={handleUseExisting}
          primaryLabel={onUseExistingLabel}
        />
      )}
    </Card>
  );
};

export default EquipoForm;

