import React from 'react';
import { Card } from 'react-bootstrap';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { EquiposTimelineRow } from '@/types';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

interface Props {
  data: EquiposTimelineRow[];
}

const EquiposTimelineChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title className="fs-6 text-muted">Equipos registrados por mes</Card.Title>
          <div className="text-muted text-center py-4">Sin datos en el rango seleccionado</div>
        </Card.Body>
      </Card>
    );
  }

  const chartData = {
    labels: data.map((row) => row.month),
    datasets: [
      {
        label: 'Equipos registrados',
        data: data.map((row) => row.count),
        fill: true,
        backgroundColor: 'rgba(25, 135, 84, 0.15)',
        borderColor: 'rgba(25, 135, 84, 1)',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="fs-6 text-muted">Equipos registrados por mes</Card.Title>
        <Line data={chartData} options={options} aria-label="Gráfico de línea: equipos registrados por mes" />
      </Card.Body>
    </Card>
  );
};

export default EquiposTimelineChart;
