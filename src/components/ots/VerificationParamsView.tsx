import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { VerificationParam } from '@/types/reporte.types';

interface VerificationParamsViewProps {
  value: VerificationParam[];
}

const formatNumber = (v: number | null | undefined): string => {
  if (v === null || v === undefined) return '';
  if (!Number.isFinite(v)) return '';
  return v.toLocaleString('es-CO');
};

const VerificationParamsView: React.FC<VerificationParamsViewProps> = ({ value }) => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const hasMeasurement = value.some((row) => row && row.valorMedido !== null && row.valorMedido !== undefined);
  if (!hasMeasurement) return null;

  return (
    <Card className="mb-3">
      <Card.Header>
        <strong>Verificación de Parámetros</strong>
      </Card.Header>
      <Card.Body>
        <div className="table-responsive">
          <Table bordered size="sm" className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Magnitud</th>
                <th>Unidad</th>
                <th className="text-end">V. Ref</th>
                <th className="text-end">V. Medido</th>
                <th>Patrón</th>
              </tr>
            </thead>
            <tbody>
              {value.map((row, index) => (
                <tr key={row._id ?? `vp-view-${index}`}>
                  <td>{row.magnitud}</td>
                  <td>{row.unidad}</td>
                  <td className="text-end">{formatNumber(row.valorReferencia)}</td>
                  <td className="text-end">{formatNumber(row.valorMedido)}</td>
                  <td>{row.patron}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default VerificationParamsView;
