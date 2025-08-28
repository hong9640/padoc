import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VoiceAhState {
  jitter: {
    local: number;
    rap: number;
    ppq5: number;
    ddp: number;
  };
  shimmer: {
    local: number;
    apq3: number;
    apq5: number;
    apq11: number;
    dda: number;
  };
  hnr: number;
  nhr: number;
  f0: number;
  max_f0: number;
  min_f0: number;
}

interface VoiceSentenceState {
  ai_score: number
}

interface TestState {
  answers: { [key: string]: string };
  voice_ah: VoiceAhState;
  voice_sentence: VoiceSentenceState;
  testMessages: string[];
  normalRange: {
    jitter: {
      local: number;
      rap: number;
      ppq5: number;
      ddp: number;
    };
    shimmer: {
      local: number;
      apq3: number;
      apq5: number;
      apq11: number;
      dda: number;
    };
    hnr: number,
    nhr: number,
    f0: number,
    max_f0: number,
    min_f0: number,
    rangeST: number, // rangeST 정상 범위 값 추가
  },
  exceedNormalCount: number,
  rangeST: number,
  setAnswer: (questionId: string, value: string) => void;
  setVoiceAh: (value: VoiceAhState) => void;
  setVoiceSentence: (value: VoiceSentenceState) => void;
  setTestMessage: (messages: string[]) => void;
  setExceedNormalCount: (count: number) => void;
  setRangeST: (st: number) => void;
  reset: () => void;
}

const initialState = {
  answers: {},
  testMessages: [],
  voice_ah: {
    jitter: {
      local: 0,
      rap: 0,
      ppq5: 0,
      ddp: 0,
    },
    shimmer: {
      local: 0,
      apq3: 0,
      apq5: 0,
      apq11: 0,
      dda: 0,
    },
    hnr: 0,
    nhr: 0,
    f0: 0,
    max_f0: 0,
    min_f0: 0
  },
  normalRange: {
    jitter: {
      local: 0.005,
      rap: 0.002,
      ppq5: 0.002,
      ddp: 0.006,
    },
    shimmer: {
      local: 0.025,
      apq3: 0.01,
      apq5: 0.02,
      apq11: 0.03,
      dda: 0.04,
    },
    hnr: 20,
    nhr: 0.02,
    f0: 200,
    max_f0: 250,
    min_f0: 100,
    rangeST: 4, // rangeST 정상 범위 값 추가
  },
  voice_sentence: {
    ai_score: 0,
  },
  exceedNormalCount: 0,
  rangeST: 10,
};

export const useTestStore = create<TestState>()(
  persist(
    (set) => ({
      ...initialState,
      setAnswer: (questionId, value) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: value,
          },
        })),
      setVoiceAh: (value) =>
        set((state) => {
          const rangeST = value.max_f0 > 0 && value.min_f0 > 0 
            ? 12 * Math.log2(value.max_f0 / value.min_f0)
            : 10;
          
          let exceedNormalCount = 0;
          
          // jitter.local과 shimmer.local만 체크
          if (value.jitter.local > state.normalRange.jitter.local) exceedNormalCount++;
          if (value.shimmer.local > state.normalRange.shimmer.local) exceedNormalCount++;
          
          // 단일 값들 체크
          if (value.hnr > state.normalRange.hnr) exceedNormalCount++;
          if (value.nhr > state.normalRange.nhr) exceedNormalCount++;
          if (value.f0 > state.normalRange.f0) exceedNormalCount++;
          if (value.max_f0 > state.normalRange.max_f0) exceedNormalCount++;
          if (value.min_f0 > state.normalRange.min_f0) exceedNormalCount++;
          
          // rangeST 체크 (작으면 증가)
          if (rangeST < state.normalRange.rangeST) exceedNormalCount++;
          
          return { voice_ah: value, exceedNormalCount, rangeST };
        }),
      setVoiceSentence: (value) => set({ voice_sentence: value }),
      setTestMessage: (messages) => set({ testMessages: messages }),
      setExceedNormalCount: (count) => set({ exceedNormalCount: count }),
      setRangeST: (st) => set({ rangeST: st }),
      reset: () => set(initialState),
    }),
    {
      name: 'test-storage',
      // normalRange는 기본값이므로 persist하지 않음
      partialize: (state) => ({
        answers: state.answers,
        voice_ah: state.voice_ah,
        voice_sentence: state.voice_sentence,
        testMessages: state.testMessages,
        exceedNormalCount: state.exceedNormalCount,
        rangeST: state.rangeST,
      }),
    }
  )
);
