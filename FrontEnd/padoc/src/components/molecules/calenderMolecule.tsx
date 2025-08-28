'use client';

import { useState, useEffect, useCallback } from 'react';
import MyCalendar from '../atoms/calendar';
import { format, getMonth, getYear } from 'date-fns';
import { useTrainStore } from '@/store/trainStore';
import useAuthStore from '@/store/authStore';
import { authenticatedGet, authenticatedPost, authenticatedDelete } from '@/utils/api';
import styles from './calenderMolecule.module.css';

interface Reservation {
  schedule_id: number;
  date: Date;
}
interface TrainedDataResponse {
  trainings: { avg_score: number; progress: string; date: string }[];
}
interface ReservedDataResponse {
  appointment_dates: { schedule_id: number; date: string }[];
}

const getDateRangeArray = (start: string, end: string): string[] => {
  const result: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    result.push(format(new Date(current), 'yyyy-MM-dd'));
    current.setDate(current.getDate() + 1);
  }
  return result;
};

export default function CalendarMolecule() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reservedDates, setReservedDates] = useState<Reservation[]>([]);
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, role: userRole, isAuthenticated } = useAuthStore();





  const fetchReservedDates = useCallback(async () => {
    const { data, error } = await authenticatedGet('/users/schedules');
    if (error) throw new Error('예약 목록을 불러오는 데 실패했습니다.');

    const responseData: ReservedDataResponse = data;
    setReservedDates(
      (responseData.appointment_dates || []).map((item) => ({
        schedule_id: item.schedule_id,
        date: new Date(item.date + 'T00:00:00'),
      }))
    );
  }, []);

  const fetchTrainingsByRange = useCallback(async (start: string, end: string) => {
    if (!isAuthenticated) return;

    const existingDates = useTrainStore.getState().trainings.map((t) =>
      format(new Date(t.date), 'yyyy-MM-dd')
    );
    const neededDates = getDateRangeArray(start, end).filter((date) => !existingDates.includes(date));

    if (neededDates.length === 0) return;

    const { data, error } = await authenticatedGet(`/dashboard/patient?start_date=${start}&end_date=${end}`);
    if (error) {
      console.error('훈련 데이터 fetch 실패:', error);
      throw new Error('훈련 날짜를 불러오는 데 실패했습니다.');
    }

    const responseData: TrainedDataResponse = data;
    useTrainStore.getState().addTrainings(responseData.trainings || []);
  }, [isAuthenticated]);

  const handleRangeChange = useCallback((start: string, end: string) => {
    setRangeStart(start);
    setRangeEnd(end);

    const updatedTrainings = useTrainStore.getState().trainings;
    const available = updatedTrainings
      .map((t) => format(new Date(t.date), 'yyyy-MM-dd'))
      .filter((date) => date >= start && date <= end);

    setSelectedDates(available);
  }, []);


  useEffect(() => {
    const today = new Date();
    const baseDate = new Date(today.getFullYear(), today.getMonth(), 1); // 이번달 1일 기준
    const start = format(new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1), 'yyyy-MM-dd');
    const end = format(new Date(baseDate.getFullYear(), baseDate.getMonth() + 2, 0), 'yyyy-MM-dd'); // 다음다음달 마지막 날

    const run = async () => {
      await fetchTrainingsByRange(start, end); // ❗ 범위 확장된 요청
      const updatedTrainings = useTrainStore.getState().trainings;
      const allDates = updatedTrainings.map((t) => format(new Date(t.date), 'yyyy-MM-dd'));
      setSelectedDates(allDates); // 최초에는 전체 선택
      setRangeStart(start);
      setRangeEnd(end);
    };
    run();
  }, [fetchTrainingsByRange]);

  // 예약 정보는 한 번만 불러옴
  useEffect(() => {
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    const fetchInitial = async () => {
      try {
        setLoading(true);
        await fetchReservedDates();
      } catch (err: any) {
        setError(err.message || '데이터 로딩 중 오류 발생');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [fetchReservedDates, isAuthenticated]);

  const handleMonthChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
    }
  };

  const toggleReserve = async (date: Date) => {
    if (!isAuthenticated) {
      setError('예약을 변경하려면 로그인이 필요합니다.');
      return;
    }

    const reservation = reservedDates.find((r) => r.date.getTime() === date.getTime());

    try {
      if (reservation) {
        const { data, error, status } = await authenticatedDelete(`/users/schedules/${reservation.schedule_id}`);
        if (error) {
          throw new Error(`예약 취소에 실패했습니다: ${error}`);
        }
        setReservedDates((prev) => prev.filter((r) => r.schedule_id !== reservation.schedule_id));
      } else {
        const dateString = format(date, 'yyyy-MM-dd');
        const { data, error, status } = await authenticatedPost('/users/schedules', { date: dateString });
        if (error) {
          throw new Error(`예약에 실패했습니다: ${error}`);
        }
        setReservedDates((prev) => [...prev, { schedule_id: data.schedule_id, date: date }]);
      }
    } catch (err: any) {
      setError(err.message || '예약 처리 중 오류가 발생했습니다.');
    }
  };

  const trainedCountInMonth = useTrainStore.getState().trainings
    .map((t) => new Date(t.date))
    .filter(
      (d) => getYear(d) === getYear(new Date()) && getMonth(d) === getMonth(new Date())
    ).length;

  const reservedInMonth = reservedDates
    .filter((r) => getYear(r.date) === getYear(new Date()) && getMonth(r.date) === getMonth(new Date()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (loading) return <div>캘린더 데이터를 불러오는 중입니다...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <div className="p-2 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full overflow-hidden">
      <div className="lg:col-span-2 w-full overflow-hidden">
        <MyCalendar
          trainedDates={selectedDates.map((d) => new Date(d))}
          reservedDates={reservedDates.map((r) => r.date)}
          onToggleReserve={toggleReserve}
          activeStartDate={new Date()}
          onActiveStartDateChange={handleMonthChange}
        />
      </div>
      <div className="space-y-4 w-full">
        <div className="p-3 md:p-4 rounded-lg shadow" style={{
          backgroundColor: 'var(--card)',
          color: 'var(--text)'
        }}>
          <h3 className="font-bold text-base md:text-lg mb-2" style={{ color: 'var(--text)' }}>이번 달 훈련 횟수</h3>
          <p className="text-lg md:text-xl" style={{ color: 'var(--text)' }}>{trainedCountInMonth}회</p>
        </div>
        {userRole === 'patient' && (
          <div className="p-3 md:p-4 rounded-lg shadow" style={{
            backgroundColor: 'var(--card)',
            color: 'var(--text)'
          }}>
            <h3 className="font-bold text-base md:text-lg mb-2" style={{ color: 'var(--text)' }}>이번 달 방문 예약</h3>
            {reservedInMonth.length > 0 ? (
              <ul className="space-y-2">
                {reservedInMonth.map((r) => (
                  <li key={r.schedule_id} className="text-xs md:text-sm" style={{ color: 'var(--text)' }}>
                    {format(r.date, 'M월 d일 (eee)')}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs md:text-sm" style={{ color: 'var(--text-light)' }}>예정된 방문이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
