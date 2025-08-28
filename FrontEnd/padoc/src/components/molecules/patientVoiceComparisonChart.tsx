'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { VoiceData } from '@/store/patientTrainingInformationStore';
import RadarChart from '@/components/atoms/radarChart';

interface PatientVoiceComparisonChartProps {
  data: VoiceData[];
}

export default function PatientVoiceComparisonChart({ data }: PatientVoiceComparisonChartProps) {
  const voiceAhData = useMemo(() => data.filter(d => d.recording_type === 'voice_ah'), [data]);
  
  // 디버깅용 로그
  console.log('PatientVoiceComparisonChart - total data length:', data.length);
  console.log('PatientVoiceComparisonChart - voice_ah data length:', voiceAhData.length);

  const [selectedData1Index, setSelectedData1Index] = useState<number>(0);
  const [selectedData2Index, setSelectedData2Index] = useState<number>(-1);

  const canCompare = voiceAhData.length >= 2;

  const data1Options = useMemo(() => {
    return voiceAhData.map((item, index) => ({
      index,
      label: (() => {
        try {
          return format(parseISO(item.created_at), 'MM/dd HH:mm');
        } catch (error) {
          console.error('날짜 표시 오류:', item.created_at, error);
          return `데이터 ${index + 1}`;
        }
      })(),
      data: item
    }));
  }, [voiceAhData]);

  const data2Options = useMemo(() => {
    const options: { index: number; label: string; data: VoiceData | null }[] = [...data1Options];
    if (canCompare) {
      options.unshift({
        index: -1,
        label: '비교하지 않음',
        data: null
      });
    }
    return options;
  }, [data1Options, canCompare]);

  const handleData1Change = useCallback((index: number) => {
    setSelectedData1Index(index);
    if (index === selectedData2Index && canCompare && selectedData2Index >= 0) {
      setSelectedData2Index(-1);
    }
  }, [canCompare, selectedData2Index]);

  const handleData2Change = useCallback((index: number) => {
    setSelectedData2Index(index);
    if (index === selectedData1Index && canCompare && index >= 0) {
      const newIndexForData1 = voiceAhData.findIndex((_, i) => i !== index);
      if (newIndexForData1 !== -1) {
        setSelectedData1Index(newIndexForData1);
      }
    }
  }, [canCompare, selectedData1Index, voiceAhData]);

  if (voiceAhData.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--doctor-text-light)', fontSize: '1.1rem', fontStyle: 'italic' }}>
        비교할 'voice_ah' 녹음 데이터가 없습니다.
      </div>
    );
  }

  const selectedData1 = voiceAhData[selectedData1Index];
  const selectedData2 = canCompare && selectedData2Index >= 0 ? voiceAhData[selectedData2Index] : undefined;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* 데이터 선택 컨트롤 */}
      <div className="mb-6 p-4" style={{ backgroundColor: 'var(--doctor-card)', borderRadius: '12px', border: '1px solid var(--doctor-border)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--doctor-primary)' }}>비교 데이터 선택</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 첫 번째 데이터 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--doctor-text)' }}>
              첫 번째 데이터 (파란색)
            </label>
            <select
              value={selectedData1Index}
              onChange={(e) => handleData1Change(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--doctor-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--doctor-card)',
                color: 'var(--doctor-text)',
                fontSize: '14px'
              }}
            >
              {data1Options.map((option) => (
                <option key={option.index} value={option.index}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 두 번째 데이터 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--doctor-text)' }}>
              두 번째 데이터 (빨간색) {!canCompare && '(비교 불가)'}
            </label>
            <select
              value={selectedData2Index}
              onChange={(e) => handleData2Change(Number(e.target.value))}
              disabled={!canCompare}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--doctor-border)',
                borderRadius: '8px',
                backgroundColor: !canCompare ? 'var(--doctor-bg)' : 'var(--doctor-card)',
                color: 'var(--doctor-text)',
                fontSize: '14px',
                opacity: !canCompare ? 0.6 : 1,
                cursor: !canCompare ? 'not-allowed' : 'pointer'
              }}
            >
              {data2Options.map((option) => (
                <option key={option.index} value={option.index}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 선택된 데이터 정보 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--accent-weak)', border: '1px solid var(--doctor-accent)' }}>
            <span className="font-medium" style={{ color: 'var(--doctor-primary)' }}>첫 번째 데이터:</span>
            <br />
            {(() => {
              try {
                return format(parseISO(selectedData1.created_at), 'yyyy년 MM월 dd일 HH:mm');
              } catch (error) {
                return '날짜 정보 없음';
              }
            })()}
            <br />
          </div>
          
          {canCompare && selectedData2Index >= 0 && selectedData2 && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--danger-light)', border: '1px solid var(--doctor-danger)' }}>
              <span className="font-medium" style={{ color: 'var(--doctor-danger)' }}>두 번째 데이터:</span>
              <br />
              {(() => {
                try {
                  return format(parseISO(selectedData2.created_at), 'yyyy년 MM월 dd일 HH:mm');
                } catch (error) {
                  return '날짜 정보 없음';
                }
              })()}
              <br />
            </div>
          )}

          {canCompare && selectedData2Index === -1 && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--doctor-bg)', border: '1px solid var(--doctor-border)' }}>
              <span className="font-medium" style={{ color: 'var(--doctor-text)' }}>두 번째 데이터:</span>
              <br />
              비교하지 않음
            </div>
          )}
        </div>
      </div>

      {/* 비교 설명 */}
      {canCompare && selectedData2Index >= 0 && selectedData2 && (
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--accent-weak)', border: '1px solid var(--doctor-accent)' }}>
          <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--doctor-primary)' }}>비교 설명</h4>
          <div className="text-sm" style={{ color: 'var(--doctor-text)' }}>
            <p>• <strong>파란색</strong>: 첫 번째 선택된 데이터</p>
            <p>• <strong>빨간색</strong>: 두 번째 선택된 데이터</p>
            <p>• 차트에서 두 데이터의 차이점을 시각적으로 비교할 수 있습니다.</p>
          </div>
        </div>
      )}

      {canCompare && selectedData2Index === -1 && (
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--green-light)', border: '1px solid var(--doctor-success)' }}>
          <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--doctor-success)' }}>단일 데이터 표시</h4>
          <div className="text-sm" style={{ color: 'var(--doctor-text)' }}>
            <p>• <strong>파란색</strong>: 선택된 데이터</p>
            <p>• <strong>연두색 영역</strong>: 정상 범위</p>
            <p>• 정상 범위와 비교하여 현재 상태를 확인할 수 있습니다.</p>
          </div>
        </div>
      )}

      {!canCompare && (
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--orange-light)', border: '1px solid var(--doctor-warning)' }}>
          <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--doctor-warning)' }}>참고</h4>
          <div className="text-sm" style={{ color: 'var(--doctor-text)' }}>
            <p>• 데이터가 2개 이상일 때 비교 기능을 사용할 수 있습니다.</p>
            <p>• 현재는 첫 번째 데이터만 표시됩니다.</p>
          </div>
        </div>
      )}

      {/* 차트 렌더링 */}
      <div className="flex justify-center mt-6">
        <div className="w-full" style={{ padding: '1rem', backgroundColor: 'var(--doctor-card)', borderRadius: '12px', border: '1px solid var(--doctor-border)' }}>
          <RadarChart 
            data1={selectedData1} 
            data2={canCompare ? selectedData2 : undefined}
            width="100%"
            height="550px"
          />
        </div>
      </div>
    </div>
  );
}
