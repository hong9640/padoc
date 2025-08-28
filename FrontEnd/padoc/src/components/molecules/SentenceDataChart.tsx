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
import { VoiceData } from '@/store/patientTrainingInformationStore';
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

interface SentenceDataChartProps {
  data: VoiceData | null;
  allData?: VoiceData[]; // 전체 데이터 배열 추가
}

export default function SentenceDataChart({ data, allData }: SentenceDataChartProps) {
  const chartColors = getChartColors();
  const doctorColors = getDoctorColors();
  
  if (!data) {
    return (
      <div className="text-center py-8" style={{ color: doctorColors.textLight, fontSize: '1.1rem', fontStyle: 'italic' }}>
        차트를 보려면 테이블에서 데이터 행을 선택하세요.
      </div>
    );
  }

  // related_voice_info_id와 voice_id가 같은 데이터를 찾아서 시간순으로 정렬
  const findRelatedData = (selectedData: VoiceData, allVoiceData: VoiceData[]): VoiceData[] => {
    const relatedData: VoiceData[] = [];
    
    // 선택된 데이터 추가
    relatedData.push(selectedData);
    
    // related_voice_info_id와 voice_id가 같은 데이터 찾기 (하나만 있음이 보장됨)
    const relatedVoiceData = allVoiceData.find(voiceData => 
      voiceData.voice_id === selectedData.related_voice_info_id || 
      voiceData.related_voice_info_id === selectedData.voice_id
    );
    
    if (relatedVoiceData && !relatedData.find(item => item.voice_id === relatedVoiceData.voice_id)) {
      relatedData.push(relatedVoiceData);
    }
    
    // 시간순으로 정렬
    return relatedData.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  // 관련 데이터 찾기
  const relatedData = allData ? findRelatedData(data, allData) : [data];

    // 모든 관련 데이터의 sampling_data를 시간순으로 합치기
  const combineAllDataPoints = (voiceDataArray: VoiceData[]) => {
    const allEnergy: number[] = [];
    const allFrequency: number[] = [];
    const timestamps: string[] = [];
    
    voiceDataArray.forEach((voiceData, dataIndex) => {
      if (!voiceData.sentence_features?.sampling_data?.data_points) {
        return;
      }

      const dataPoints = voiceData.sentence_features.sampling_data.data_points;
      
      // dataPoints가 단일 객체인 경우
      if (!Array.isArray(dataPoints)) {
        const point = dataPoints;
        const energy = point.energy;
        const frequency = point.frequency;
        
        if ((energy !== undefined && energy !== null) || 
            (frequency !== undefined && frequency !== null)) {
          allEnergy.push(energy !== undefined && energy !== null ? energy : 0);
          allFrequency.push(frequency !== undefined && frequency !== null ? frequency : 0);
          timestamps.push(`${voiceData.created_at}_${dataIndex}_0`);
        }
      } else {
        // dataPoints가 배열인 경우
        dataPoints.forEach((point, pointIndex) => {
          const energy = point.energy;
          const frequency = point.frequency;
          
          if ((energy !== undefined && energy !== null) || 
              (frequency !== undefined && frequency !== null)) {
            allEnergy.push(energy !== undefined && energy !== null ? energy : 0);
            allFrequency.push(frequency !== undefined && frequency !== null ? frequency : 0);
            timestamps.push(`${voiceData.created_at}_${dataIndex}_${pointIndex}`);
          }
        });
      }
    });

    return { energy: allEnergy, frequency: allFrequency, timestamps };
  };

  const combinedData = combineAllDataPoints(relatedData);

  if (combinedData.energy.length === 0 && combinedData.frequency.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: doctorColors.textLight, fontSize: '1.1rem', fontStyle: 'italic' }}>
        유효한 데이터가 없습니다. (모든 값이 0이거나 음수입니다)
      </div>
    );
  }

  const chartData = {
    labels: Array.from({ length: Math.max(combinedData.energy.length, combinedData.frequency.length) }, (_, index) => `Point ${index + 1}`),
    datasets: [
      {
        label: 'Energy',
        data: combinedData.energy,
        borderColor: chartColors.primary,
        backgroundColor: `${chartColors.primary}80`,
        yAxisID: 'y',
        borderWidth: 1,
        pointRadius: 0, // 포인트 숨김
        pointHoverRadius: 0, // 호버 포인트 숨김
      },
      {
        label: 'Frequency',
        data: combinedData.frequency,
        borderColor: chartColors.secondary,
        backgroundColor: `${chartColors.secondary}80`,
        yAxisID: 'y1',
        borderWidth: 1,
        pointRadius: 0, // 포인트 숨김
        pointHoverRadius: 0, // 호버 포인트 숨김
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest' as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: `Energy & Frequency 그래프 (${relatedData.length}개 데이터 통합)`,
        color: doctorColors.primary,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      legend: {
        position: 'top' as const,
        labels: {
          color: doctorColors.text,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: false, // 툴팁 비활성화
      }
    },
    scales: {
      x: {
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Energy',
          color: doctorColors.text,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        ticks: {
          color: doctorColors.text
        },
        grid: {
          color: chartColors.grid
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Frequency',
          color: doctorColors.text,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        ticks: {
          color: doctorColors.text
        },
        grid: {
          drawOnChartArea: false,
          color: chartColors.grid
        },
      },
    },
  };

  return (
    <div className="w-full h-96" style={{ padding: '1rem', backgroundColor: doctorColors.card, borderRadius: '12px', border: `1px solid ${doctorColors.border}` }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
