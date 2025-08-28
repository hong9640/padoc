'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientLayout from '@/components/templates/patientLayout';

import useUserStore from '@/store/userStore';
import useAuthStore from '@/store/authStore';
import { authenticatedGet } from '@/utils/api';
import MoveButton from '@/components/atoms/moveButton';
import Link from 'next/link';

import styles from './patientProfile.module.css';
import DoctorConnectionManager from '@/components/organisms/connectedDoctorList';

// userData 객체의 타입 정의 (userStore와 일관성 유지)
interface UserData {
  login_id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  gender: string | null;
  age: number | null;
  // [key: string]: any; // 그 외 다른 속성들도 포함할 수 있도록
}

export default function ProfilePage() {
  const router = useRouter();
  const { userData, setUser } = useUserStore();
  const { isAuthenticated, role, isInitialized } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // 인증 상태 확인 - 초기화 완료 후에만 실행
  useEffect(() => {
    if (!isInitialized) {
      return; // 아직 초기화되지 않았으면 대기
    }
    
    // 토큰이 없거나 환자가 아닌 경우 홈으로 리다이렉션
    if (!isAuthenticated) {
      console.log('인증되지 않음 - 홈으로 리다이렉션');
      router.push('/');
      return;
    }
    
    if (role !== 'patient') {
      console.log('환자가 아님 - 홈으로 리다이렉션');
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
          console.error('사용자 정보 가져오기 실패:', error);
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

  // 보기 쉬운 레이블 매핑 (UX 가독성 향상)
  const labelMap: Record<string, string> = {
    login_id: '아이디',
    full_name: '이름',
    email: '이메일',
    phone_number: '전화번호',
    address: '주소',
    gender: '성별',
    age: '나이',
  };

  // 표시 순서 고정
  const fieldOrder: Array<keyof UserData> = [
    'full_name',
    'login_id',
    'gender',
    'email',
    'phone_number',
    'address',
    'age',
  ];

  return (
    <PatientLayout>
      <main className={styles.page}>
        {/* 환자 데이터 섹션 */}
        <div className={styles.patientDataSection}>
          <div className={styles.patientData}>
            <div className={styles.dataContent}>
              {/* 사용자 정보 섹션 */}
              <div className={styles.sectionContainer}>
                <h2 className={styles.sectionTitle}>사용자 정보</h2>
                {userData ? (
                  <div className={styles.profileInfo}>
                    {fieldOrder.map((field) => {
                      const value = userData[field];
                      const label = labelMap[field] || field;
                      return (
                        <div key={field} className={styles.infoRow}>
                          <span className={styles.label}>{label}</span>
                          <span className={styles.value}>
                            {value !== null ? String(value) : '입력 정보 없음'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.errorMessage}>
                    <p>사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.</p>
                  </div>
                )}
                
                {userData && (
                  <div className={styles.actionButtons}>
                    <Link href="/profile/checkpassword">
                      <MoveButton value="회원 정보 수정" width="auto" />
                    </Link>
                  </div>
                )}
              </div>

              {/* 의사 연결 관리 섹션 */}
              <div className={styles.sectionContainer}>
                <DoctorConnectionManager />
              </div>
            </div>
          </div>
        </div>
      </main>
    </PatientLayout>
  );
}