import React from 'react';
import { Button, ButtonGroup, Form } from 'react-bootstrap';
import { FaPrint, FaPlus, FaCheckSquare, FaTimesCircle } from 'react-icons/fa';

interface CronogramaAccionesProps {
  equiposSeleccionados: number;
  todosVisiblesSeleccionados: boolean;
  onImprimir: () => void;
  onCrearOT: () => void;
  onToggleTodosVisibles: () => void;
  onLimpiarSeleccion: () => void;
  mostrarCrearOT?: boolean;
}

/**
 * Componente de barra de acciones del cronograma
 */
export const CronogramaAcciones: React.FC<CronogramaAccionesProps> = ({
  equiposSeleccionados,
  todosVisiblesSeleccionados,
  onImprimir,
  onCrearOT,
  onToggleTodosVisibles,
  onLimpiarSeleccion,
  mostrarCrearOT = true
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
      <div className="d-flex align-items-center gap-3">
        <Form.Check
          type="checkbox"
          label={
            <span className="fw-bold">
              Seleccionar todos los visibles
            </span>
          }
          checked={todosVisiblesSeleccionados}
          onChange={onToggleTodosVisibles}
        />
        
        {equiposSeleccionados > 0 && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={onLimpiarSeleccion}
          >
            <FaTimesCircle className="me-1" />
            Limpiar Selección
          </Button>
        )}
      </div>

      <ButtonGroup>
        <Button
          variant="outline-primary"
          onClick={onImprimir}
          disabled={false}
        >
          <FaPrint className="me-2" />
          Imprimir Visible
        </Button>
        
        {mostrarCrearOT && (
          <Button
            variant="success"
            onClick={onCrearOT}
            disabled={equiposSeleccionados === 0}
          >
            <FaPlus className="me-2" />
            Crear OT ({equiposSeleccionados})
          </Button>
        )}
      </ButtonGroup>
    </div>
  );
};
