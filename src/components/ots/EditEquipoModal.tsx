import React, { useMemo, useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner, Card } from 'react-bootstrap';
import Select from 'react-select';
import { FaEdit, FaSave } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { equipoItemService } from '@/services/equipoItem.service';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import useItems from '@/hooks/useItems';
import { useEquipoItem } from '@/hooks/useEquipoItems';

interface EditEquipoModalProps {
  show: boolean;
  onHide: () => void;
  equipo: {
    _id: string;
    ClienteId?: string;
    SedeId?: string;
    Servicio?: string;
    ItemId?: { 
        _id: string 
        protocoloId?: string
        ProtocoloId?: string
    };
  };
  reporteId: string | undefined;
  onSuccess?: () => void;
}

const EditEquipoModal: React.FC<EditEquipoModalProps> = ({ 
  show, 
  onHide, 
  equipo,
  reporteId = undefined,
  onSuccess 
}) => {
    
    const shouldLoadContext = show && !!equipo?.ClienteId;
    
    const { data: sedesData } = useSedesByCustomer(equipo?.ClienteId || '', {}, {
        enabled: shouldLoadContext
    });

    console.log('reporteId:', reporteId);
    
    const { data: serviciosData } = useServiciosByCustomer(equipo?.ClienteId || '', {}, {
        enabled: shouldLoadContext
    });
    const { data: itemsData, isLoading: loadingItems } = useItems({
    limit: 100 // Cargar muchos items para el dropdown
    });

    const {data:equipoData, isLoading: loadingEquipo} = useEquipoItem(equipo._id);
    
    // Items ordenados alfabéticamente
    const items = useMemo(() => {
      const rawItems = itemsData?.data || [];
      return [...rawItems].sort((a, b) => {
        const nameA = (a.Nombre || '').toUpperCase();
        const nameB = (b.Nombre || '').toUpperCase();
        return nameA.localeCompare(nameB);
      });
    }, [itemsData?.data]);

    // Sedes ordenadas alfabéticamente
    const sedes = useMemo(() => {
      const rawSedes = sedesData?.data || [];
      return [...rawSedes].sort((a, b) => {
        const nameA = (a.nombreSede || '').toUpperCase();
        const nameB = (b.nombreSede || '').toUpperCase();
        return nameA.localeCompare(nameB);
      });
    }, [sedesData?.data]);

    // Servicios ordenados alfabéticamente
    const servicios = useMemo(() => {
      const rawServicios = serviciosData?.data || [];
      return [...rawServicios].sort((a, b) => {
        const nameA = (a.nombre || '').toUpperCase();
        const nameB = (b.nombre || '').toUpperCase();
        return nameA.localeCompare(nameB);
      });
    }, [serviciosData?.data]);

    // Opciones para react-select
    const itemOptions = useMemo(() => 
      items.map(item => ({
        value: item._id,
        label: item.Nombre
      })),
      [items]
    );

    const sedeOptions = useMemo(() => 
      sedes.map(sede => ({
        value: sede._id!,
        label: sede.nombreSede || 'Sin nombre'
      })),
      [sedes]
    );

    const servicioOptions = useMemo(() => 
      servicios.map(servicio => ({
        value: servicio._id!,
        label: servicio.nombre || 'Sin nombre'
      })),
      [servicios]
    );  

    const [formData, setFormData] = useState({
        reportId: reporteId,
        ItemId: typeof equipoData?.data.ItemId === 'string'
            ? equipoData.data.ItemId
            : (equipoData?.data.ItemId as any)?._id || equipo.ItemId?._id || '',
        Marca: equipoData?.data.Marca || '',
        Modelo: equipoData?.data.Modelo || '',
        Serie: equipoData?.data.Serie || '',
        Inventario: equipoData?.data.Inventario || '',
        Ubicacion: equipoData?.data.Ubicacion || '',
        SedeId: typeof equipoData?.data.SedeId === 'string'
            ? equipoData.data.SedeId
            : (equipoData?.data.SedeId as any)?._id || '',
        Servicio: typeof equipoData?.data.Servicio === 'string'
            ? equipoData.data.Servicio
            : (equipoData?.data.Servicio as any)?._id || '',
        Riesgo: equipoData?.data.Riesgo || '',
        Invima: equipoData?.data.Invima || '',
        mesesMtto: equipoData?.data.mesesMtto || [],
    });

  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);



    if (!formData.Marca.trim()) {
      setError('La marca es requerida');
      return;
    }

    if (!formData.Modelo.trim()) {
      setError('El modelo es requerido');
      return;
    }

    if (!formData.Serie.trim()) {
      setError('La serie es requerida');
      return;
    }

    setUpdating(true);
    try {
      // Si hay reporteId, actualizar snapshot (para reportes)
      // Si NO hay reporteId, actualizar equipo directamente (para cronogramas, etc.)
      if (reporteId && reporteId.trim()) {
        await equipoItemService.updateSnapshot(equipo._id, formData);
      } else {
        // Para actualización normal, no enviar reportId
        const { reportId, ...updateData } = formData;
        await equipoItemService.update(equipo._id, updateData);
      }
       
      // Mostrar alerta de éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Equipo Actualizado!',
        text: 'La información del equipo se ha actualizado exitosamente.',
        confirmButtonColor: '#28a745',
        timer: 2000,
        showConfirmButton: false
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onHide();
    } catch (err: any) {
      console.error('Error al actualizar equipo:', err);
      
      // Mostrar alerta de error
      await Swal.fire({
        icon: 'error',
        title: 'Error al Actualizar',
        text: err.response?.data?.message || 'No se pudo actualizar el equipo. Inténtelo de nuevo.',
        confirmButtonColor: '#d33'
      });
      
      setError(err.response?.data?.message || 'Error al actualizar el equipo. Inténtelo de nuevo.');
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    if (!updating) {
      setError(null);
      onHide();
    }
  };


  const useEffect=React.useEffect(() => {
    if(show){
        setFormData({   
            reportId: reporteId,
            ItemId: typeof equipoData?.data.ItemId === 'string'
                ? equipoData.data.ItemId
                : (equipoData?.data.ItemId as any)?._id || '',
            Marca: equipoData?.data.Marca || '',
            Modelo: equipoData?.data.Modelo || '',  
            Serie: equipoData?.data.Serie || '',
            Inventario: equipoData?.data.Inventario || '',
            Ubicacion: equipoData?.data.Ubicacion || '',
            SedeId: typeof equipoData?.data.SedeId === 'string'

                ? equipoData.data.SedeId
                : (equipoData?.data.SedeId as any)?._id || '',
            Servicio: typeof equipoData?.data.Servicio === 'string'
                ? equipoData.data.Servicio  
                : (equipoData?.data.Servicio as any)?._id || '',
            Riesgo: equipoData?.data.Riesgo || '',
            Invima: equipoData?.data.Invima || '',
            mesesMtto: equipoData?.data.mesesMtto || [],
        });
    }
  }, [show, equipoData, reporteId]);


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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  const handleMesesMttoChange = (mes: string, checked: boolean) => {
    setFormData(prev => {
      const mesesMtto = new Set(prev.mesesMtto);    
        if (checked) {
            mesesMtto.add(mes);

        } else {
            mesesMtto.delete(mes);
        }
        return { ...prev, mesesMtto: Array.from(mesesMtto) };
    });
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop={updating ? 'static' : true}>
      <Modal.Header closeButton={!updating}>
        <Modal.Title>
          <FaEdit className="me-2" />
          Editar Información del Equipo
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="info">
            <strong>Importante:</strong> Los cambios actualizarán tanto el equipo maestro como el snapshot de este reporte.
          </Alert>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Información Básica del Equipo */}
          <div className="mb-4">
            <h6 className="text-muted mb-3">Información Básica</h6>
            <Row>
              <Col md={12}>
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
                        onChange={(selected) => handleInputChange('ItemId', selected?.value || '')}
                        placeholder="Sin item relacionado"
                        isSearchable
                        isClearable
                        noOptionsMessage={() => 'No se encontraron items'}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                    />
                    )}
                    <Form.Text className="text-muted">
                    Opcional: Relacionar con un item del catálogo
                    </Form.Text>
              </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Marca *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.Marca}
                    onChange={(e) => handleChange('Marca', e.target.value)}
                    placeholder="Ej: Philips, GE Healthcare, Mindray..."
                    required
                    disabled={updating}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Modelo *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.Modelo}
                    onChange={(e) => handleChange('Modelo', e.target.value)}
                    placeholder="Ej: IntelliVue MX40, CARESCAPE R860..."
                    required
                    disabled={updating}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Serie *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.Serie}
                    onChange={(e) => handleChange('Serie', e.target.value)}
                    placeholder="Número de serie del fabricante"
                    required
                    disabled={updating}
                  />
                  <Form.Text className="text-muted">
                    Número de serie único del equipo
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Inventario</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.Inventario}
                    onChange={(e) => handleChange('Inventario', e.target.value)}
                    placeholder="Código de inventario interno"
                    disabled={updating}
                  />
                  <Form.Text className="text-muted">
                    Código interno de la institución
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
                <Col md={4}>
                    <Form.Group className="mb-3">
                    <Form.Label>Sede *</Form.Label>
                    <Select
                        options={sedeOptions}
                        value={sedeOptions.find(opt => opt.value === formData?.SedeId) || null}
                        onChange={(selected) => handleInputChange('SedeId', selected?.value || '')}
                        placeholder="Seleccionar sede..."
                        isSearchable
                        isClearable
                        noOptionsMessage={() => 'No hay sedes disponibles'}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                    />
                    </Form.Group>
                </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                <Form.Label>Servicio *</Form.Label>
                <Select
                    options={servicioOptions}
                    value={servicioOptions.find(opt => opt.value === formData.Servicio) || null}
                    onChange={(selected) => handleInputChange('Servicio', selected?.value || '')}
                    placeholder="Seleccionar servicio..."
                    isSearchable
                    isClearable
                    noOptionsMessage={() => 'No hay servicios disponibles'}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 })
                    }}
                />
                </Form.Group>
              </Col>  
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Ubicación Física</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.Ubicacion}
                    onChange={(e) => handleChange('Ubicacion', e.target.value)}
                    placeholder="Ej: UCI - Piso 3 - Habitación 302"
                    disabled={updating}
                  />
                  <Form.Text className="text-muted">
                    Ubicación específica del equipo en la institución
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}> {/* Campos adicionales como Riesgo II, IIA, etc riesgo medico debe ser un select*/} 
                <Form.Group className="mb-3">
                  <Form.Label>Nivel de Riesgo</Form.Label>
                  <Form.Select
                    value={formData.Riesgo}
                    onChange={(e) => handleChange('Riesgo', e.target.value)}
                    disabled={updating}
                  >
                    <option value="">Seleccionar nivel de riesgo...</option>
                    <option value="I">I</option>
                    <option value="II">IIA</option>
                    <option value="III">IIB</option>
                    <option value="IV">III</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Nivel de riesgo médico del equipo (si aplica)
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Invima</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.Invima}
                        onChange={(e) => handleChange('Invima', e.target.value)}
                        placeholder="Número de registro Invima"
                        disabled={updating}
                      />
                    </Form.Group>
              </Col>
            </Row>
          </div>
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
        </Modal.Body>



        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={updating}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={updating}
          >
            {updating ? (
              <>
                <Spinner size="sm" className="me-2" />
                Actualizando...
              </>
            ) : (
              <>
                <FaSave className="me-1" />
                Guardar Cambios
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditEquipoModal;
