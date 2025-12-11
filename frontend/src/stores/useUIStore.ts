import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type MatrixPhase =
  | "matrix"
  | "glitch"
  | "crack"
  | "shatter"
  | "complete";

interface UIState {
  // Matrix Intro State
  isMatrixActive: boolean;
  matrixPhase: MatrixPhase;

  // Actions
  setMatrixPhase: (phase: MatrixPhase) => void;
  completeMatrixIntro: () => void;
  resetMatrixIntro: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isMatrixActive: true,
      matrixPhase: "matrix",

      setMatrixPhase: (phase) => set({ matrixPhase: phase }),

      completeMatrixIntro: () =>
        set({
          isMatrixActive: false,
          matrixPhase: "complete",
        }),

      resetMatrixIntro: () =>
        set({
          isMatrixActive: true,
          matrixPhase: "matrix",
        }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isMatrixActive: state.isMatrixActive,
        matrixPhase: state.matrixPhase,
      }),
    },
  ),
);
