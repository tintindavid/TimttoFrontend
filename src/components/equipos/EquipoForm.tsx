import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Button, Row, Col, Spinner, Alert 
} from 'react-bootstrap';
import { useItems } from '@/hooks/useItems';
import { useCreateEquipoItem } from '@/hooks/useEquipoItems';
import { Sede } from '@/types/sede.types';
import { Servicio } from '@/types/servicio.types';
import { CreateEquipoItemDto } from '@/types/equipoItem.types';

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
  const [formData, setFormData] = useState({
    ClienteId: customerId,
    item: '',
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

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const items = itemsData?.data || [];
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
        mesesMtto: formData.mesesMtto
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
                      onChange={(e) => handleInputChange('Servicio', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar servicio...</option>
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
                      onChange={(e) => handleInputChange('SedeId', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar sede...</option>
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
                  <Form.Select
                    value={formData.ItemId}
                    onChange={(e) => handleInputChange('ItemId', e.target.value)}
                  >
                    <option value="">Sin item relacionado</option>
                    {items.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.Nombre}
                      </option>
                    ))}
                  </Form.Select>
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
    </Card>
  );
};

export default EquipoForm;