import React from 'react';
import { Card } from 'react-bootstrap';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { OtsPerTenantRow } from '@/types';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Props {
  data: OtsPerTenantRow[];
}

const OtsPerTenantChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return (
      <Card className="h-100 shadow-sm">
        <Card.Body>
          <Card.Title className="fs-6 text-muted">OTs abiertas por tenant</Card.Title>
          <div className="text-muted text-center py-4">Sin datos en el rango seleccionado</div>
        </Card.Body>
      </Card>
    );
  }

  const chartData = {
    labels: data.map((row) => row.tenantName),
    datasets: [
      {
        label: 'OTs abiertas',
        data: data.map((row) => row.count),
        backgroundColor: 'rgba(13, 110, 253, 0.7)',
        borderColor: 'rgba(13, 110, 253, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <Card.Title className="fs-6 text-muted">OTs abiertas por tenant</Card.Title>
        <Bar data={chartData} options={options} aria-label="Gráfico de barras: OTs abiertas por tenant" />
      </Card.Body>
    </Card>
  );
};

export default OtsPerTenantChart;
