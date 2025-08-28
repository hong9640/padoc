'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// 데이터 타입 정의
export interface VoiceAnalysisData {
  voice_id: number;
  patient_id: number;
  created_at: string;
  a_features: {
    jitter: { [key: string]: number };
    shimmer: { [key: string]: number };
    hnr: number;
    nhr: number;
    f0: number;
    max_f0: number;
    min_f0: number;
  };
  sentence_features: {
    cpp: number;
    csid: number;
    sampling_data: {
      sampling_rate: number;
      data_points: { energy: number; frequency: number }[];
    };
  };
}

// Props 정의
interface DoctorDetailGraphProps {
  data: VoiceAnalysisData[];
  featureKeys: string[];
}

// 유틸 함수: key path로 값 추출
function getNestedValue(obj: any, keyPath: string): number | null {
  const keys = keyPath.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  return typeof current === 'number' ? current : null;
}

export default function DoctorDetailGraph({ data, featureKeys }: DoctorDetailGraphProps) {
  // x축 라벨
  const labels = data.map((entry) => {
    const date = new Date(entry.created_at);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  // 각 feature key에 대한 데이터셋 생성
  const datasets = featureKeys.map((key, idx) => {
    const color = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
    ][idx % 5];

    const border = color.replace('0.7', '1');

    return {
      label: key,
      data: data.map((entry) => {
        const value = getNestedValue(entry.a_features, key) ?? getNestedValue(entry.sentence_features, key);
        return value ?? 0;
      }),
      borderColor: border,
      backgroundColor: color,
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 4,
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'var(--gray-light)',
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
