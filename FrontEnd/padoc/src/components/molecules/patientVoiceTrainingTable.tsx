"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { VoiceData } from "@/store/patientTrainingInformationStore";
import usePatientTrainingStore from "@/store/patientTrainingInformationStore";
import MetricTrendChart from "./MetricTrendChart";

interface PatientVoiceTrainingTableProps {
  data: VoiceData[];
  resetExpandedMetric?: boolean;
}

const PatientVoiceTrainingTable = ({ 
  data, 
  resetExpandedMetric
}: PatientVoiceTrainingTableProps) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();
  const pageSize = 7;
  
  // store에서 선택된 날짜 가져오기
  const selectedDates = usePatientTrainingStore(state => state.selectedDates);


  // localStorage에서 토큰 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      setAccessToken(token);
    }
  }, []);

  // resetExpandedMetric이 true일 때 expandedMetric 상태 초기화
  useEffect(() => {
    if (resetExpandedMetric) {
      setExpandedMetric(null);
    }
  }, [resetExpandedMetric]);

  const allAhData = useMemo(() => data
    .filter(d => d.ah_features !== null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [data]);

  const totalItems = allAhData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  useEffect(() => {
    const newTotalPages = Math.ceil(allAhData.length / pageSize);
    setCurrentPage(newTotalPages > 0 ? newTotalPages - 1 : 0);
  }, [allAhData.length, pageSize]);

  const ahData = useMemo(() => {
    if (totalItems === 0) return [];
    let firstPageSize = totalItems % pageSize;
    if (firstPageSize === 0 && totalItems > 0) firstPageSize = pageSize;

    if (currentPage === 0) {
      return allAhData.slice(0, firstPageSize);
    } else {
      const startIndex = firstPageSize + (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return allAhData.slice(startIndex, endIndex);
    }
  }, [allAhData, currentPage, pageSize, totalItems]);

  const uniqueDates = Array.from(
    new Set(ahData.map((d) => format(new Date(d.created_at), "yyyy-MM-dd")))
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const voiceMap: Record<string, VoiceData[]> = {};
  ahData.forEach((voice) => {
    try {
      const date = format(parseISO(voice.created_at), "yyyy-MM-dd");
      if (!voiceMap[date]) voiceMap[date] = [];
      voiceMap[date].push(voice);
    } catch (error) {
      console.error('날짜 파싱 오류:', voice.created_at, error);
    }
  });

  Object.keys(voiceMap).forEach((date) => {
    voiceMap[date].sort((a, b) => {
      try {
        return parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime();
      } catch (error) {
        return 0;
      }
    });
  });

  // 평균값 계산 함수
  const calculateAverage = (voices: VoiceData[], metricKey: string): number | null => {
    if (!voices || voices.length === 0) return null;
    
    const validValues = voices
      .map(voice => {
        const value = getNestedValue(voice.ah_features, metricKey);
        return typeof value === 'number' && !isNaN(value) ? value : null;
      })
      .filter(value => value !== null) as number[];
    
    if (validValues.length === 0) return null;
    
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  };

  // 중첩된 객체에서 값을 가져오는 헬퍼 함수
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  // RangeST 평균값 계산 함수
  const calculateRangeSTAverage = (voices: VoiceData[]): number | null => {
    if (!voices || voices.length === 0) return null;
    
    const validValues = voices
      .map(voice => {
        if (!voice.ah_features?.max_f0 || !voice.ah_features?.min_f0) return null;
        const maxF0 = voice.ah_features.max_f0;
        const minF0 = voice.ah_features.min_f0;
        if (maxF0 > 0 && minF0 > 0) {
          return 12 * Math.log2(maxF0 / minF0);
        }
        return null;
      })
      .filter(value => value !== null) as number[];
    
    if (validValues.length === 0) return null;
    
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  };

  // 지표 라벨을 ah_features 경로로 변환하는 함수
  const getMetricKey = (label: string): string | null => {
    const metricMap: Record<string, string> = {
      "Jitter Local": "jitter.local",
      "Jitter RAP": "jitter.rap",
      "Jitter PPQ5": "jitter.ppq5",
      "Jitter DDP": "jitter.ddp",
      "Shimmer Local": "shimmer.local",
      "Shimmer APQ3": "shimmer.apq3",
      "Shimmer APQ5": "shimmer.apq5",
      "Shimmer APQ11": "shimmer.apq11",
      "Shimmer DDA": "shimmer.dda",
      "HNR": "hnr",
      "NHR": "nhr",
      "F0": "f0",
      "Max F0": "max_f0",
      "Min F0": "min_f0"
    };
    
    return metricMap[label] || null;
  };

  const handlePlay = useCallback(async (recordId: number) => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    // 평균 데이터인 경우 재생 불가
    if (recordId === -1) {
      alert('평균 데이터는 재생할 수 없습니다.');
      return;
    }
    
    try {
      const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL;
      const response = await fetch(`${beApiUrl}/training/basic/download/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!response.ok) {
        throw new Error('음성 파일 다운로드 URL 조회에 실패했습니다.');
      }
      const data = await response.json();
      const downloadUrl = data.download_url;
      console.log(recordId, downloadUrl)
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      } else {
        alert('다운로드 URL을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('음성 재생 중 오류 발생:', error);
      alert('음성 재생 중 오류가 발생했습니다.');
    }
  }, [accessToken]);

  const metrics = useMemo(() => [
    {
      label: "음성파일 다운로드",
      getValue: (v: VoiceData | null) => {
        if (!v) return "-";
        return <button onClick={() => handlePlay(v.voice_id)} style={{ cursor: 'pointer' }}>▶️</button>;
      },
      getRawValue: null,
    },
    { label: "Jitter Local", getValue: (v: VoiceData | null) => v?.ah_features?.jitter.local?.toFixed(5) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.jitter.local },
    { label: "Jitter RAP", getValue: (v: VoiceData | null) => v?.ah_features?.jitter.rap?.toFixed(5) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.jitter.rap },
    { label: "Jitter PPQ5", getValue: (v: VoiceData | null) => v?.ah_features?.jitter.ppq5?.toFixed(5) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.jitter.ppq5 },
    { label: "Jitter DDP", getValue: (v: VoiceData | null) => v?.ah_features?.jitter.ddp?.toFixed(5) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.jitter.ddp },
    { label: "Shimmer Local", getValue: (v: VoiceData | null) => v?.ah_features?.shimmer.local?.toFixed(5) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.shimmer.local },
    { label: "Shimmer APQ3", getValue: (v: VoiceData | null) => v?.ah_features?.shimmer.apq3?.toFixed(5) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.shimmer.apq3 },
    { label: "Shimmer APQ5", getValue: (v: VoiceData | null) => v?.ah_features?.shimmer.apq5?.toFixed(5) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.shimmer.apq5 },
    { label: "Shimmer APQ11", getValue: (v: VoiceData | null) => v?.ah_features?.shimmer.apq11?.toFixed(5) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.shimmer.apq11 },
    { label: "Shimmer DDA", getValue: (v: VoiceData | null) => v?.ah_features?.shimmer.dda?.toFixed(5) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.shimmer.dda },
    { label: "HNR", getValue: (v: VoiceData | null) => v?.ah_features?.hnr?.toFixed(2) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.hnr },
    { label: "NHR", getValue: (v: VoiceData | null) => v?.ah_features?.nhr?.toFixed(5) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.nhr },
    { label: "F0", getValue: (v: VoiceData | null) => v?.ah_features?.f0?.toFixed(2) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.f0 },
    { label: "Max F0", getValue: (v: VoiceData | null) => v?.ah_features?.max_f0?.toFixed(2) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.max_f0 },
    { label: "Min F0", getValue: (v: VoiceData | null) => v?.ah_features?.min_f0?.toFixed(2) ?? "-", getRawValue: (v: VoiceData | null) => v?.ah_features?.min_f0 },
    { 
      label: "RangeST", 
      getValue: (v: VoiceData | null) => {
        if (!v?.ah_features?.max_f0 || !v?.ah_features?.min_f0) return "-";
        const rangeST = v.ah_features.max_f0 > 0 && v.ah_features.min_f0 > 0 
          ? 12 * Math.log2(v.ah_features.max_f0 / v.ah_features.min_f0)
          : 10;
        return rangeST.toFixed(2);
      }, 
      getRawValue: (v: VoiceData | null) => {
        if (!v?.ah_features?.max_f0 || !v?.ah_features?.min_f0) return null;
        return v.ah_features.max_f0 > 0 && v.ah_features.min_f0 > 0 
          ? 12 * Math.log2(v.ah_features.max_f0 / v.ah_features.min_f0)
          : 10;
      }
    },
  ], [router, handlePlay]);

  const handleMetricClick = (label: string) => {
    const metric = metrics.find(m => m.label === label);
    if (metric && metric.getRawValue) {
      setExpandedMetric(prev => (prev === label ? null : label));
    }
  };

  const chartData = useMemo(() => {
    if (!expandedMetric) return null;
    const metric = metrics.find(m => m.label === expandedMetric);
    if (!metric || !metric.getRawValue) return null;

    return {
      chartLabels: ahData.map(d => format(parseISO(d.created_at), 'yy/MM/dd')),
      chartValues: ahData.map(d => metric.getRawValue!(d)),
    };
  }, [expandedMetric, ahData, metrics]);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 0));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));

  return (
    <div>
      {allAhData.length > 0 ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "8px" }}>
            <button onClick={handlePrevPage} disabled={currentPage === 0} style={{...buttonStyle, ...(currentPage === 0 && disabledButtonStyle)}}>
              ← 이전
            </button>
            <div style={{ flex: 1, textAlign: "center", fontSize: "12px", color: "var(--gray-dark)" }}>
              {currentPage + 1} / {totalPages} 페이지
            </div>
            <button onClick={handleNextPage} disabled={currentPage >= totalPages - 1} style={{...buttonStyle, ...(currentPage >= totalPages - 1 && disabledButtonStyle)}}>
              다음 →
            </button>
          </div>
          <div className="table-container" style={{ overflowX: "auto", border: "1px solid var(--doctor-border)", borderRadius: "8px", marginBottom: "2rem", boxShadow: "0 4px 12px rgba(30, 58, 138, 0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>지표 / 날짜</th>
                  {uniqueDates.map((date) => (
                    <th key={date} style={thStyle} colSpan={voiceMap[date]?.length || 1}>
                      {format(parseISO(date), 'MM/dd')}
                      {selectedDates.includes(date) && (
                        <div style={{ fontSize: '10px', color: 'var(--doctor-accent)' }}>상세</div>
                      )}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th style={thStyle}>시간</th>
                  {uniqueDates.map((date) => 
                    selectedDates.includes(date) ? 
                      voiceMap[date]?.map((voice, index) => (
                        <th key={`${date}-${voice.voice_id}-${index}`} style={thStyle}>
                          {format(parseISO(voice.created_at), 'HH:mm')}
                        </th>
                      )) || <th key={`${date}-no-data`} style={thStyle}>-</th>
                    : 
                      <th key={`${date}-average`} style={thStyle}>평균값</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <React.Fragment key={metric.label}>
                    <tr>
                      <td 
                        style={{...tdStyle, ...(metric.getRawValue && {cursor: 'pointer', fontWeight: 'bold'})}}
                        onClick={() => handleMetricClick(metric.label)}
                      >
                        {metric.label} {metric.getRawValue && (expandedMetric === metric.label ? '▲' : '▼')}
                      </td>
                      {uniqueDates.map((date) => 
                        selectedDates.includes(date) ? 
                          voiceMap[date]?.map((voice, index) => (
                            <td key={`${date}-${voice.voice_id}-${index}`} style={tdStyle}>
                              {metric.getValue(voice)}
                            </td>
                          )) || <td key={`${date}-no-data`} style={tdStyle}>-</td>
                        : 
                          <td key={`${date}-average`} style={tdStyle}>
                            {(() => {
                              const voices = voiceMap[date] || [];
                              if (metric.label === "RangeST") {
                                const avg = calculateRangeSTAverage(voices);
                                return avg !== null ? avg.toFixed(2) : "-";
                              } else if (metric.label === "음성파일 다운로드") {
                                return "-";
                              } else {
                                // 다른 지표들의 평균값 계산
                                const metricKey = getMetricKey(metric.label);
                                if (metricKey) {
                                  const avg = calculateAverage(voices, metricKey);
                                  return avg !== null ? avg.toFixed(metric.label === "HNR" || metric.label === "F0" || metric.label === "Max F0" || metric.label === "Min F0" ? 2 : 5) : "-";
                                }
                                return "-";
                              }
                            })()}
                          </td>
                      )}
                    </tr>
                    {expandedMetric === metric.label && chartData && (
                      <tr>
                        <td colSpan={ahData.length + 1} style={{ padding: '16px' }}>
                          <MetricTrendChart 
                            metricLabel={expandedMetric}
                            chartLabels={chartData.chartLabels}
                            chartValues={chartData.chartValues}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          /아/ 발성 훈련 데이터가 없습니다.
        </div>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  border: "1px solid var(--doctor-border)",
  padding: "12px",
  backgroundColor: "var(--doctor-primary)",
  textAlign: "center",
  color: "white",
  whiteSpace: "nowrap",
  fontWeight: "600",
  fontSize: "0.9rem",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid var(--doctor-border)",
  padding: "10px",
  textAlign: "center",
  backgroundColor: "var(--doctor-card)",
  color: "var(--doctor-text)",
  fontSize: "0.9rem",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "var(--doctor-accent)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.3s ease",
};

const disabledButtonStyle: React.CSSProperties = {
  backgroundColor: "var(--doctor-secondary)",
  cursor: "not-allowed",
  opacity: 0.6,
};

export default PatientVoiceTrainingTable;