import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import AsyncSelect from 'react-select/async';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaPlus } from 'react-icons/fa';
import { CreateRepuestoSolicitudDto, PrioridadRepuesto, OrigenRepuesto } from '@/types/repuesto.types';
import { useCreateRepuestoSolicitud } from '@/hooks/useRepuestos';
import { inventarioRepuestoService } from '@/services/inventarioRepuesto.service';
import InventarioItemModal from '@/components/inventario/InventarioItemModal';
import type { InventarioRepuesto } from '@/types/inventarioRepuesto.types';
import { useAuth } from '@/context/AuthContext';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';

interface InventarioOption {
  value: string;
  label: string;
}

/** Sentinel option: opens the "create new part" modal instead of selecting an item. */
const CREATE_OPTION_VALUE = '__create_new__';
const SEARCH_LIMIT = 20;

interface SolicitarRepuestoModalProps {
  show: boolean;
  onHide: () => void;
  reporteId: string;
  otId: string;
  equipoId: string;
  clienteId?: string;
}

const schema = yup.object().shape({
  nombre: yup.string().required('El nombre del repuesto es obligatorio'),
  Cantidad: yup.string().required('La cantidad es obligatoria'),
  Currency: yup.string().optional(),
  observacion: yup.string().optional(),
  origenRepuesto: yup.string().optional(),
  PrecioRepuesto: yup.number().min(0, 'El precio no puede ser negativo').optional(),
  Prioridad: yup.string().optional(),
});

export const SolicitarRepuestoModal: React.FC<SolicitarRepuestoModalProps> = ({
  show,
  onHide,
  reporteId,
  otId,
  equipoId,
  clienteId
}) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inventarioSeleccionadoId, setInventarioSeleccionadoId] = useState<string | undefined>(undefined);
  const createRepuestoMutation = useCreateRepuestoSolicitud();
  // Stock catalog (basic level) enabled: pick/create catalog items; otherwise free text as before.
  const { can } = useTenantCapabilities();
  const hasInventario = can('usesInventoryBasic');
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [createItemName, setCreateItemName] = useState('');
  const [searchText, setSearchText] = useState('');

  // Server-side search (no full catalog load); only active items are offered.
  const loadOptions = async (inputValue: string): Promise<InventarioOption[]> => {
    const response = await inventarioRepuestoService.list({
      search: inputValue.trim() || undefined,
      limit: SEARCH_LIMIT,
      sortBy: 'nombre',
      order: 'asc',
      activo: true,
    });
    const options = (response.data || [])
      .filter((it) => it._id)
      .map((it) => ({ value: it._id as string, label: it.nombre }));
    return [...options, { value: CREATE_OPTION_VALUE, label: '+ Crear nuevo repuesto' }];
  };

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<Omit<CreateRepuestoSolicitudDto, 'ResponsableSolicitud'>>({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      Cantidad: '',
      Currency: 'COP',
      observacion: '',
      origenRepuesto: '',
      PrecioRepuesto: 0,
      Prioridad: 'Media',
    }
  });

  const onSubmit = async (data: Omit<CreateRepuestoSolicitudDto, 'ResponsableSolicitud'>) => {

    
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
      alert('Error: Usuario no autenticado. Verifique que ha iniciado sesión correctamente.');
      return;
    }

    try {
      setLoading(true);
      await createRepuestoMutation.mutateAsync({
        reporteId,
        otId,
        equipoId,
        data: {
          ...data,
          ClienteId: clienteId,
          InventarioItemId: inventarioSeleccionadoId,
          ResponsableSolicitud: userId
        }
      });
      reset();
      onHide();
    } catch (error) {
      console.error('Error al crear solicitud de repuesto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setInventarioSeleccionadoId(undefined);
    onHide();
  };

  const prioridadOptions: PrioridadRepuesto[] = ['Baja', 'Media', 'Alta', 'Critica'];

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaPlus className="me-2" />
          Solicitar Repuesto
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          {!!createRepuestoMutation.error && (
            <Alert variant="danger">
              Error al crear la solicitud de repuesto
            </Alert>
          )}

          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre del Repuesto *</Form.Label>
                <Controller
                  name="nombre"
                  control={control}
                  render={({ field }) => {
                    if (!hasInventario) {
                      return (
                        <Form.Control
                          {...field}
                          type="text"
                          placeholder="Ej: Filtro de aceite, Bomba hidráulica..."
                          isInvalid={!!errors.nombre}
                        />
                      );
                    }

                    return (
                      <AsyncSelect<InventarioOption>
                        inputId="solicitar-repuesto-nombre"
                        aria-label="Nombre del repuesto"
                        isClearable
                        defaultOptions
                        loadOptions={loadOptions}
                        placeholder="Buscar repuesto del catálogo..."
                        noOptionsMessage={() => 'Sin resultados'}
                        loadingMessage={() => 'Buscando...'}
                        onInputChange={(text, meta) => {
                          if (meta.action === 'input-change') setSearchText(text);
                        }}
                        value={
                          field.value && inventarioSeleccionadoId
                            ? { value: inventarioSeleccionadoId, label: field.value }
                            : null
                        }
                        onChange={(selected) => {
                          if (selected?.value === CREATE_OPTION_VALUE) {
                            setCreateItemName(searchText.trim());
                            setShowCreateItem(true);
                            return;
                          }
                          field.onChange(selected?.label || '');
                          setInventarioSeleccionadoId(selected?.value || undefined);
                        }}
                      />
                    );
                  }}
                />
                <Form.Control.Feedback type="invalid" style={{ display: errors.nombre ? 'block' : 'none' }}>
                  {errors.nombre?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Cantidad *</Form.Label>
                <Controller
                  name="Cantidad"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Ej: 2, 1 unidad..."
                      isInvalid={!!errors.Cantidad}
                    />
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.Cantidad?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Prioridad *</Form.Label>
                <Controller
                  name="Prioridad"
                  control={control}
                  render={({ field }) => (
                    <Form.Select
                      {...field}
                      isInvalid={!!errors.Prioridad}
                    >
                      {prioridadOptions.map(prioridad => (
                        <option key={prioridad} value={prioridad}>
                          {prioridad}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.Prioridad?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Observaciones</Form.Label>
            <Controller
              name="observacion"
              control={control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  as="textarea"
                  rows={3}
                  placeholder="Detalles adicionales sobre el repuesto, especificaciones, etc."
                />
              )}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Solicitud'}
          </Button>
        </Modal.Footer>
      </Form>
      {/* Kept outside the <Form> so its submit never submits the request; the request state is preserved. */}
      <InventarioItemModal
        show={showCreateItem}
        onHide={() => setShowCreateItem(false)}
        advanced={can('usesInventoryAdvanced')}
        initialNombre={createItemName}
        onSaved={(created: InventarioRepuesto) => {
          // Select the new catalog item; the other request fields keep their value.
          setValue('nombre', created.nombre, { shouldValidate: true });
          setInventarioSeleccionadoId(created._id);
        }}
      />
    </Modal>
  );
};