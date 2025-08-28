import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 사용자 데이터 타입
interface UserData {
  login_id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  gender: string | null;
  age: number | null;
}

// 상태 타입
interface UserState {
  userData: UserData | null;
  setUser: (user: UserData) => void;
  clearUser: () => void;
}

// 실제 스토어 생성
const useUserStore = create<UserState>()(
  persist<UserState, [], []>(
    (set) => ({
      userData: null,
      setUser: (user) => {
        set({ userData: user });
      },
      clearUser: () => {
        set({ userData: null });
      },
    }),
    {
      name: 'user-storage',
    }
  )
);


export default useUserStore;
