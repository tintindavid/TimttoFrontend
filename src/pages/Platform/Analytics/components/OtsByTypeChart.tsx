import React from 'react';
import { Card } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// Palette for service type slices
const COLORS = [
  'rgba(13, 110, 253, 0.8)',
  'rgba(25, 135, 84, 0.8)',
  'rgba(255, 193, 7, 0.8)',
  'rgba(220, 53, 69, 0.8)',
  'rgba(13, 202, 240, 0.8)',
  'rgba(108, 117, 125, 0.8)',
  'rgba(111, 66, 193, 0.8)',
  'rgba(253, 126, 20, 0.8)',
];

interface Props {
  byType: Record<string, number>;
}

const OtsByTypeChart: React.FC<Props> = ({ byType }) => {
  const entries = Object.entries(byType).filter(([, count]) => count > 0);

  if (entries.length === 0) {
    return (
      <Card className="h-100 shadow-sm">
        <Card.Body>
          <Card.Title className="fs-6 text-muted">OTs por tipo de servicio</Card.Title>
          <div className="text-muted text-center py-4">Sin datos en el rango seleccionado</div>
        </Card.Body>
      </Card>
    );
  }

  const chartData = {
    labels: entries.map(([label]) => label),
    datasets: [
      {
        data: entries.map(([, count]) => count),
        backgroundColor: entries.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <Card.Title className="fs-6 text-muted">OTs por tipo de servicio</Card.Title>
        <Doughnut data={chartData} options={options} aria-label="Gráfico de dona: OTs por tipo de servicio" />
      </Card.Body>
    </Card>
  );
};

export default OtsByTypeChart;
