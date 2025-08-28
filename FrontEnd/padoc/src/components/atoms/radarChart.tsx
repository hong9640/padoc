"use client";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { use, useEffect, useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useTestStore } from '@/store/testStore';
import { VoiceData } from '@/store/patientTrainingInformationStore';
import { getChartColors, getDoctorColors, getCSSVariable } from '@/utils/theme';
import useThemeStore from '@/store/themeStore';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);


interface RadarChartProps {
  data1: VoiceData;
  data2?: VoiceData;
  backgroundColor?: string;
  width?: string;
  height?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  showNormalRangeInfo?: boolean;
}

export default function RadarChart({ 
  data1, 
  data2, 
  backgroundColor,
  width = '100%',
  height = '500px',
  showLegend = true,
  showLabels = true,
  showNormalRangeInfo = false
}: RadarChartProps) {
  const labels = ['Jitter', 'Shimmer', 'NHR', 'RangeST', 'Max F0', 'Min F0'];
  const [isClient, setIsClient] = useState(false);
  
  // 테마 상태 구독
  const theme = useThemeStore((state) => state.theme);
  
  // Client-side hydration을 위한 상태
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 테마가 변경될 때마다 차트가 다시 렌더링되도록 함
  useEffect(() => {
    // 수동으로 data-theme 속성 설정 (useThemeInitializer가 작동하지 않는 경우 대비)
    if (isClient) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, isClient]);
  
  // Server-side에서는 기본값 사용, Client-side에서는 실제 값 사용
  // 테마가 변경될 때마다 색상이 업데이트되도록 theme 의존성 추가
  const chartColors = useMemo(() => {
    if (!isClient) {
      return {
        primary: '#1E3A8A',
        secondary: '#1976D2',
        accent: '#8CC93E',
        danger: '#E02A29',
        success: '#8CC93E',
        warning: '#FF9800',
        info: '#2196F3',
        purple: '#9C27B0',
        pink: '#E91E63',
        gray: '#9E9E9E',
        bg: '#FFFFFF',
        grid: '#E5E7EB',
        text: '#374151',
        border: '#E5E7EB',
      };
    }
    // 테마가 변경될 때마다 새로운 색상을 가져오기 위해 theme을 의존성으로 사용
    return getChartColors();
  }, [isClient, theme]); // theme 의존성 추가
  
  const doctorColors = useMemo(() => {
    if (!isClient) {
      return {
        primary: '#1E3A8A',
        secondary: '#1976D2',
        accent: '#8CC93E',
        bg: '#FFFFFF',
        card: '#FFFFFF',
        border: '#E5E7EB',
        text: '#374151',
        textLight: '#6B7280',
        success: '#8CC93E',
        warning: '#FF9800',
        danger: '#E02A29',
        info: '#2196F3',
      };
    }
    // 테마가 변경될 때마다 새로운 색상을 가져오기 위해 theme을 의존성으로 사용
    return getDoctorColors();
  }, [isClient, theme]); // theme 의존성 추가
  
  // 배경색이 지정되지 않은 경우 기본값 사용
  // CSS 변수인 경우 실제 색상 값으로 변환
  // 테마가 변경될 때마다 배경색이 업데이트되도록 theme 의존성 추가
  const chartBackgroundColor = useMemo(() => {
    let bgColor: string;
    
    if (backgroundColor) {
      if (backgroundColor.startsWith('var(--')) {
        bgColor = isClient 
          ? getCSSVariable(backgroundColor.replace('var(', '').replace(')', '')) 
          : '#FFFFFF';
      } else {
        bgColor = backgroundColor;
      }
    } else {
      // doctorColors.card 대신 차트 전용 배경색 변수 사용
      if (isClient) {
        // getCSSVariable 대신 직접 DOM에서 읽어오기
        const computedStyle = getComputedStyle(document.documentElement);
        bgColor = computedStyle.getPropertyValue('--chart-bg').trim() || '#FFFFFF';
      } else {
        bgColor = '#FFFFFF';
      }
    }
    
    return bgColor;
  }, [backgroundColor, isClient, theme]); // theme 의존성으로 CSS 변수 변경 감지

  // 정상 범위 값
  const normalRange = useTestStore((state) => state.normalRange);

  // 정규화: 정상값을 0.5로 만들고 ±range에 따라 0~1로 조정
  // 값이 0이면 0에 가깝게, 정상값이면 0.5에, 정상값보다 크면 1에 가깝게
  const normalizeWithCenter = (value: number, center: number, range: number) => {
    if (value === 0) return 0.1; // 0일 때는 바깥쪽에 위치
    return Math.max(0, Math.min(1, 0.5 + (value - center) / (2 * range)));
  };

  // rangeST 계산 함수
  const calculateRangeST = (data: VoiceData) => {
    if (!data.ah_features?.max_f0 || !data.ah_features?.min_f0) return 10;
    const rangeST = data.ah_features.max_f0 > 0 && data.ah_features.min_f0 > 0 
      ? 12 * Math.log2(data.ah_features.max_f0 / data.ah_features.min_f0)
      : 10;
    return rangeST;
  };

  // rangeST 전용 정규화 함수
  const normalizeRangeST = (rangeST: number) => {
    // rangeST=4 → 0.5, rangeST=30 → 0.1, rangeST=1 → 0.9
    // 선형 보간을 사용하여 정규화
    let normalized;
    if (rangeST <= 4) {
      // 1~4 범위: 0.9 ~ 0.5
      normalized = 0.9 - (rangeST - 1) * (0.4 / 3);
    } else {
      // 4~30 범위: 0.5 ~ 0.1
      normalized = 0.5 - (rangeST - 4) * (0.4 / 26);
    }
    const clamped = Math.max(0, Math.min(1, normalized));
    return clamped;
  };

  const normalizeVoiceData = (data: VoiceData) => [
    normalizeWithCenter(data.ah_features?.jitter.local ?? 0, normalRange.jitter.local, 0.05),
    normalizeWithCenter(data.ah_features?.shimmer.local ?? 0, normalRange.shimmer.local, 0.5),
    normalizeWithCenter(data.ah_features?.nhr ?? 0, normalRange.nhr, 0.1), // nhr 범위를 0.04에서 0.1로 확장
    // RangeST 정규화: 4를 중심으로 정규화, 4보다 크면 바깥쪽(낮은 값), 작으면 안쪽(높은 값)
    normalizeRangeST(calculateRangeST(data)), // rangeST 전용 정규화 함수 사용
    normalizeWithCenter(data.ah_features?.max_f0 ?? 0, normalRange.max_f0, 400),
    normalizeWithCenter(data.ah_features?.min_f0 ?? 0, normalRange.min_f0, 70),
  ];

  const originalValues1 = [
    data1.ah_features?.jitter.local,
    data1.ah_features?.shimmer.local,
    data1.ah_features?.nhr,
    calculateRangeST(data1),
    data1.ah_features?.max_f0,
    data1.ah_features?.min_f0,
  ];

  const originalValues2 = data2
    ? [
      data2.ah_features?.jitter.local,
      data2.ah_features?.shimmer.local,
      data2.ah_features?.nhr,
      calculateRangeST(data2),
      data2.ah_features?.max_f0,
      data2.ah_features?.min_f0,
    ]
    : [];

  const datasets = useMemo(() => {
    const datasetsArray: any[] = [];

    // 정상 범위는 data2 없을 때만 표시
    if (!data2) {
      datasetsArray.push({
        label: '정상 범위',
        data: [
          normalizeWithCenter(normalRange.jitter.local, normalRange.jitter.local, 0.05),
          normalizeWithCenter(normalRange.shimmer.local, normalRange.shimmer.local, 0.5),
          normalizeWithCenter(normalRange.nhr, normalRange.nhr, 0.1), // nhr 범위를 0.04에서 0.1로 확장
          // RangeST 정상 범위: 4를 중심으로 정규화
          normalizeRangeST(4), // rangeST 전용 정규화 함수 사용
          normalizeWithCenter(normalRange.max_f0, normalRange.max_f0, 400),
          normalizeWithCenter(normalRange.min_f0, normalRange.min_f0, 70),
        ],
        backgroundColor: `${chartColors.success}4D`, // 차트 성공 색상 with 30% opacity
        borderColor: chartColors.success, // 차트 성공 색상
        borderWidth: 0,
        pointBackgroundColor: chartColors.success,
        pointBorderColor: chartColors.success,
      });
    }

    const data1Label = (() => {
      try {
        return data1.created_at ? format(parseISO(data1.created_at), 'MM/dd HH:mm') : '테스트 결과';
      } catch (error) {
        return '테스트 결과';
      }
    })();

    // 첫 번째 측정값
    datasetsArray.push({
      label: data1Label,
      data: normalizeVoiceData(data1),
      backgroundColor: `${chartColors.primary}4D`, // 차트 메인 색상 with 30% opacity
      borderColor: chartColors.primary, // 차트 메인 색상
      borderWidth: 3,
      pointBackgroundColor: chartColors.primary,
      pointBorderColor: chartColors.primary,
    });

    // 두 번째 측정값 (비교)
    if (data2) {
      const data2Label = (() => {
        try {
          return data2.created_at ? format(parseISO(data2.created_at), 'MM/dd HH:mm') : '비교 데이터';
        } catch (error) {
          return '비교 데이터';
        }
      })();
      
      datasetsArray.unshift({
        label: data2Label,
        data: normalizeVoiceData(data2),
        backgroundColor: `${chartColors.danger}4D`, // 차트 위험 색상 with 30% opacity
        borderColor: chartColors.danger, // 차트 위험 색상
        borderWidth: 3,
        pointBackgroundColor: chartColors.danger,
        pointBorderColor: chartColors.danger,
      });
    }

    return datasetsArray;
  }, [data1, data2, normalRange, chartColors]); // 함수들은 제거하고 데이터와 색상만 의존


  const chartData = useMemo(() => ({
    labels,
    datasets,
  }), [labels, datasets]); // datasets는 이미 chartColors에 의존하므로 chartColors는 제거

  const options = useMemo(() => ({
    scales: {
      r: {
        beginAtZero: true,
        suggestedMin: 0,
        suggestedMax: 1,
        ticks: {
          display: false,
        },
        pointLabels: {
          display: showLabels,
          font: {
            size: 14,
            color: doctorColors.text, // doctor 페이지 텍스트 색상 사용 (테마 변경 시 자동 업데이트)
          },
        },
        grid: {
          color: chartColors.grid, // 차트 그리드 색상 사용 (테마 변경 시 자동 업데이트)
        },
        backgroundColor: chartBackgroundColor, // 배경색 설정 (테마 변경 시 자동 업데이트)
      },
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          color: doctorColors.text, // doctor 페이지 텍스트 색상 사용 (테마 변경 시 자동 업데이트)
          font: {
            size: 12
          }
        },
      },
      tooltip: {
        backgroundColor: doctorColors.card, // 테마 변경 시 자동 업데이트
        titleColor: doctorColors.text, // 테마 변경 시 자동 업데이트
        bodyColor: doctorColors.text, // 테마 변경 시 자동 업데이트
        borderColor: doctorColors.border, // 테마 변경 시 자동 업데이트
        borderWidth: 1,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: function (context: any) {
            const index = context.dataIndex;
            const datasetIndex = context.datasetIndex;
            const label = context.dataset.label || '';

            let value;

                         const normalValues = [
               normalRange.jitter.local,
               normalRange.shimmer.local,
               normalRange.nhr,
               4, // RangeST 정상 범위 값을 4로 설정
               normalRange.max_f0,
               normalRange.min_f0,
             ];

            if (data2) {
              if (label === '정상 범위') {
                value = normalValues[index];
              } else if (datasetIndex === 0) {
                value = originalValues2[index];
              } else if (datasetIndex === 1) {
                value = originalValues1[index];
              }
            } else {
              if (label === '정상 범위') {
                value = normalValues[index];
              } else if (datasetIndex === 1) {
                value = originalValues1[index];
              }
            }

            return `${label}: ${value}`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  }), [showLabels, showLegend, doctorColors, chartColors, chartBackgroundColor]); // 필요한 의존성만 포함

  return (
    <div style={{ 
      width: width, 
      height: height,
      backgroundColor: chartBackgroundColor,
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Radar key={theme} data={chartData} options={options} />
      {showNormalRangeInfo && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: isClient ? getCSSVariable('--green-light') : '#F0F9FF',
          border: `1px solid ${doctorColors.success}`, // 테마 변경 시 자동 업데이트
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: doctorColors.success, // 테마 변경 시 자동 업데이트
          textAlign: 'center',
          fontWeight: '500'
        }}>
          초록색 영역: 정상 범위
        </div>
      )}
    </div>
  );
}