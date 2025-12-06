import { useState, useCallback } from "react";

export type MatrixPhase =
  | "matrix"
  | "glitch"
  | "crack"
  | "shatter"
  | "complete";

export function useMatrixIntro() {
  const [isMatrixActive, setIsMatrixActive] = useState(true);
  const [phase, setPhase] = useState<MatrixPhase>("matrix");

  const onGlitchStart = useCallback(() => {
    setPhase("glitch");
  }, []);

  const onCrackStart = useCallback(() => {
    setPhase("crack");
  }, []);

  const onShatterStart = useCallback(() => {
    setPhase("shatter");
  }, []);

  const onShatterComplete = useCallback(() => {
    setPhase("complete");
    setIsMatrixActive(false);
  }, []);

  return {
    isMatrixActive,
    phase,
    onGlitchStart,
    onCrackStart,
    onShatterStart,
    onShatterComplete,
  };
}
