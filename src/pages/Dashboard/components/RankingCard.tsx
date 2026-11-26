import React from 'react';
import { Table } from 'react-bootstrap';
import { useDashboardRanking } from '@/hooks/useDashboardSections';
import type { DashboardFilters } from '@/types/dashboard.types';
import DashboardCardShell from './DashboardCardShell';

interface Props {
  filters: DashboardFilters;
  enabled?: boolean;
}

const RankingCard: React.FC<Props> = ({ filters, enabled = true }) => {
  const q = useDashboardRanking(filters, enabled);
  const d = q.data;
  if (d && !d.disponible) return null;

  return (
    <DashboardCardShell
      title="Ranking de técnicos"
      subtitle={d ? `${d.periodo.etiqueta} · top 10` : undefined}
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => q.refetch()}
    >
      {d &&
        (d.items.length === 0 ? (
          <div className="text-muted text-center py-3">Sin mantenimientos realizados en el período</div>
        ) : (
          <Table size="sm" responsive hover className="mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Técnico</th>
                <th className="text-end">Realizados</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((r, i) => (
                <tr key={r.userId}>
                  <td>{i + 1}</td>
                  <td>{r.nombre}</td>
                  <td className="text-end">{r.realizados}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ))}
    </DashboardCardShell>
  );
};

export default RankingCard;
