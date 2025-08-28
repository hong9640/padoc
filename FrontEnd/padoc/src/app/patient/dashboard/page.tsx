'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientLayout from '@/components/templates/patientLayout';

import useUserStore from '@/store/userStore';
import useAuthStore from '@/store/authStore';
import { authenticatedGet } from '@/utils/api';
import CalendarPage from '@/components/molecules/calenderMolecule';
import PatientGraphMolecule from '@/components/molecules/patientGraphMolecule';

import styles from './patientDashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const { userData, setUser } = useUserStore();
  const { accessToken, role, isAuthenticated, isInitialized } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // 인증 상태 확인 - 초기화 완료 후에만 실행
  useEffect(() => {
    if (!isInitialized) {
      return; // 아직 초기화되지 않았으면 대기
    }

    // 토큰이 없거나 환자가 아닌 경우 홈으로 리다이렉션
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (role !== 'patient') {
      router.push('/');
      return;
    }
    
    setIsLoading(false);
  }, [isAuthenticated, role, router, isInitialized]);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated || !isInitialized) {
        return;
      }
      
      if (!userData) {
        try {
          const { data, error } = await authenticatedGet('/users/profile');
          if (error) {
            router.push('/');
            return;
          }
          setUser(data);
        } catch (error) {
          router.push('/');
        }
      }
    };

    if (isAuthenticated && isInitialized && !isLoading) {
      fetchUserProfile();
    }
  }, [isAuthenticated, isInitialized, userData, setUser, isLoading, router]);

  // 초기화 중이거나 로딩 중이면 로딩 표시
  if (!isInitialized || isLoading) {
    return (
      <PatientLayout>
        <main className={styles.page}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingContent}>
              <h3 className={styles.loadingText}>로딩 중...</h3>
            </div>
          </div>
        </main>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <main className={styles.page}>
        {/* 환자 데이터 섹션 */}
        <div className={styles.patientDataSection}>
          <div className={styles.patientData}>
            <h2 className={styles.patientTitle}>
              훈련 데이터
            </h2>
            
            <div className={styles.dataContent}>
              {/* 캘린더 섹션 */}
              <div className={styles.sectionContainer}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.sectionTitle}>훈련 캘린더</h3>
                  <div className={styles.legend} aria-label="범례">
                    <span className={`${styles.legendItem} ${styles.legendTrained}`}>훈련</span>
                    <span className={`${styles.legendItem} ${styles.legendReserved}`}>예약</span>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <CalendarPage />
                </div>
              </div>

              {/* 그래프 섹션 */}
              <div className={styles.sectionContainer}>
              <div className={styles.cardHeader}>
                <h3 className={styles.sectionTitle}>훈련 추이</h3>
                </div>
                <div className={styles.cardBody}>
                  <PatientGraphMolecule />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PatientLayout>
  );
}