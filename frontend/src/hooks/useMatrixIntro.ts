import { useState, useCallback, useEffect } from "react";

export type MatrixPhase =
  | "matrix"
  | "glitch"
  | "crack"
  | "shatter"
  | "complete";

export function useMatrixIntro() {
  const [isMatrixActive, setIsMatrixActive] = useState(true);
  const [phase, setPhase] = useState<MatrixPhase>("matrix");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeenIntro = sessionStorage.getItem("matrix_intro_seen");
      if (hasSeenIntro) {
        setIsMatrixActive(false);
        setPhase("complete");
      }
    }
  }, []);

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
    if (typeof window !== "undefined") {
      sessionStorage.setItem("matrix_intro_seen", "true");
    }
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
