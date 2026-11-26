import React from 'react';
import { useDashboardItems } from '@/hooks/useDashboardSections';
import type { DashboardFilters } from '@/types/dashboard.types';
import DashboardCardShell from './DashboardCardShell';
import { HorizontalBarChart } from './DashboardCharts';

interface Props {
  filters: DashboardFilters;
  enabled?: boolean;
}

const ItemsBarChart: React.FC<Props> = ({ filters, enabled = true }) => {
  const q = useDashboardItems(filters, enabled);
  const d = q.data;
  if (d && !d.disponible) return null;

  return (
    <DashboardCardShell
      title="Mantenimientos por tipo de ítem"
      subtitle={d ? `${d.periodo.etiqueta} · ${d.total} en total` : undefined}
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => q.refetch()}
    >
      {d &&
        (d.items.length === 0 ? (
          <div className="text-muted text-center py-3">Sin datos en el período</div>
        ) : (
          <HorizontalBarChart
            ariaLabel="Mantenimientos por tipo de ítem"
            labels={d.items.map((i) => i.tipo)}
            datasets={[{ label: 'Cantidad', data: d.items.map((i) => i.cantidad) }]}
          />
        ))}
    </DashboardCardShell>
  );
};

export default ItemsBarChart;
