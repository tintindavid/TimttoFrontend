import React from 'react';
import { Form } from 'react-bootstrap';
import { EstadoSolicitudRepuesto } from '@/types/repuesto.types';

interface RepuestoStatusDropdownProps {
  value?: EstadoSolicitudRepuesto | string;
  onChange?: (value: EstadoSolicitudRepuesto) => void;
  disabled?: boolean;
}

const RepuestoStatusDropdown: React.FC<RepuestoStatusDropdownProps> = ({ value, onChange, disabled }) => {
  return (
    <Form.Select
      size="sm"
      value={value || 'Solicitado'}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value as EstadoSolicitudRepuesto)}
    >
      <option value="Solicitado">Solicitado</option>
      <option value="En Proceso">En Proceso</option>
      <option value="Instalado">Instalado</option>
      <option value="Rechazado">Rechazado</option>
    </Form.Select>
  );
};

export default RepuestoStatusDropdown;
