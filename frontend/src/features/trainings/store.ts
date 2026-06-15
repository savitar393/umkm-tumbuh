import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TrainingFilters {
  category: string;
  search: string;
}

interface TrainingLessonState {
  currentModuleId: string | null;
  completedModules: string[];
}

interface TrainingStore {
  umkmId: string;
  setUmkmId: (id: string) => void;

  filters: TrainingFilters;
  setFilters: (filters: Partial<TrainingFilters>) => void;
  resetFilters: () => void;

  lessonState: TrainingLessonState;
  setCurrentModule: (moduleId: string) => void;
  markModuleCompleted: (moduleId: string) => void;
  resetLessonState: () => void;

  selectedTrainingId: string | null;
  setSelectedTrainingId: (id: string | null) => void;
}

const defaultFilters: TrainingFilters = {
  category: "Semua Pelatihan",
  search: "",
};

const defaultLessonState: TrainingLessonState = {
  currentModuleId: null,
  completedModules: [],
};

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set) => ({
      umkmId: "",
      setUmkmId: (id) => set({ umkmId: id }),

      filters: defaultFilters,
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),

      lessonState: defaultLessonState,
      setCurrentModule: (moduleId) =>
        set((state) => ({
          lessonState: { ...state.lessonState, currentModuleId: moduleId },
        })),
      markModuleCompleted: (moduleId) =>
        set((state) => ({
          lessonState: {
            ...state.lessonState,
            completedModules: [...new Set([...state.lessonState.completedModules, moduleId])],
          },
        })),
      resetLessonState: () => set({ lessonState: defaultLessonState }),

      selectedTrainingId: null,
      setSelectedTrainingId: (id) => set({ selectedTrainingId: id }),
    }),
    {
      name: "training-storage",
      partialize: (state) => ({
        umkmId: state.umkmId,
        lessonState: state.lessonState,
        selectedTrainingId: state.selectedTrainingId,
      }),
    }
  )
);
