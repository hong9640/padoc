'use client';

import { useState, useCallback } from 'react';
import DateRangeSelector from '@/components/atoms/dateRangeSelector';
import DateSelector from '@/components/atoms/dateSelector';
import usePatientTrainingStore from '@/store/patientTrainingInformationStore';

interface PatientDataFilterProps {
  availableDates: string[];
  selectedDateRange: { start: string; end: string } | null;
  selectedDates: string[];
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onDateSelection: (dates: string[]) => void;
  onResetFilters: () => void;
  title?: string;
}

export default function PatientDataFilter({
  availableDates,
  selectedDateRange,
  selectedDates,
  onDateRangeChange,
  onDateSelection,
  onResetFilters,
  title = "데이터 필터"
}: PatientDataFilterProps) {
  const [showDateRangeSelector, setShowDateRangeSelector] = useState(false);
  const setSelectedDates = usePatientTrainingStore(state => state.setSelectedDates);

  // 날짜 선택 핸들러 - store와 부모 컴포넌트 모두에 전달
  const handleDateSelection = useCallback((dates: string[]) => {
    console.log('patientDataFilter handleDateSelection called with:', dates); // 디버깅용 로그
    setSelectedDates(dates); // store에 선택된 날짜 설정
    onDateSelection(dates); // 부모 컴포넌트에도 전달
  }, [setSelectedDates, onDateSelection]);

  return (
    <div className="mb-6 p-4 rounded-lg" style={{
      backgroundColor: 'var(--doctor-card)',
      color: 'var(--doctor-text)',
      border: '1px solid var(--doctor-border)',
      borderRadius: '12px'
    }}>
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--doctor-primary)' }}>{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDateRangeSelector(!showDateRangeSelector)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--doctor-accent)',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--doctor-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--doctor-accent)';
            }}
          >
            {showDateRangeSelector ? '날짜 범위 숨기기' : '날짜 범위 선택'}
          </button>
          <button
            onClick={onResetFilters}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--doctor-secondary)',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--doctor-text-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--doctor-secondary)';
            }}
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* 날짜 범위 선택기 */}
      {showDateRangeSelector && (
        <div className="mb-4" style={{
          padding: '16px',
          backgroundColor: 'var(--doctor-card)',
          borderRadius: '8px',
        }}>
          <DateRangeSelector
            onChange={onDateRangeChange}
          />
        </div>
      )}

      {/* 개별 날짜 선택기 */}
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--doctor-card)',
        borderRadius: '8px',
      }}>
        <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--doctor-text)' }}>개별 날짜 선택:</h4>
        <DateSelector
          availableDates={availableDates}
          selectedDates={selectedDates}
          onChange={handleDateSelection}
        />
      </div>

      {/* 현재 필터 상태 표시 */}
      <div className="mt-4" style={{
        padding: '12px 16px',
        backgroundColor: 'var(--accent-weak)',
        borderRadius: '8px',
        border: '1px solid var(--doctor-accent)'
      }}>
        {selectedDateRange && (
          <p style={{ color: 'var(--doctor-text)', margin: '4px 0', fontSize: '14px' }}>
            선택된 날짜 범위: {selectedDateRange.start} ~ {selectedDateRange.end}
          </p>
        )}
        {selectedDates.length > 0 && (
          <p style={{ color: 'var(--doctor-text)', margin: '4px 0', fontSize: '14px' }}>
            선택된 날짜: {selectedDates.join(', ')}
          </p>
        )}
        {!selectedDateRange && selectedDates.length === 0 && (
          <p style={{ color: 'var(--doctor-text-light)', margin: '4px 0', fontSize: '14px', fontStyle: 'italic' }}>
            필터가 적용되지 않았습니다. 모든 데이터가 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
