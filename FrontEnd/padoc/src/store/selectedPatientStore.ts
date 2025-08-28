import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PatientProfile {
  account_id: number;
  full_name: string;
}

interface SelectedPatientStore {
  selectedPatient: PatientProfile | null;
  setSelectedPatient: (patient: PatientProfile | null) => void;
  clearSelectedPatient: () => void;
}

const useSelectedPatientStore = create<SelectedPatientStore>()(
  persist(
    (set) => ({
      selectedPatient: null,
      setSelectedPatient: (patient) => set({ selectedPatient: patient }),
      clearSelectedPatient: () => set({ selectedPatient: null }),
    }),
    {
      name: 'selected-patient-storage',
    }
  )
);

export default useSelectedPatientStore;
