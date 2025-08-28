import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Training {
  avg_score: number;
  progress: string;
  date: string;
}

interface TrainStore {
  trainings: Training[];
  setTrainings: (data: Training[]) => void;
  addTrainings: (data: Training[]) => void;
  reset: () => void; // reset 함수 추가
}

export const useTrainStore = create<TrainStore>()(
  persist(
    (set, get) => ({
      trainings: [],
      setTrainings: (data) => set({ trainings: data }),
      addTrainings: (newData) => {
        const existing = get().trainings;
        const combined = [...existing, ...newData];


        // 중복 제거 (날짜와 점수 기준)
        const seen = new Set();
        const deduplicated = combined.filter(item => {
          const key = `${item.date}-${item.avg_score}-${item.progress}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
        
        set({ trainings: deduplicated });
      },
      reset: () => set({ trainings: [] }), // reset 함수 구현
    }),
    {
      name: 'train-storage',
    }
  )
);
