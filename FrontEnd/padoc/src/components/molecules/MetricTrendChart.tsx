'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getChartColors, getDoctorColors } from '@/utils/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MetricTrendChartProps {
  metricLabel: string;
  chartLabels: string[];
  chartValues: (number | null | undefined)[];
}

export default function MetricTrendChart({ metricLabel, chartLabels, chartValues }: MetricTrendChartProps) {
  const chartColors = getChartColors();
  const doctorColors = getDoctorColors();
  
  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: metricLabel,
        data: chartValues.map(v => (v === null || v === undefined ? NaN : v)), // null/undefined 값을 간격으로 처리
        borderColor: chartColors.primary,
        backgroundColor: `${chartColors.primary}80`,
        tension: 0.1,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: doctorColors.text,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `${metricLabel} 추세`,
        color: doctorColors.primary,
        font: {
          size: 14,
          weight: 'bold' as const
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: doctorColors.text
        },
        grid: {
          color: doctorColors.border
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          color: doctorColors.text
        },
        grid: {
          color: doctorColors.border
        }
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Line options={options} data={data} />
    </div>
  );
}
