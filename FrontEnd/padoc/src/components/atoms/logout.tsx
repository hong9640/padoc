'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/store/userStore';
import useAuthStore from '@/store/authStore';
import useSelectedPatientStore from '@/store/selectedPatientStore';
import usePatientTrainingStore from '@/store/patientTrainingInformationStore';
import { useTestStore } from '@/store/testStore';
import { useTrainStore } from '@/store/trainStore';
import MoveButton from './moveButton';

interface LogoutButtonProps {
  compact?: boolean;
}

export default function LogoutButton({ compact = false }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const clearUser = useUserStore((state) => state.clearUser);
  const { clearAuth } = useAuthStore();
  const clearSelectedPatient = useSelectedPatientStore((state) => state.clearSelectedPatient);
  const resetPatientTraining = usePatientTrainingStore((state) => state.reset);
  const resetTest = useTestStore((state) => state.reset);
  const resetTrain = useTrainStore((state) => state.reset);

  const handleLogout = async () => {
    // 사용자에게 로그아웃 확인 메시지 표시
    const isConfirmed = window.confirm('정말 로그아웃 하시겠습니까?');
    
    if (!isConfirmed) {
      return;
    }

    setIsLoggingOut(true);
    
    try {
      // 1. 모든 store들을 초기값으로 리셋
      clearUser();
      clearAuth();
      clearSelectedPatient();
      resetPatientTraining();
      resetTest();
      resetTrain();

      // 2. localStorage에서 persist된 데이터 제거
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selected-patient-storage');
        localStorage.removeItem('patient-training-storage');
        localStorage.removeItem('test-storage');
        localStorage.removeItem('train-storage');
        localStorage.removeItem('user-storage');
        localStorage.removeItem('auth-storage');
      }

      // 3. 홈페이지로 리디렉션 (토큰 만료 파라미터 없이)
      router.push('/?logout=true');
      
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      alert('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <MoveButton 
      onClick={handleLogout} 
      value={isLoggingOut ? '로그아웃 중...' : '로그아웃'} 
      backgroundColor='red' 
      disabled={isLoggingOut}
      width={compact ? '80px' : '100px'}
      fontSize={compact ? '12px' : '1rem'}
      height={compact ? '32px' : 'auto'}
    />
  );
}