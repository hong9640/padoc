// store/patientTrainingInformationStore.ts
// 환자의 훈련 데이터(음성)를 관리하는 store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useAuthStore from '@/store/authStore';
import { authenticatedGet } from '@/utils/api';

// 음성 훈련 데이터 타입
export interface VoiceData {
  voice_id: number;
  patient_id: number;
  related_voice_info_id: number | null;
  file_path: string;
  recording_type: string;
  ah_features: {
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
  } | null;
  sentence_features: {
    cpp: number;
    csid: number;
    sampling_data: {
      sampling_rate: number;
      data_points: {
        energy: number;
        frequency: number;
      };
    };
  } | null;
  created_at: string;
  rangeST?: number; // rangeST 필드 추가
}

interface PatientTrainingStore {
  voiceData: VoiceData[];
  originalVoiceData: VoiceData[]; // 원본 데이터 저장
  loading: boolean;
  error: string | null;
  fetchedNoDataForPatient: { [patientId: number]: boolean };
  selectedDates: string[]; // 선택된 날짜 배열 추가
  fetchVoiceData: (patientId: number, accessToken: string, startDate?: string, endDate?: string) => Promise<void>;
  setSelectedDates: (dates: string[]) => void; // 선택된 날짜 설정 함수 추가
  getAvailableDates: () => string[]; // 사용 가능한 날짜 목록 반환 함수 추가
  reset: () => void;
}

// 날짜별로 데이터를 필터링하는 함수 (선택된 날짜에 따라 처리)
const filterDataByDate = (data: VoiceData[], selectedDates: string[] = []): VoiceData[] => {

  const dateGroups: { [date: string]: { ah: VoiceData[], sentence: VoiceData[] } } = {};
  
  // 날짜별로 데이터 그룹화
  data.forEach(item => {
    const date = item.created_at.split('T')[0]; // YYYY-MM-DD 형식으로 날짜 추출
    
    if (!dateGroups[date]) {
      dateGroups[date] = { ah: [], sentence: [] };
    }
    
    // recording_type에 따라 분류
    if (item.recording_type === 'voice_ah' && item.ah_features) {
      dateGroups[date].ah.push(item);
    } else if (item.recording_type === 'voice_sentence' && item.sentence_features) {
      dateGroups[date].sentence.push(item);
    }
  });
  
  
  
  // 각 날짜별로 데이터 처리
  const filteredData: VoiceData[] = [];
  
  Object.keys(dateGroups).forEach(date => {
    const { ah, sentence } = dateGroups[date];
    const isSelected = selectedDates.includes(date);
    
    
    
    if (isSelected && selectedDates.length > 0) {
      // 선택된 날짜: 제한된 개수만큼 최신 데이터 추가 (실제 시간 유지)
      const sortedAh = ah.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const limitedAh = sortedAh.slice(0, 3); // 최신 3개만
      
      const sortedSentence = sentence.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      // voice_sentence 데이터는 제한하지 않고 모든 데이터를 표시
      
      filteredData.push(...limitedAh, ...sortedSentence);
    } else {
      // 선택되지 않은 날짜: voice_ah만 평균값 계산, voice_sentence는 원본 데이터 유지
      if (ah.length > 0) {
        const avgAhData = calculateAverageAhData(ah, date);
        filteredData.push(avgAhData);
      }
      // voice_sentence는 평균값을 계산하지 않고 원본 데이터를 그대로 유지
      if (sentence.length > 0) {
        filteredData.push(...sentence);
      }
    }
  });
  
  // 전체 데이터를 날짜순으로 정렬
  const result = filteredData.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  

  return result;
};

// ah_feature 데이터의 평균값 계산
const calculateAverageAhData = (ahData: VoiceData[], date: string): VoiceData => {
  const firstData = ahData[0];
  const avgAhFeatures = {
    jitter: {
      local: ahData.reduce((sum, d) => sum + (d.ah_features?.jitter.local || 0), 0) / ahData.length,
      rap: ahData.reduce((sum, d) => sum + (d.ah_features?.jitter.rap || 0), 0) / ahData.length,
      ppq5: ahData.reduce((sum, d) => sum + (d.ah_features?.jitter.ppq5 || 0), 0) / ahData.length,
      ddp: ahData.reduce((sum, d) => sum + (d.ah_features?.jitter.ddp || 0), 0) / ahData.length,
    },
    shimmer: {
      local: ahData.reduce((sum, d) => sum + (d.ah_features?.shimmer.local || 0), 0) / ahData.length,
      apq3: ahData.reduce((sum, d) => sum + (d.ah_features?.shimmer.apq3 || 0), 0) / ahData.length,
      apq5: ahData.reduce((sum, d) => sum + (d.ah_features?.shimmer.apq5 || 0), 0) / ahData.length,
      apq11: ahData.reduce((sum, d) => sum + (d.ah_features?.shimmer.apq11 || 0), 0) / ahData.length,
      dda: ahData.reduce((sum, d) => sum + (d.ah_features?.shimmer.dda || 0), 0) / ahData.length,
    },
    hnr: ahData.reduce((sum, d) => sum + (d.ah_features?.hnr || 0), 0) / ahData.length,
    nhr: ahData.reduce((sum, d) => sum + (d.ah_features?.nhr || 0), 0) / ahData.length,
    f0: ahData.reduce((sum, d) => sum + (d.ah_features?.f0 || 0), 0) / ahData.length,
    max_f0: ahData.reduce((sum, d) => sum + (d.ah_features?.max_f0 || 0), 0) / ahData.length,
    min_f0: ahData.reduce((sum, d) => sum + (d.ah_features?.min_f0 || 0), 0) / ahData.length,
  };

  return {
    ...firstData,
    voice_id: -1, // 평균 데이터임을 나타내는 특별한 ID
    created_at: `${date}T12:00:00.000Z`, // 평균 시간으로 설정
    ah_features: avgAhFeatures,
    sentence_features: null, // ah 데이터이므로 sentence는 null
  };
};

// sentence_feature 데이터의 평균값 계산 (현재 사용하지 않음)
// const calculateAverageSentenceData = (sentenceData: VoiceData[], date: string): VoiceData => {
//   const firstData = sentenceData[0];
//   const avgSentenceFeatures = {
//     cpp: sentenceData.reduce((sum, d) => sum + (d.sentence_features?.cpp || 0), 0) / sentenceData.length,
//     csid: sentenceData.reduce((sum, d) => sum + (d.sentence_features?.csid || 0), 0) / sentenceData.length,
//     sampling_data: {
//       sampling_rate: firstData.sentence_features?.sampling_data.sampling_rate || 0,
//       data_points: {
//         energe: sentenceData.reduce((sum, d) => sum + (d.sentence_features?.sampling_data.data_points.energe || 0), 0) / sentenceData.length,
//         frequency: sentenceData.reduce((sum, d) => sum + (d.sentence_features?.sampling_data.data_points.frequency || 0), 0) / sentenceData.length,
//       }
//     }
//   };

//   return {
//     ...firstData,
//     voice_id: -1, // 평균 데이터임을 나타내는 특별한 ID
//     created_at: `${date}T12:00:00.000Z`, // 평균 시간으로 설정
//     ah_features: null, // sentence 데이터이므로 ah는 null
//     sentence_features: avgSentenceFeatures,
//   };
// };

const usePatientTrainingStore = create<PatientTrainingStore>()(
  persist(
    (set, get) => ({
      voiceData: [],
      originalVoiceData: [], // 원본 데이터 초기화
      loading: false,
      error: null,
      fetchedNoDataForPatient: {},
      selectedDates: [], // 선택된 날짜 배열 초기화
      
      getAvailableDates: () => {
        const state = get();
        const dates = state.originalVoiceData
          .filter(item => {
            // 유효한 데이터가 있는 항목만 필터링
            return (item.recording_type === 'voice_ah' && item.ah_features) ||
                   (item.recording_type === 'voice_sentence' && item.sentence_features);
          })
          .map(item => {
            try {
              return item.created_at.split('T')[0]; // YYYY-MM-DD 형식으로 날짜 추출
            } catch (error) {
              console.error('날짜 파싱 오류:', item.created_at, error);
              return null;
            }
          })
          .filter(Boolean) as string[];
        return [...new Set(dates)].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      },
      
      fetchVoiceData: async (patientId, accessToken, startDate, endDate) => {
        set({ loading: true, error: null });
        
        const authStore = useAuthStore.getState();
        if (!authStore.isAuthenticated) {
          set({ loading: false, error: '로그인이 필요합니다.' });
          return;
        }

        const today = new Date();
        const tomorrow = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
        const defaultEndDate = tomorrow.toISOString().slice(0, 10);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const defaultStartDate = weekAgo.toISOString().slice(0, 10);

        const finalStartDate = startDate || defaultStartDate;
        const finalEndDate = endDate || defaultEndDate;

        try {
          const { data, error } = await authenticatedGet(
            `/dashboard/doctor/${patientId}?start_date=${finalStartDate}&end_date=${finalEndDate}`
          );

          if (error) {
            throw new Error('음성 데이터 조회 실패');
          }

          const { voices: list } = data as { voices: VoiceData[] };

          if (!list || list.length === 0) {
            set((state) => ({
              voiceData: [],
              loading: false,
              fetchedNoDataForPatient: { ...state.fetchedNoDataForPatient, [patientId]: true },
            }));
            return;
          }

          // 원본 데이터를 저장
          set((state) => ({
            originalVoiceData: list,
          }));

          // 선택된 날짜를 고려하여 데이터 필터링
          const currentState = get();
  
          const filteredList = filterDataByDate(list, currentState.selectedDates);

          set((state) => ({
            voiceData: filteredList,
            loading: false,
            fetchedNoDataForPatient: { ...state.fetchedNoDataForPatient, [patientId]: false },
          }));
        } catch (e: any) {
          set((state) => ({
            error: e.message,
            loading: false,
            fetchedNoDataForPatient: { ...state.fetchedNoDataForPatient, [patientId]: true },
          }));
        }
      },

      setSelectedDates: (dates: string[]) => {
        set({ selectedDates: dates });
        // 선택된 날짜가 변경되면 현재 데이터를 다시 필터링
        const currentState = get();
        if (currentState.originalVoiceData.length > 0) {
          const filteredList = filterDataByDate(currentState.originalVoiceData, dates);
          set((state) => ({
            voiceData: filteredList,
          }));
        }
      },

      reset: () => set({ 
        voiceData: [], 
        loading: false, 
        error: null, 
        fetchedNoDataForPatient: {},
        selectedDates: [], 
        originalVoiceData: [] // 원본 데이터도 초기화
      }),
    }),
    {
      name: 'patient-training-storage',
      // loading 상태는 persist하지 않음
      partialize: (state) => ({
        voiceData: state.voiceData,
        fetchedNoDataForPatient: state.fetchedNoDataForPatient,
        selectedDates: state.selectedDates, // 선택된 날짜도 persist
      }),
    }
  )
);

export default usePatientTrainingStore;
