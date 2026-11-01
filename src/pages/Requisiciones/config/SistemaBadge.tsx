import React from 'react';
import { Badge, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';

export const SISTEMA_HINT = 'Dato por defecto: no se puede eliminar, desactivar ni renombrar; sí puedes ajustar sus valores.';

/** «Por defecto» label for system rows (seeded by the platform). */
export const SistemaBadge: React.FC<{ esSistema?: boolean; className?: string }> = ({ esSistema, className = 'ms-2' }) => {
  if (!esSistema) return null;
  return (
    <OverlayTrigger placement="top" overlay={<Tooltip id="sistema-hint">{SISTEMA_HINT}</Tooltip>}>
      <Badge bg="info" className={className} tabIndex={0}>
        Por defecto
      </Badge>
    </OverlayTrigger>
  );
};

/** Help text shown under locked inputs of system rows. */
export const SistemaNote: React.FC<{ text?: string }> = ({ text = 'Dato por defecto: no se puede renombrar.' }) => (
  <Form.Text className="text-muted d-block">{text}</Form.Text>
);
