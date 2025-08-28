"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface PatientGameData {
  avg_score: number;
  progress: string;
  date: string; // ISO 형식
}

export interface PatientGameGraphProps {
  data: PatientGameData[];
}

export default function PatientGameGraph({ data }: PatientGameGraphProps) {
  const labels = data.map((entry) => {
    const date = new Date(entry.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const dataset = {
    label: "평균 점수 (avg_score)",
    data: data.map((entry) => entry.avg_score),
    borderColor: "rgba(75, 192, 192, 1)",
    backgroundColor: "rgba(75, 192, 192, 0.3)",
    borderWidth: 3,
    tension: 0.3,
    pointRadius: 5,
    pointHoverRadius: 7,
  };

  const chartData = {
    labels,
    datasets: [dataset],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const index = context.dataIndex;
            const entry = data[index];
            return `점수: ${entry.avg_score}, 단계: ${entry.progress}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
        },
        grid: {
          color: "var(--gray-light)",
        },
      },
    },
  };

  return (
    <div style={{ width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
