// app/doctor/dashboard/page.tsx
// 이 컴포넌트는 의사 대시보드 페이지를 렌더링합니다.
'use client';

import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/store/userStore';
import useAuthStore from '@/store/authStore';
import { authenticatedGet } from '@/utils/api';
import PatientVoiceTrainingTable from '@/components/molecules/patientVoiceTrainingTable';
import PatientSentenceTrainingTable from '@/components/molecules/patientSentenceTrainingTable';
import SentenceDataChart from '@/components/molecules/SentenceDataChart';
import RadarChart from '@/components/atoms/radarChart';
import usePatientTrainingStore, { VoiceData } from '@/store/patientTrainingInformationStore';
import useSelectedPatientStore from '@/store/selectedPatientStore';
import DoctorLayout from '@/components/templates/doctorLayout';
import styles from './doctorDashboard.module.css';
import { useWindowWidth } from '@/hooks/useWindowWidth';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { userData, setUser } = useUserStore();
  const { voiceData, loading, error, reset, fetchedNoDataForPatient, fetchVoiceData } = usePatientTrainingStore();
  const { selectedPatient, setSelectedPatient, clearSelectedPatient } = useSelectedPatientStore();
  const { accessToken, role, isAuthenticated, isInitialized } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSentenceDataForChart, setSelectedSentenceDataForChart] = useState<VoiceData | null>(null);
  const windowWidth = useWindowWidth();
  // 사이드바 상태 추적을 위한 ref
  const prevSidebarStates = useRef<{ isLeftSidebarOpen: boolean; isRightSidebarOpen: boolean } | null>(null);

  useEffect(() => {
    if (windowWidth && windowWidth < 1024) {
      const confirm = window.confirm('화면 크기가 1024px 이하입니다. 화면이 정상적으로 보이지 않을 수 있습니다. 계속 하시겠습니까?');
      if (!confirm) {
        router.push('/');
      }
    }
  }, [windowWidth, router]);

  // 인증 상태 확인 - 초기화 완료 후에만 실행
  useEffect(() => {
    if (!isInitialized) {
      return; // 아직 초기화되지 않았으면 대기
    }

    // 인증되지 않았거나 의사가 아닌 경우 홈으로 리다이렉션
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (role !== 'doctor') {
      router.push('/');
      return;
    }

    setIsLoading(false);
  }, [isAuthenticated, role, router, isInitialized]);

  useEffect(() => {
    if (selectedPatient && isAuthenticated && accessToken) {
      fetchVoiceData(selectedPatient.account_id, accessToken);
    }
  }, [selectedPatient, isAuthenticated, accessToken, fetchVoiceData]);

  const handleSelectPatient = useCallback((id: number | null, name: string) => {
    if (id !== null) {
      setSelectedPatient({ account_id: id, full_name: name });
    } else {
      clearSelectedPatient();
      reset();
    }
    setSelectedSentenceDataForChart(null);
  }, [setSelectedPatient, clearSelectedPatient, reset]);

  const handleSelectSentenceRowForChart = useCallback((rowData: VoiceData) => {
    setSelectedSentenceDataForChart(rowData);
  }, []);

  // 테이블 토글 상태 초기화를 위한 상태
  const [resetTableToggles, setResetTableToggles] = useState(false);
  const currentSidebarStatesRef = useRef<{ isLeftSidebarOpen: boolean; isRightSidebarOpen: boolean } | null>(null);

  // 사이드바 토글 시 테이블 토글 상태 초기화
  const handleSidebarToggle = useCallback(() => {
    setSelectedSentenceDataForChart(null);
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
        setSelectedSentenceDataForChart(null);
        setResetTableToggles(true);
        setTimeout(() => setResetTableToggles(false), 0);
      }
    }
    if (currentSidebarStatesRef.current) {
      prevSidebarStates.current = currentSidebarStatesRef.current;
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !isInitialized) {
        return;
      }
      if (!userData) {
        try {
          const { data, error } = await authenticatedGet('/users/profile');
          if (error) {
            return;
          }
          setUser(data);
        } catch (error) {
          // 에러 처리
        }
      }
    };
    fetchProfile();
  }, [isAuthenticated, isInitialized, userData, setUser]);

  const latestAhData = useMemo(() => {
    const ahData = voiceData
      .filter(d => d.recording_type === 'voice_ah')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      latestAh: ahData.length > 0 ? ahData[0] : null,
      secondLatestAh: ahData.length > 1 ? ahData[1] : null,
    };
  }, [voiceData]);

  const sentenceData = useMemo(() => voiceData.filter(d => d.recording_type === 'voice_sentence'), [voiceData]);

  const renderPatientData = (isLeftSidebarOpen: boolean, isRightSidebarOpen: boolean) => {
    if (!selectedPatient) return null;

    if (fetchedNoDataForPatient[selectedPatient.account_id]) {
      return (
        <div className={styles.noDataMessage}>
          <p>훈련 정보가 없습니다.</p>
        </div>
      );
    }

    if (voiceData.length === 0) {
      return (
        <div className={styles.noDataMessage}>
          <p>훈련 정보가 없습니다.</p>
        </div>
      );
    }

    // 사이드바가 둘 다 접혀있을 때 가로 배치를 위한 클래스
    const isBothSidebarsClosed = !isLeftSidebarOpen && !isRightSidebarOpen;
    const mptSectionClass = isBothSidebarsClosed ? `${styles.mptSection} ${styles.mptSectionHorizontal}` : styles.mptSection;

    return (
      <div className={styles.dataContent}>
        {/* MPT 데이터와 차트를 나란히 배치하는 섹션 */}
        <div className={mptSectionClass}>
          {/* AH 발성 데이터 섹션 */}
          <div className={styles.sectionContainer}>
            <h3 className={styles.sectionTitle}>MPT 훈련 데이터</h3>
            <div className={styles.tableContainer}>
              <PatientVoiceTrainingTable data={voiceData} resetExpandedMetric={resetTableToggles} />
            </div>
          </div>

          {/* AH 발성 차트 섹션 */}
          {latestAhData.latestAh ? (
            <div className={styles.sectionContainer}>
              <h3 className={styles.sectionTitle}>MPT 분석 차트</h3>
              <div className={styles.chartSection}>
                <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--green-light)', border: '1px solid var(--doctor-success)' }}>
                  <div className="text-sm" style={{ color: 'var(--doctor-text)' }}>
                    <p>• 상세한 범위 지정은 데이터 탭에서 가능합니다.</p>
                    <p>• <strong>파란색</strong>: {latestAhData.latestAh.created_at}</p>
                    {latestAhData.secondLatestAh ? (
                      <p>• <strong>빨간색</strong>: {latestAhData.secondLatestAh.created_at}</p>
                    ) : (
                      <div>
                        <p>• <strong>연두색 영역</strong>: 정상 범위</p>
                        <p>• 정상 범위와 비교하여 현재 상태를 확인할 수 있습니다.</p>
                      </div>
                    )}

                  </div>
                </div>

                <div className={styles.chartContainer}>
                  <RadarChart
                    data1={latestAhData.latestAh}
                    data2={latestAhData.secondLatestAh || undefined}
                    width="100%"
                    height="550px"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noChartMessage}>
              <p>최근의 MPT 훈련 데이터가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 문장 발성 데이터 섹션 */}
        {sentenceData.length > 0 && (
          <div className={isBothSidebarsClosed ? `${styles.sentenceSection} ${styles.sentenceSectionHorizontal}` : styles.sentenceSection}>
            {/* 문장 발성 데이터 테이블 */}
            <div className={styles.sectionContainer}>
              <h3 className={styles.sectionTitle}>문장 발성 훈련 데이터</h3>
              <div className={styles.tableContainer}>
                <PatientSentenceTrainingTable
                  data={voiceData}
                  onSelectRow={handleSelectSentenceRowForChart}
                  resetExpandedMetric={resetTableToggles}
                />
              </div>
            </div>

            {/* 문장 발성 차트 섹션 */}
            <div className={styles.sectionContainer}>
              <h3 className={styles.sectionTitle}>문장 발성 분석 차트</h3>
              <SentenceDataChart data={selectedSentenceDataForChart} allData={voiceData} />
            </div>
          </div>
        )}
      </div>
    );
  };

  // 초기화 중이거나 로딩 중이면 로딩 표시
  if (!isInitialized || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <h3 className={styles.loadingText}>로딩 중...</h3>
        </div>
      </div>
    );
  }

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
          {/* 환자 데이터 섹션 */}
          <div className={styles.patientDataSection}>
            {selectedPatient ? (
              <div className={styles.patientData}>
                <h2 className={styles.patientTitle}>
                  {selectedPatient.full_name}님의 훈련 데이터
                </h2>

                {loading && (
                  <div className={styles.loadingMessage}>
                    <p>데이터를 불러오는 중...</p>
                  </div>
                )}

                {error && (
                  <div className={styles.errorMessage}>
                    <p>{error}</p>
                  </div>
                )}

                {!loading && !error && renderPatientData(isLeftSidebarOpen, isRightSidebarOpen)}
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