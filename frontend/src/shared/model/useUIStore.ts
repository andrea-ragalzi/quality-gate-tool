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
  crtEnabled: boolean;

  // Actions
  setMatrixPhase: (phase: MatrixPhase) => void;
  completeMatrixIntro: () => void;
  resetMatrixIntro: () => void;
  toggleCrt: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isMatrixActive: true,
      matrixPhase: "matrix",
      crtEnabled: true,

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

      toggleCrt: () => set((state) => ({ crtEnabled: !state.crtEnabled })),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isMatrixActive: state.isMatrixActive,
        matrixPhase: state.matrixPhase,
        crtEnabled: state.crtEnabled,
      }),
    },
  ),
);
