// src/app/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import LoginComponent from '@/components/organisms/loginComponent';
import MoveButton from '@/components/atoms/moveButton';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { useSearchParams } from 'next/navigation';

function HomeContent() {
  const { isAuthenticated, role, isInitialized } = useAuthStore();
  const searchParams = useSearchParams();

  // URL 파라미터에서 로그아웃 파라미터 확인
  useEffect(() => {
    const logout = searchParams.get('logout');
    
    if (logout === 'true') {
      // 로그아웃으로 인한 이동이므로 URL 파라미터만 제거
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const getDashboardUrl = () => {
    if (!role) {
      return '/';
    }
    if (role === 'doctor') {
      return '/doctor/dashboard';
    } else if (role === 'patient') {
      return '/patient/dashboard';
    }
    return '/'; // 기본값
  };

  return (
    <main
      style={{
        boxSizing: 'border-box',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
      }}
    >
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: 'var(--ink)',
          margin: '0 0 0.5rem 0',
          textAlign: 'center',
        }}
      >
        Pakinson Doctor, PaDoc
      </h1>
      <h2
        style={{
          fontSize: '1.25rem',
          color: 'var(--sub)',
          margin: '0 0 2rem 0',
          textAlign: 'center',
        }}
      >
        파킨슨병 진단 권유 및 음성 트레이닝 서비스, 파닥입니다.
      </h2>
      
      <Link href="/test" style={{ textDecoration: 'none', width: '100%', maxWidth: '35rem' }}>
        <MoveButton
          value="파킨슨 테스트"
          width="100%"
          height="7vh"
          fontSize="2rem"
          backgroundColor="var(--primary)"
          color="var(--background)"
          borderRadius="0.75rem"
          margin="1rem 0 0 0"
        />
      </Link>

      <div style={{ width: '100%', maxWidth: '35rem', marginBottom: '2rem' }}>
        {!isInitialized ? (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              fontSize: '1.5rem',
              color: 'var(--ink)',
              marginTop: '5rem',
            }}>
              로딩 중...
            </h3>
          </div>
        ) : isAuthenticated ? (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              fontSize: '1.5rem',
              color: 'var(--ink)',
              marginTop: '5rem',
            }}>
              이미 로그인되어 있습니다
            </h3>
            <MoveButton
              url={getDashboardUrl()}
              value={'대시보드로 이동'}
              width="20rem"
              height="4rem"
              fontSize="1.5rem"
              backgroundColor="var(--primary)"
              color="var(--background)"
              borderRadius="0.75rem"
              margin="1rem 0 0 0"
            />
          </div>
        ) : (
          <LoginComponent />
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main
        style={{
          boxSizing: 'border-box',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--ink)',
            margin: '0 0 0.5rem 0',
            textAlign: 'center',
          }}
        >
          Pakinson Doctor, PaDoc
        </h1>
        <h2
          style={{
            fontSize: '1.25rem',
            color: 'var(--sub)',
            margin: '0 0 2rem 0',
            textAlign: 'center',
          }}
        >
          파킨슨병 진단 권유 및 음성 트레이닝 서비스, 파닥입니다.
        </h2>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{
            fontSize: '1.5rem',
            color: 'var(--ink)',
            marginTop: '5rem',
          }}>
            로딩 중...
          </h3>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
