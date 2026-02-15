import React from 'react';
import { Row, Col, Form, Button, Badge } from 'react-bootstrap';
import Select from 'react-select';
import { FaTimes } from 'react-icons/fa';
import { Mes, MESES, MESES_MAP } from '@/types/cronograma.types';
import { Sede } from '@/types/sede.types';
import { Servicio } from '@/types/servicio.types';

interface CronogramaFiltrosProps {
  // Valores actuales
  sedesSeleccionadas: string[];
  serviciosSeleccionados: string[];
  ubicacionesSeleccionadas: string[];
  mesesSeleccionados: Mes[];
  searchText: string;

  // Opciones disponibles
  sedesOptions: Sede[];
  serviciosOptions: Servicio[];
  ubicacionesOptions: string[];

  // Callbacks
  onSedesChange: (sedes: string[]) => void;
  onServiciosChange: (servicios: string[]) => void;
  onUbicacionesChange: (ubicaciones: string[]) => void;
  onMesesChange: (meses: Mes[]) => void;
  onSearchChange: (search: string) => void;
  onLimpiar: () => void;
}

/**
 * Componente de filtros multi-select para cronograma
 */
export const CronogramaFiltros: React.FC<CronogramaFiltrosProps> = ({
  sedesSeleccionadas,
  serviciosSeleccionados,
  ubicacionesSeleccionadas,
  mesesSeleccionados,
  searchText,
  sedesOptions,
  serviciosOptions,
  ubicacionesOptions,
  onSedesChange,
  onServiciosChange,
  onUbicacionesChange,
  onMesesChange,
  onSearchChange,
  onLimpiar
}) => {
  // Transformar a formato react-select
  const sedesSelectOptions = sedesOptions.map(sede => ({
    value: sede._id!,
    label: sede.nombreSede || 'Sin nombre'
  }));

  const serviciosSelectOptions = serviciosOptions.map(servicio => ({
    value: servicio._id!,
    label: servicio.nombre || 'Sin nombre'
  }));

  const ubicacionesSelectOptions = ubicacionesOptions.map(ubicacion => ({
    value: ubicacion,
    label: ubicacion
  }));

  const mesesSelectOptions = MESES.map(mes => ({
    value: mes,
    label: MESES_MAP[mes]
  }));

  // Contar filtros activos
  const filtrosActivos = 
    sedesSeleccionadas.length +
    serviciosSeleccionados.length +
    ubicacionesSeleccionadas.length +
    mesesSeleccionados.length +
    (searchText ? 1 : 0);

  // Estilos personalizados para react-select con z-index alto
  const selectStyles = {
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999
    })
  };

  return (
    <div className="cronograma-filtros mb-3">
      <Row className="g-3">
        {/* Búsqueda */}
        <Col md={12}>
          <Form.Group>
            <Form.Label className="small fw-bold">
              Búsqueda rápida
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Buscar por item, marca, modelo, serie, inventario..."
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              size="sm"
            />
          </Form.Group>
        </Col>

        {/* Sedes */}
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold">
              Sedes {sedesSeleccionadas.length > 0 && (
                <Badge bg="primary" pill className="ms-1">
                  {sedesSeleccionadas.length}
                </Badge>
              )}
            </Form.Label>
            <Select
              isMulti
              options={sedesSelectOptions}
              value={sedesSelectOptions.filter(opt => 
                sedesSeleccionadas.includes(opt.value)
              )}
              onChange={(selected) => 
                onSedesChange(selected.map(s => s.value))
              }
              placeholder="Seleccionar sedes..."
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => 'No hay sedes disponibles'}
              styles={selectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </Form.Group>
        </Col>

        {/* Servicios */}
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold">
              Servicios {serviciosSeleccionados.length > 0 && (
                <Badge bg="primary" pill className="ms-1">
                  {serviciosSeleccionados.length}
                </Badge>
              )}
            </Form.Label>
            <Select
              isMulti
              options={serviciosSelectOptions}
              value={serviciosSelectOptions.filter(opt => 
                serviciosSeleccionados.includes(opt.value)
              )}
              onChange={(selected) => 
                onServiciosChange(selected.map(s => s.value))
              }
              placeholder="Seleccionar servicios..."
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => 'No hay servicios disponibles'}
              styles={selectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </Form.Group>
        </Col>

        {/* Ubicaciones */}
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold">
              Ubicaciones {ubicacionesSeleccionadas.length > 0 && (
                <Badge bg="primary" pill className="ms-1">
                  {ubicacionesSeleccionadas.length}
                </Badge>
              )}
            </Form.Label>
            <Select
              isMulti
              options={ubicacionesSelectOptions}
              value={ubicacionesSelectOptions.filter(opt => 
                ubicacionesSeleccionadas.includes(opt.value)
              )}
              onChange={(selected) => 
                onUbicacionesChange(selected.map(u => u.value))
              }
              placeholder="Seleccionar ubicaciones..."
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => 'No hay ubicaciones disponibles'}
              styles={selectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </Form.Group>
        </Col>

        {/* Meses */}
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold">
              Meses {mesesSeleccionados.length > 0 && (
                <Badge bg="primary" pill className="ms-1">
                  {mesesSeleccionados.length}
                </Badge>
              )}
            </Form.Label>
            <Select
              isMulti
              options={mesesSelectOptions}
              value={mesesSelectOptions.filter(opt => 
                mesesSeleccionados.includes(opt.value as Mes)
              )}
              onChange={(selected) => 
                onMesesChange(selected.map(m => m.value as Mes))
              }
              placeholder="Seleccionar meses..."
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => 'No hay meses disponibles'}
              styles={selectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Botón limpiar filtros */}
      {filtrosActivos > 0 && (
        <Row className="mt-2">
          <Col>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={onLimpiar}
            >
              <FaTimes className="me-1" />
              Limpiar filtros ({filtrosActivos})
            </Button>
          </Col>
        </Row>
      )}
    </div>
  );
};
