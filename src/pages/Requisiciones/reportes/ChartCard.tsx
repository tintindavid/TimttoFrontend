import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/** Color-blind safe palette (Okabe-Ito); readable on light and dark backgrounds. */
export const CHART_COLORS = ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#56B4E9', '#D55E00'];
const GRID_COLOR = 'rgba(128, 128, 128, 0.25)';

export interface ChartSeries {
  label: string;
  values: Array<number | null>;
}

interface Props {
  title: string;
  /** Short description for screen readers (what the chart shows). */
  description: string;
  labels: string[];
  series: ChartSeries[];
  /** Horizontal bars (long category labels). */
  horizontal?: boolean;
  /** Axis title and cell formatter (default: plain numbers). */
  axisLabel?: string;
  formatValue?: (value: number | null) => string;
  /** Header of the first column of the equivalent table. */
  categoryHeader?: string;
  testId?: string;
}

const defaultFormat = (value: number | null): string => (value == null ? '—' : value.toLocaleString('es-CO'));

/** Bar chart with its accessible equivalent: the same figures as a table (always in the DOM). */
const ChartCard: React.FC<Props> = ({
  title,
  description,
  labels,
  series,
  horizontal = false,
  axisLabel,
  formatValue = defaultFormat,
  categoryHeader = 'Categoría',
  testId,
}) => {
  const data = {
    labels,
    datasets: series.map((serie, index) => ({
      label: serie.label,
      data: serie.values.map((value) => value ?? 0),
      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
      borderWidth: 0,
    })),
  };

  const valueAxis = {
    beginAtZero: true,
    grid: { color: GRID_COLOR },
    title: axisLabel ? { display: true, text: axisLabel } : undefined,
  };
  const options = {
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    responsive: true,
    plugins: {
      legend: { display: series.length > 1, position: 'bottom' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: horizontal ? { x: valueAxis, y: { grid: { display: false } } } : { y: valueAxis, x: { grid: { display: false } } },
  };

  return (
    <Card className="h-100 shadow-sm" data-testid={testId}>
      <Card.Body>
        <Card.Title className="fs-6 text-muted">{title}</Card.Title>
        <div role="img" aria-label={`${title}. ${description}`}>
          <Bar data={data} options={options} aria-hidden="true" />
        </div>
        <details className="mt-2">
          <summary className="small text-muted">Ver como tabla</summary>
          <div className="table-responsive">
            <Table size="sm" className="mb-0 mt-2" aria-label={`${title}, tabla equivalente`}>
              <thead>
                <tr>
                  <th scope="col">{categoryHeader}</th>
                  {series.map((serie) => (
                    <th key={serie.label} scope="col" className="text-end">
                      {serie.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labels.map((label, row) => (
                  <tr key={label}>
                    <th scope="row" className="fw-normal">
                      {label}
                    </th>
                    {series.map((serie) => (
                      <td key={serie.label} className="text-end">
                        {formatValue(serie.values[row] ?? null)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </details>
      </Card.Body>
    </Card>
  );
};

export default ChartCard;
