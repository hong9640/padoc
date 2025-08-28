'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import PatientGameGraph from '@/components/atoms/patientGameGraph';
import DateSelector from '@/components/atoms/dateSelector';
import Container from '../atoms/container';
import { useTrainStore } from '@/store/trainStore';
import { format } from 'date-fns';
import DateRangeSelector from '../atoms/dateRangeSelector';
import useAuthStore from '@/store/authStore';

export default function PatientGraphMolecule() {
  const trainings = useTrainStore((state) => state.trainings);
  const setTrainings = useTrainStore((state) => state.setTrainings);
  const resetTrainings = useTrainStore((state) => state.reset);
  const { accessToken: authToken, accountId } = useAuthStore();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // localStorage에서 토큰 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      setAccessToken(token);
    }
  }, []);

  // 사용자 변경 시 훈련 데이터 초기화
  useEffect(() => {
    if (accountId) {
      resetTrainings();
      setSelectedDates([]);
    }
  }, [accountId, resetTrainings]);

  // 날짜 내림차순 정렬
  const sorted = useMemo(() => {
    return [...trainings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trainings]);

  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL;

  const handleRangeChange = useCallback(
    async (start: string, end: string) => {
      if (!accessToken) return;

      try {
        const response = await fetch(`${beApiUrl}/dashboard/patient?start_date=${start}&end_date=${end}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          console.error('훈련 데이터 fetch 실패:', response.status, await response.text());
          throw new Error('훈련 날짜를 불러오는 데 실패했습니다.');
        }

        const data = await response.json();
        const newTrainings = data.trainings || [];
        
        // 기존 데이터와 새 데이터를 합치되, 중복 제거
        const existingTrainings = trainings;
        const combinedTrainings = [...existingTrainings];
        
        newTrainings.forEach((newTraining: any) => {
          const exists = existingTrainings.some(existing => 
            format(new Date(existing.date), 'yyyy-MM-dd') === format(new Date(newTraining.date), 'yyyy-MM-dd')
          );
          if (!exists) {
            combinedTrainings.push(newTraining);
          }
        });
        
        setTrainings(combinedTrainings);

        // 새로 불러온 데이터의 모든 날짜를 선택
        const allDates = newTrainings.map((t: any) => format(new Date(t.date), 'yyyy-MM-dd'));
        setSelectedDates(allDates);
      } catch (error) {
        console.error(error);
        // 에러 발생 시에도 기존 데이터는 유지
      }
    },
    [beApiUrl, setTrainings, accessToken, trainings]
  );

  // 최초 로딩 시 기본 범위로 데이터 로드
  useEffect(() => {
    if (accessToken && trainings.length === 0 && accountId) {
      const today = new Date();
      const startDate = format(new Date(today.getFullYear(), today.getMonth() - 1, 1), 'yyyy-MM-dd');
      const endDate = format(today, 'yyyy-MM-dd');
      handleRangeChange(startDate, endDate);
    }
  }, [accessToken, trainings.length, handleRangeChange, accountId]);

  // 데이터가 있을 때 최신 7개만 선택
  useEffect(() => {
    if (sorted.length > 0 && selectedDates.length === 0) {
      const initial = sorted.slice(0, 7).map((t) => format(new Date(t.date), 'yyyy-MM-dd'));
      setSelectedDates(initial);
    }
  }, [sorted, selectedDates.length]);

  const filteredData = useMemo(() => {
    return trainings
      .filter((t) => selectedDates.includes(format(new Date(t.date), 'yyyy-MM-dd')))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedDates, trainings]);

  const reverseSorted = useMemo(() => {
    return [...trainings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trainings]);

  // 실제 훈련 데이터가 있는 날짜만 추출
  const availableDates = useMemo(() => {
    const dates = reverseSorted.map((d) => format(new Date(d.date), 'yyyy-MM-dd'));
    return [...new Set(dates)]; // 중복 제거
  }, [reverseSorted]);

  return (
    <Container className="flex flex-col items-center w-full overflow-hidden">
      <DateRangeSelector
        minDate="2025-06-01"
        maxDate={format(new Date(), 'yyyy-MM-dd')}
        onChange={handleRangeChange}
      />
      <DateSelector
        availableDates={availableDates}
        selectedDates={selectedDates}
        onChange={setSelectedDates}
      />
      <div
        className="flex flex-col items-center w-full"
        style={{ 
          width: '100%', 
          maxWidth: '100%', 
          height: '250px',
          minHeight: '200px'
        }}
      >
        {filteredData.length > 0 ? (
          <PatientGameGraph data={filteredData} />
        ) : (
          <p className="text-gray-500 text-xs md:text-sm">선택된 날짜에 훈련 데이터가 없습니다.</p>
        )}
      </div>
    </Container>
  );
}
