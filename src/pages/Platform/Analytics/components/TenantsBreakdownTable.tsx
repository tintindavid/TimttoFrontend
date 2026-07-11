import React from 'react';
import { Table, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { TenantBreakdownRow } from '@/types';

interface Props {
  rows: TenantBreakdownRow[];
}

const STATUS_LABELS: Record<TenantBreakdownRow['status'], string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  closed: 'Cerrado',
};

const STATUS_VARIANTS: Record<TenantBreakdownRow['status'], string> = {
  active: 'success',
  suspended: 'warning',
  closed: 'secondary',
};

const TenantsBreakdownTable: React.FC<Props> = ({ rows }) => {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return <Alert variant="info">Sin tenants en el rango seleccionado.</Alert>;
  }

  return (
    <Table
      striped
      hover
      responsive
      aria-label="Tabla de tenants con métricas detalladas"
      className="mt-2"
    >
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Estado</th>
          <th>Plan</th>
          <th>Creado</th>
          <th className="text-end">Usuarios</th>
          <th className="text-end">Equipos</th>
          <th className="text-end">OTs Abiertas</th>
          <th className="text-end">OTs Cerradas</th>
          <th className="text-end">Reportes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.tenantId}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/admin/tenants/${row.tenantId}`)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/admin/tenants/${row.tenantId}`);
            }}
            aria-label={`Ver detalle de ${row.tenantName}`}
          >
            <td>{row.tenantName}</td>
            <td>
              <Badge bg={STATUS_VARIANTS[row.status]}>
                {STATUS_LABELS[row.status]}
              </Badge>
            </td>
            <td>
              <Badge bg="outline" text="dark" className="border border-secondary text-secondary">
                {row.plan || '—'}
              </Badge>
            </td>
            <td>
              {(() => {
                try {
                  return format(new Date(row.createdAt), 'dd/MM/yyyy');
                } catch {
                  return '—';
                }
              })()}
            </td>
            <td className="text-end">{row.usersCount}</td>
            <td className="text-end">{row.equiposCount}</td>
            <td className="text-end">{row.otsOpen}</td>
            <td className="text-end">{row.otsClosed}</td>
            <td className="text-end">{row.reportsCount}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TenantsBreakdownTable;
