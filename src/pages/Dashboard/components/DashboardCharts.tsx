import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

const PALETTE = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#20c997', '#fd7e14', '#6c757d', '#0dcaf0', '#d63384'];

interface Dataset {
  label: string;
  data: Array<number | null>;
  color?: string;
}

interface SeriesProps {
  labels: string[];
  datasets: Dataset[];
  ariaLabel: string;
  height?: number;
}

const toDatasets = (datasets: Dataset[], filled: boolean) =>
  datasets.map((d, i) => {
    const color = d.color ?? PALETTE[i % PALETTE.length];
    return { label: d.label, data: d.data, borderColor: color, backgroundColor: filled ? color : `${color}33`, tension: 0.25 };
  });

export const TrendChart: React.FC<SeriesProps> = ({ labels, datasets, ariaLabel, height = 220 }) => (
  <div style={{ height }} role="img" aria-label={ariaLabel}>
    <Line
      data={{ labels, datasets: toDatasets(datasets, false) }}
      options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
    />
  </div>
);

export const VerticalBarChart: React.FC<SeriesProps> = ({ labels, datasets, ariaLabel, height = 220 }) => (
  <div style={{ height }} role="img" aria-label={ariaLabel}>
    <Bar
      data={{ labels, datasets: toDatasets(datasets, true) }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      }}
    />
  </div>
);

export const HorizontalBarChart: React.FC<SeriesProps> = ({ labels, datasets, ariaLabel, height }) => (
  <div style={{ height: height ?? Math.max(160, labels.length * 28 + 40) }} role="img" aria-label={ariaLabel}>
    <Bar
      data={{ labels, datasets: toDatasets(datasets, true) }}
      options={{
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      }}
    />
  </div>
);

interface DoughnutProps {
  labels: string[];
  data: number[];
  ariaLabel: string;
  height?: number;
}

export const DoughnutChart: React.FC<DoughnutProps> = ({ labels, data, ariaLabel, height = 200 }) => (
  <div style={{ height }} role="img" aria-label={ariaLabel}>
    <Doughnut
      data={{ labels, datasets: [{ data, backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]) }] }}
      options={{ responsive: true, maintainAspectRatio: false }}
    />
  </div>
);
