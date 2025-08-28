'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: 'doctor' | 'patient';
  fallback?: ReactNode;
}

export default function AuthGuard({ 
  children, 
  requiredRole, 
  fallback = <div>로딩 중...</div> 
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, role, isInitialized } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      return; // 아직 초기화되지 않았으면 대기
    }

    // 인증되지 않은 경우
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    // 특정 역할이 필요한 경우
    if (requiredRole && role !== requiredRole) {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, [isAuthenticated, role, requiredRole, router, isInitialized]);

  // 초기화 중이거나 권한 확인 중이면 fallback 표시
  if (!isInitialized || !isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
