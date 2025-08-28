// app/doctor/datatable/sentence/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import useUserStore from '@/store/userStore';

import SubmitButton from '@/components/atoms/submitButton';
import PatientSentenceTrainingTable from '@/components/molecules/patientSentenceTrainingTable';
import PatientDataFilter from '@/components/molecules/patientDataFilter';
import SentenceDataChart from '@/components/molecules/SentenceDataChart';
import DoctorLayout from '@/components/templates/doctorLayout';

import usePatientTrainingStore, { VoiceData } from '@/store/patientTrainingInformationStore';
import useSelectedPatientStore from '@/store/selectedPatientStore';
import styles from './doctorSentenceDatatable.module.css';

const doctorTabs = [
  { label: '대시보드', path: '/doctor/dashboard' },
  { label: '최대발성지속시간(MPT)', path: '/doctor/datatable/ah' },
  { label: '문장 발성', path: '/doctor/datatable/sentence' },
  { label: '개인정보', path: '/doctor/profile' },
];

export default function DoctorSentenceDatatablePage() {
  const router = useRouter();
  const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL!;
  const { userData, setUser } = useUserStore();
  const { voiceData, loading, error, reset, fetchedNoDataForPatient, fetchVoiceData, getAvailableDates } = usePatientTrainingStore();
  const { selectedPatient, setSelectedPatient, clearSelectedPatient } = useSelectedPatientStore();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // 사이드바 상태 추적을 위한 ref
  const prevSidebarStates = useRef<{ isLeftSidebarOpen: boolean; isRightSidebarOpen: boolean } | null>(null);
  
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedDataForChart, setSelectedDataForChart] = useState<VoiceData | null>(null);

  // 테이블 토글 상태 초기화를 위한 상태
  const [resetTableToggles, setResetTableToggles] = useState(false);
  const currentSidebarStatesRef = useRef<{ isLeftSidebarOpen: boolean; isRightSidebarOpen: boolean } | null>(null);

  // 사이드바 토글 시 테이블 토글 상태 초기화
  const handleSidebarToggle = useCallback(() => {
    setSelectedDataForChart(null);
    setResetTableToggles(true);
    // 다음 렌더링에서 resetTableToggles를 false로 되돌림
    setTimeout(() => setResetTableToggles(false), 0);
  }, []);

  // 사이드바 상태 변경 감지 및 토글 초기화
  useEffect(() => {
    if (currentSidebarStatesRef.current && prevSidebarStates.current) {
      const { isLeftSidebarOpen: prevLeft, isRightSidebarOpen: prevRight } = prevSidebarStates.current;
      const { isLeftSidebarOpen: currentLeft, isRightSidebarOpen: currentRight } = currentSidebarStatesRef.current;
      
      // 사이드바 상태가 변경되었으면 토글 상태 초기화
      if (prevLeft !== currentLeft || prevRight !== currentRight) {
        setSelectedDataForChart(null);
        setResetTableToggles(true);
        setTimeout(() => setResetTableToggles(false), 0);
      }
    }
    if (currentSidebarStatesRef.current) {
      prevSidebarStates.current = currentSidebarStatesRef.current;
    }
  });

  // localStorage에서 토큰 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('role');

      setAccessToken(token);

      // 토큰이 없거나 의사가 아닌 경우 홈으로 리다이렉션
      if (!token) {
        console.log('토큰이 없음 - 홈으로 리다이렉션');
        router.push('/');
        return;
      }

      if (role !== 'doctor') {
        console.log('의사가 아님 - 홈으로 리다이렉션');
        router.push('/');
        return;
      }
    }
  }, []); // router 의존성 제거

  useEffect(() => {
    if (selectedPatient && accessToken) {
      fetchVoiceData(selectedPatient.account_id, accessToken, selectedDateRange?.start, selectedDateRange?.end);
    }
  }, [selectedPatient, selectedDateRange, accessToken]); // fetchVoiceData 의존성 제거

  const sentenceData = useMemo(() => voiceData.filter(d => d.recording_type === 'voice_sentence'), [voiceData]);

  const sortedData = useMemo(() => {
    return sentenceData
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sentenceData]);

  const availableDates = useMemo(() => {
    const dates = sentenceData.map(item => {
      try {
        return item.created_at.split('T')[0]; // YYYY-MM-DD 형식으로 날짜 추출
      } catch (error) {
        console.error('날짜 파싱 오류:', item.created_at, error);
        return null;
      }
    }).filter(Boolean) as string[];
    const result = [...new Set(dates)].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return result;
  }, [sentenceData]);

  const filteredDataByDates = useMemo(() => {
    if (selectedDates.length === 0) return sortedData;
    return sortedData.filter(item => {
      try {
        const itemDate = format(parseISO(item.created_at), 'yyyy-MM-dd');
        return selectedDates.includes(itemDate);
      } catch (error) {
        return false;
      }
    });
  }, [sortedData, selectedDates]);

  const displayData = selectedDates.length > 0 ? filteredDataByDates : sortedData;

  const handleDateRangeChange = useCallback((startDate: string, endDate: string) => {
    setSelectedDateRange({ start: startDate, end: endDate });
    setSelectedDates([]);
  }, []);

  const handleDateSelection = useCallback((dates: string[]) => {
    setSelectedDates(dates);
    setSelectedDateRange(null);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedDateRange(null);
    setSelectedDates([]);
  }, []);

  const handleSelectPatient = useCallback((id: number | null, name: string) => {
    if (id !== null) {
      setSelectedPatient({ account_id: id, full_name: name });
    } else {
      clearSelectedPatient();
      reset();
    }
    setSelectedDataForChart(null);
  }, [clearSelectedPatient, reset, setSelectedPatient]);

  const handleSelectRowForChart = useCallback((rowData: VoiceData) => {
    setSelectedDataForChart(rowData);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) {
        return; // accessToken이 없으면 프로필 fetch를 건너뛰고 리다이렉션하지 않음
      }
      if (!userData) {
        const res = await fetch(`${beApiUrl}/users/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) setUser(await res.json());
      }
    };
    fetchProfile();
  }, [beApiUrl, setUser, userData, accessToken]); // router 의존성 제거

  const handleRequestConnection = async () => {
    await router.push('/doctor/connection');
  };

  return (
    <DoctorLayout onSelectPatient={handleSelectPatient} onSidebarToggle={handleSidebarToggle}>
      {({ isLeftSidebarOpen, isRightSidebarOpen }) => {
        // 사이드바 상태를 ref로 설정 (useEffect에서 처리)
        currentSidebarStatesRef.current = { isLeftSidebarOpen, isRightSidebarOpen };
        
        return (
          <>
            <header className={styles.header}>
              <h1 className={styles.title}>
                {userData?.full_name ?? '의사'}님, 안녕하세요!
              </h1>
            </header>
            <div className={styles.patientDataSection}>
              {selectedPatient ? (
                <div className={styles.patientData}>
                  <h2 className={styles.patientTitle}>
                    {selectedPatient.full_name}님의 문장 발성 훈련 데이터
                  </h2>

                  {loading && (
                    <div className={styles.loadingMessage}>
                      <p>로딩 중…</p>
                    </div>
                  )}

                  {error && (
                    <div className={styles.errorMessage}>
                      <p>{error}</p>
                    </div>
                  )}

                  {!loading && !error && (
                    fetchedNoDataForPatient[selectedPatient.account_id] || sentenceData.length === 0 ? (
                      <div className={styles.noDataMessage}>
                        <p>훈련 정보가 없습니다.</p>
                      </div>
                    ) : (
                      <div className={styles.dataContent}>
                        <div className={styles.sectionContainer}>
                          <PatientDataFilter
                            availableDates={availableDates}
                            selectedDateRange={selectedDateRange}
                            selectedDates={selectedDates}
                            onDateRangeChange={handleDateRangeChange}
                            onDateSelection={handleDateSelection}
                            onResetFilters={resetFilters}
                            title="문장 발성 데이터 필터"
                          />
                        </div>

                        <div className={styles.sectionContainer}>
                          <h3 className={styles.sectionTitle}>훈련 데이터 테이블</h3>
                          <div className={styles.tableContainer}>
                            <PatientSentenceTrainingTable data={displayData} onSelectRow={handleSelectRowForChart} resetExpandedMetric={resetTableToggles} />
                          </div>
                        </div>

                        <div className={styles.sectionContainer}>
                          <h3 className={styles.sectionTitle}>분석 차트</h3>
                          <div className={styles.chartSection}>
                            <div className={styles.chartContainer}>
                              <SentenceDataChart data={selectedDataForChart} allData={sentenceData} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className={styles.selectPatientMessage}>
                  <p>환자를 선택해주세요.</p>
                </div>
              )}
            </div>
            </>
          );
        }}
    </DoctorLayout>
  );
}
