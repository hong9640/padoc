"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { VoiceData } from "@/store/patientTrainingInformationStore";
import usePatientTrainingStore from "@/store/patientTrainingInformationStore";
import MetricTrendChart from "./MetricTrendChart";

interface PatientSentenceTrainingTableProps {
  data: VoiceData[];
  onSelectRow: (rowData: VoiceData) => void;
  resetExpandedMetric?: boolean;
}

const PatientSentenceTrainingTable = ({ 
  data, 
  onSelectRow, 
  resetExpandedMetric
}: PatientSentenceTrainingTableProps) => {
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

  const allSentenceData = useMemo(() => data
    .filter(d => d.sentence_features !== null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [data]);

  const totalItems = allSentenceData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  useEffect(() => {
    const newTotalPages = Math.ceil(allSentenceData.length / pageSize);
    setCurrentPage(newTotalPages > 0 ? newTotalPages - 1 : 0);
  }, [allSentenceData.length, pageSize]);

  const sentenceData = useMemo(() => {
    if (totalItems === 0) return [];
    let firstPageSize = totalItems % pageSize;
    if (firstPageSize === 0 && totalItems > 0) firstPageSize = pageSize;

    if (currentPage === 0) {
      return allSentenceData.slice(0, firstPageSize);
    } else {
      const startIndex = firstPageSize + (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return allSentenceData.slice(startIndex, endIndex);
    }
  }, [allSentenceData, currentPage, pageSize, totalItems]);

  const uniqueDates = Array.from(
    new Set(sentenceData.map((d) => format(new Date(d.created_at), "yyyy-MM-dd")))
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const voiceMap: Record<string, VoiceData[]> = {};
  sentenceData.forEach((voice) => {
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

  const handlePlay = useCallback(async (recordId: number) => {
      if (!accessToken) {
        alert('로그인이 필요합니다.');
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
      label: "그래프",
      getValue: (v: VoiceData | null) => {
        if (!v) return "-";
        return <button onClick={() => onSelectRow(v)} style={{ cursor: 'pointer' }}>📈</button>;
      },
      getRawValue: null,
    },
    {
      label: "음성파일 다운로드",
      getValue: (v: VoiceData | null) => {
        if (!v) return "-";
        return <button onClick={() => handlePlay(v.voice_id)} style={{ cursor: 'pointer' }}>▶️</button>;
      },
      getRawValue: null,
    },
    { label: "CPP", getValue: (v: VoiceData | null) => v?.sentence_features?.cpp?.toFixed(2) ?? "-", getRawValue: (v: VoiceData | null) => v?.sentence_features?.cpp },
    { label: "CSID", getValue: (v: VoiceData | null) => v?.sentence_features?.csid?.toFixed(2) ?? "-", getRawValue: (v: VoiceData | null) => v?.sentence_features?.csid },
  ], [router, onSelectRow, handlePlay]);

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
      chartLabels: sentenceData.map(d => format(parseISO(d.created_at), 'yy/MM/dd')),
      chartValues: sentenceData.map(d => metric.getRawValue!(d)),
    };
  }, [expandedMetric, sentenceData, metrics]);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 0));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));

  return (
    <div>
      {allSentenceData.length > 0 ? (
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
                  <th style={thStyle}>날짜</th>
                  {uniqueDates.map((date) => (
                    <th key={date} style={thStyle} colSpan={voiceMap[date]?.length || 1}>
                      {format(parseISO(date), 'MM/dd')}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th style={thStyle}>시간</th>
                  {uniqueDates.map((date) => 
                    voiceMap[date]?.map((voice, index) => (
                      <th key={`${date}-${voice.voice_id}-${index}`} style={thStyle}>
                        {format(parseISO(voice.created_at), 'HH:mm')}
                      </th>
                    )) || <th key={`${date}-no-data`} style={thStyle}>-</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <React.Fragment key={metric.label}>
                    <tr>
                      <td 
                        style={{...tdStyle, ...(metric.getRawValue && {cursor: 'pointer', fontWeight: 'bold', color: 'var(--doctor-primary)'})}}
                        onClick={() => handleMetricClick(metric.label)}
                      >
                        {metric.label} {metric.getRawValue && (expandedMetric === metric.label ? '▲' : '▼')}
                      </td>
                      {uniqueDates.map((date) => 
                        voiceMap[date]?.map((voice, index) => (
                          <td key={`${date}-${voice.voice_id}-${index}-${metric.label}`} style={tdStyle}>
                            {metric.getValue(voice)}
                          </td>
                        )) || <td key={`${date}-no-data-${metric.label}`} style={tdStyle}>-</td>
                      )}
                    </tr>
                    {expandedMetric === metric.label && chartData && (
                      <tr>
                        <td colSpan={sentenceData.length + 1} style={{ padding: '20px', backgroundColor: 'var(--doctor-bg)' }}>
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
        <div className="text-center py-8" style={{ color: 'var(--doctor-text-light)', fontSize: '1.1rem', fontStyle: 'italic' }}>
          문장 훈련 데이터가 없습니다.
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

export default PatientSentenceTrainingTable;
