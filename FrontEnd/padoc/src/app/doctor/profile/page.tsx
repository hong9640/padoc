'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/store/userStore';
import useAuthStore from '@/store/authStore';
import MoveButton from '@/components/atoms/moveButton';
import Link from 'next/link';
import DoctorLayout from '@/components/templates/doctorLayout';

import styles from './doctorProfile.module.css';


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
  const { userData } = useUserStore();
  const { isAuthenticated, role, isInitialized } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // 인증 상태 확인 - 초기화 완료 후에만 실행
  useEffect(() => {
    if (!isInitialized) {
      return; // 아직 초기화되지 않았으면 대기
    }
    
    // 토큰이 없거나 의사가 아닌 경우 홈으로 리다이렉션
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

  // 초기화 중이거나 로딩 중이면 로딩 표시
  if (!isInitialized || isLoading) {
    return (
      <main>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingContent}>
            <h3 className={styles.loadingText}>로딩 중...</h3>
          </div>
        </div>
      </main>
    );
  }

  // 보기 쉬운 라벨 매핑과 표시 순서 선언
  const labelMap: Record<keyof UserData, string> = {
    login_id: '아이디',
    full_name: '이름',
    email: '이메일',
    phone_number: '전화번호',
    address: '주소',
    gender: '성별',
    age: '나이',
  };

  const fieldOrder: Array<keyof UserData> = [
    'full_name',
    'login_id',
    'gender',
    'email',
    'phone_number',
    'address',
    'age',
  ];

  // (선택) store 타입이 넓다면 단언으로 축소
  const profile = userData as UserData | null;

  return (
    <DoctorLayout>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {profile ? `${profile.full_name}님` : '사용자'}의 프로필
        </h1>
      </header>

      <div className={styles.patientDataSection}>
        <div className={styles.patientData}>
          <div className={styles.dataContent}>
            <div className={styles.sectionContainer}>
              <h2 className={styles.sectionTitle}>사용자 정보</h2>

              {profile ? (
                <div className={styles.profileInfo}>
                  {fieldOrder.map((field: keyof UserData) => (
                    <div key={field} className={styles.infoRow}>
                      <span className={styles.label}>{labelMap[field]}</span>
                      <span className={styles.value}>
                        {profile[field] !== null ? String(profile[field]) : '입력 정보 없음'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.errorMessage}>
                  <p>사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.</p>
                </div>
              )}

              {profile && (
                <div className={styles.actionButtons}>
                  <Link href="/profile/checkpassword">
                    <MoveButton value="회원 정보 수정" width="auto" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}