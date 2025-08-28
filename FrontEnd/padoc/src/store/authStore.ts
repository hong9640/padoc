import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useTrainStore } from './trainStore';

interface AuthState {
  accessToken: string | null;
  role: string | null;
  accountId: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // 초기화 상태 추가
  setAuth: (token: string, role: string, accountId: string) => void;
  clearAuth: () => void;
  getAuthHeaders: () => Record<string, string>;
  checkAuth: () => boolean;
  setInitialized: () => void; // 초기화 완료 표시
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      role: null,
      accountId: null,
      isAuthenticated: false,
      isInitialized: false,

      setAuth: (token: string, role: string, accountId: string) => {
        // 기존 사용자와 다른 사용자인지 확인
        const currentAccountId = get().accountId;
        if (currentAccountId && currentAccountId !== accountId) {
          // 다른 사용자가 로그인하는 경우 훈련 데이터 초기화
          useTrainStore.getState().reset();
        }
        
        // localStorage에도 저장 (기존 코드와의 호환성)
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
          localStorage.setItem('role', role);
          localStorage.setItem('account_id', accountId);
        }
        
        set({
          accessToken: token,
          role,
          accountId,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        // localStorage에서도 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('role');
          localStorage.removeItem('account_id');
        }
        
        // 훈련 데이터도 초기화
        useTrainStore.getState().reset();
        
        set({
          accessToken: null,
          role: null,
          accountId: null,
          isAuthenticated: false,
        });
      },

      getAuthHeaders: () => {
        const { accessToken } = get();
        return {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        };
      },

      checkAuth: () => {
        const { accessToken, role } = get();
        return !!(accessToken && role);
      },

      setInitialized: () => {
        set({ isInitialized: true });
      },
    }),
    {
      name: 'auth-storage',
      // 민감한 정보는 localStorage에만 저장하고 zustand persist에서는 제외
      partialize: (state) => ({
        accessToken: state.accessToken,
        role: state.role,
        accountId: state.accountId,
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
      }),
      onRehydrateStorage: () => (state) => {
        // persist 로딩 완료 후 초기화 상태 설정
        if (state) {
          state.setInitialized();
        }
      },
    }
  )
);

export default useAuthStore;
