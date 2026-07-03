import React, { useState } from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { BsDownload, BsSearch } from 'react-icons/bs';
import type { AnalyticsFilters } from '@/types';

interface Props {
  initialFilters: AnalyticsFilters;
  onApply: (filters: AnalyticsFilters) => void;
  onExportCsv: () => void;
}

const AnalyticsFilterBar: React.FC<Props> = ({ initialFilters, onApply, onExportCsv }) => {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(initialFilters);

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Row className="g-2 align-items-end mb-4">
      <Col xs={12} sm={4} md={3}>
        <Form.Group controlId="analytics-from">
          <Form.Label className="small text-muted mb-1">Desde</Form.Label>
          <Form.Control
            type="date"
            value={localFilters.from ?? ''}
            max={localFilters.to ?? undefined}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, from: e.target.value || undefined }))
            }
            aria-label="Fecha desde"
          />
        </Form.Group>
      </Col>

      <Col xs={12} sm={4} md={3}>
        <Form.Group controlId="analytics-to">
          <Form.Label className="small text-muted mb-1">Hasta</Form.Label>
          <Form.Control
            type="date"
            value={localFilters.to ?? ''}
            min={localFilters.from ?? undefined}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, to: e.target.value || undefined }))
            }
            aria-label="Fecha hasta"
          />
        </Form.Group>
      </Col>

      <Col xs="auto">
        <Button
          variant="primary"
          onClick={handleApply}
          aria-label="Aplicar filtros de fecha"
        >
          <BsSearch className="me-1" aria-hidden="true" />
          Aplicar
        </Button>
      </Col>

      <Col xs="auto" className="ms-auto">
        <Button
          variant="outline-secondary"
          onClick={onExportCsv}
          aria-label="Exportar datos como CSV"
        >
          <BsDownload className="me-1" aria-hidden="true" />
          Exportar CSV
        </Button>
      </Col>
    </Row>
  );
};

export default AnalyticsFilterBar;
