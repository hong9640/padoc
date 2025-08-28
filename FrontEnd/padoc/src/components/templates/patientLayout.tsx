// components/templates/patientLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import useUserStore from '@/store/userStore';
import styles from './patientLayout.module.css';

// 윈도우 너비를 감지하는 커스텀 훅
function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1025);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowWidth;
}

interface PatientLayoutProps {
  children: React.ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  const pathname = usePathname();
  const windowWidth = useWindowWidth();
  const { userData } = useUserStore();

  // 화면 너비가 1024px 이하인지 확인
  const isMobileView = windowWidth <= 1024;

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>
            {userData?.full_name || '환자'} 님, 환영합니다.
          </h1>
        </div>
      </header>

      {/* 네비게이션 - 모바일에서는 헤더 바로 밑에 가로 배치 */}
      <nav className={`${styles.navigation} ${isMobileView ? styles.navigationMobile : styles.navigationDesktop}`}>
        <div className={styles.navContainer}>
          <Link
            href="/patient/dashboard"
            className={`${styles.navItem} ${pathname === '/patient/dashboard' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>📊</span>
            <span className={styles.navText}>대시보드</span>
          </Link>
          <Link
            href="/patient/profile"
            className={`${styles.navItem} ${pathname === '/patient/profile' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>👤</span>
            <span className={styles.navText}>개인정보</span>
          </Link>
        </div>
      </nav>

      {/* 메인 콘텐츠 영역 */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
