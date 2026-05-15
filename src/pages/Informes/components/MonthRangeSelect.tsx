import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { MonthCode, MONTHS, MONTH_LABELS } from '@/types/informe.types';

interface MonthRangeSelectProps {
  mesDesde: MonthCode | '';
  mesHasta: MonthCode | '';
  onMesDesdeChange: (value: MonthCode) => void;
  onMesHastaChange: (value: MonthCode) => void;
  disabled?: boolean;
}

export const MonthRangeSelect: React.FC<MonthRangeSelectProps> = ({
  mesDesde,
  mesHasta,
  onMesDesdeChange,
  onMesHastaChange,
  disabled = false,
}) => {
  const desdeIdx = mesDesde ? MONTHS.indexOf(mesDesde) : -1;

  const handleDesdeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDesde = e.target.value as MonthCode;
    onMesDesdeChange(newDesde);

    // If the current mesHasta is before the new mesDesde, reset it to match
    if (mesHasta && MONTHS.indexOf(mesHasta) < MONTHS.indexOf(newDesde)) {
      onMesHastaChange(newDesde);
    }
  };

  const handleHastaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onMesHastaChange(e.target.value as MonthCode);
  };

  return (
    <Row className="g-3 align-items-end">
      <Col xs={12} md={6}>
        <Form.Group controlId="mesDesde">
          <Form.Label className="fw-semibold text-muted small text-uppercase">
            Mes Desde
          </Form.Label>
          <Form.Select
            value={mesDesde}
            onChange={handleDesdeChange}
            disabled={disabled}
            aria-label="Mes de inicio del periodo"
          >
            <option value="">-- Seleccione --</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {MONTH_LABELS[m]}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>

      <Col xs={12} md={6}>
        <Form.Group controlId="mesHasta">
          <Form.Label className="fw-semibold text-muted small text-uppercase">
            Mes Hasta
          </Form.Label>
          <Form.Select
            value={mesHasta}
            onChange={handleHastaChange}
            disabled={disabled || !mesDesde}
            aria-label="Mes de fin del periodo"
          >
            <option value="">-- Seleccione --</option>
            {MONTHS.filter((_, idx) => idx >= desdeIdx).map((m) => (
              <option key={m} value={m}>
                {MONTH_LABELS[m]}
              </option>
            ))}
          </Form.Select>
          {!mesDesde && (
            <Form.Text className="text-muted">Seleccione primero el mes de inicio</Form.Text>
          )}
        </Form.Group>
      </Col>
    </Row>
  );
};

export default MonthRangeSelect;
