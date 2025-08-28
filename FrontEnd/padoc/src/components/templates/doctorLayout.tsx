// components/templates/doctorLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import DoctorSidebar from '@/components/molecules/doctorSidebar';
import useUserStore from '@/store/userStore';
import styles from './doctorLayout.module.css';

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

interface DoctorLayoutProps {
  children: React.ReactNode | ((sidebarStates: { isLeftSidebarOpen: boolean; isRightSidebarOpen: boolean }) => React.ReactNode);
  onSelectPatient?: (id: number | null, name: string) => void;
  onSidebarToggle?: () => void;
}

export default function DoctorLayout({ children, onSelectPatient, onSidebarToggle }: DoctorLayoutProps) {
  const pathname = usePathname();
  const windowWidth = useWindowWidth();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const { userData } = useUserStore();

  // 현재 페이지가 doctor/profile인지 확인
  const isProfilePage = pathname === '/doctor/profile';
  
  // 화면 너비가 1024px 이하인지 확인
  const isMobileView = windowWidth <= 1024;

  // localStorage에서 사이드바 상태 복원
  useEffect(() => {
    const savedLeftState = localStorage.getItem('doctorLeftSidebarOpen');
    const savedRightState = localStorage.getItem('doctorRightSidebarOpen');
    
    if (savedLeftState !== null) {
      setIsLeftSidebarOpen(JSON.parse(savedLeftState));
    }
    if (savedRightState !== null) {
      setIsRightSidebarOpen(JSON.parse(savedRightState));
    }
  }, []);

  // 화면 너비나 페이지 변경 시 사이드바 상태 자동 조정
  useEffect(() => {
    // 화면 너비가 1024px 이하면 왼쪽 사이드바 숨김
    if (isMobileView && isLeftSidebarOpen) {
      setIsLeftSidebarOpen(false);
      localStorage.setItem('doctorLeftSidebarOpen', 'false');
    }
    
    // profile 페이지면 오른쪽 사이드바 숨김
    if (isProfilePage && isRightSidebarOpen) {
      setIsRightSidebarOpen(false);
      localStorage.setItem('doctorRightSidebarOpen', 'false');
    }
  }, [isMobileView, isProfilePage, isLeftSidebarOpen, isRightSidebarOpen]);

  // 사이드바 상태 변경 시 localStorage에 저장
  const handleLeftSidebarToggle = () => {
    const newState = !isLeftSidebarOpen;
    setIsLeftSidebarOpen(newState);
    localStorage.setItem('doctorLeftSidebarOpen', JSON.stringify(newState));
    // 사이드바 토글 시 콜백 호출
    if (onSidebarToggle) {
      onSidebarToggle();
    }
  };

  const handleRightSidebarToggle = () => {
    const newState = !isRightSidebarOpen;
    setIsRightSidebarOpen(newState);
    localStorage.setItem('doctorRightSidebarOpen', JSON.stringify(newState));
    // 사이드바 토글 시 콜백 호출
    if (onSidebarToggle) {
      onSidebarToggle();
    }
  };

  const handleSelectPatient = (id: number | null, name: string) => {
    if (onSelectPatient) {
      onSelectPatient(id, name);
    }
  };

  // 실제 표시할 사이드바 상태 계산
  const shouldShowLeftSidebar = isLeftSidebarOpen && !isMobileView;
  const shouldShowRightSidebar = isRightSidebarOpen && !isProfilePage;

  return (
    <div className={styles.page}>
      {/* 좌측 사이드바 */}
      <div className={`${styles.sidebar} ${shouldShowLeftSidebar ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userData?.full_name || '의사'} 님, 환영합니다.</span>
          </div>
          {!isMobileView && (
            <button 
              className={styles.toggleButton}
              onClick={handleLeftSidebarToggle}
              title={isLeftSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
            >
              {isLeftSidebarOpen ? "◀" : "▶"}
            </button>
          )}
        </div>
        <nav className={styles.navigation}>
          <Link
            href="/doctor/dashboard"
            className={`${styles.navItem} ${pathname === '/doctor/dashboard' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>📊</span>
            <span>대시보드</span>
          </Link>
          <Link
            href="/doctor/datatable/ah"
            className={`${styles.navItem} ${pathname === '/doctor/datatable/ah' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>🎵</span>
            <span>최대발성지속시간(MPT)</span>
          </Link>
          <Link
            href="/doctor/datatable/sentence"
            className={`${styles.navItem} ${pathname === '/doctor/datatable/sentence' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>📝</span>
            <span>문장 발성</span>
          </Link>
          <Link
            href="/doctor/profile"
            className={`${styles.navItem} ${pathname === '/doctor/profile' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>👤</span>
            <span>개인정보</span>
          </Link>
        </nav>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className={`${styles.mainContent} ${!shouldShowLeftSidebar ? styles.mainContentExpanded : ''} ${!shouldShowRightSidebar ? styles.mainContentRightClosed : ''}`}>
        {typeof children === 'function' 
          ? children({ isLeftSidebarOpen: shouldShowLeftSidebar, isRightSidebarOpen: shouldShowRightSidebar })
          : children
        }
      </div>

      {/* 우측 환자 선택 사이드바 */}
      {!isProfilePage && (
        <div className={`${styles.patientSelectionSection} ${shouldShowRightSidebar ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <div className={styles.sidebarHeader}>
            <button 
              className={styles.toggleButton}
              onClick={handleRightSidebarToggle}
              title={isRightSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
            >
              {isRightSidebarOpen ? "▶" : "◀"}
            </button>
          </div>
          <DoctorSidebar onSelectPatient={handleSelectPatient} isSidebarOpen={shouldShowRightSidebar} />
        </div>
      )}
    </div>
  );
}
