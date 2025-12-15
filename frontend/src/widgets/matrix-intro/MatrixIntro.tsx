"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Box, Text, UnstyledButton } from "@mantine/core";
import { MATRIX_MESSAGES } from "@/shared";
import {
  useMatrixRain,
  useTypingEffect,
  useShatterAnimation,
} from "./model/matrixEffects";

// ==========================================
// TYPES
// ==========================================

interface MatrixIntroProps {
  phase: "matrix" | "glitch" | "crack" | "shatter" | "complete";
  username?: string;
  onGlitchStart: () => void;
  onCrackStart: () => void;
  onShatterStart: () => void;
  onShatterComplete: () => void;
  onSkip?: () => void;
}

// ==========================================
// PURE FUNCTIONS
// ==========================================

function getContainerClass(phase: string): string {
  const baseClass = "matrix-intro__canvas-container";
  if (phase === "glitch") return `${baseClass} ${baseClass}--glitch`;
  if (phase === "matrix") return `${baseClass} ${baseClass}--rain`;
  return baseClass;
}

function prepareMessages(username: string): string[] {
  const randomMessage =
    MATRIX_MESSAGES[Math.floor(Math.random() * MATRIX_MESSAGES.length)];
  return randomMessage.lines.map((line) =>
    line.replace("{username}", username),
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface TypingOverlayProps {
  text: string;
  showCursor: boolean;
}

const TypingOverlay: React.FC<TypingOverlayProps> = ({ text, showCursor }) => (
  <Box className="matrix-intro__typing-overlay">
    {text}
    <Text
      component="span"
      className={`matrix-intro__cursor${
        showCursor ? "" : " matrix-intro__cursor--hidden"
      }`}
    >
      _
    </Text>
  </Box>
);

interface CrackOverlayProps {}

const CrackOverlay: React.FC<CrackOverlayProps> = () => (
  <Box className="matrix-intro__crack">
    <Box
      component="svg"
      className="matrix-intro__crack-svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path d="M50 50 L20 10" stroke="white" strokeWidth="0.5" />
      <path d="M50 50 L80 15" stroke="white" strokeWidth="0.5" />
      <path d="M50 50 L90 50" stroke="white" strokeWidth="0.5" />
      <path d="M50 50 L85 85" stroke="white" strokeWidth="0.5" />
      <path d="M50 50 L50 95" stroke="white" strokeWidth="0.5" />
      <path d="M50 50 L15 80" stroke="white" strokeWidth="0.5" />
      <path d="M50 50 L10 50" stroke="white" strokeWidth="0.5" />
      <path d="M50 50 L25 25" stroke="white" strokeWidth="0.5" />
    </Box>
  </Box>
);

interface SkipButtonProps {
  onClick?: () => void;
}

const SkipButton: React.FC<SkipButtonProps> = ({ onClick }) => (
  <UnstyledButton
    onClick={onClick}
    className="matrix-intro__skip-btn"
    type="button"
  >
    [ JUMP ]
  </UnstyledButton>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

const MatrixIntro: React.FC<MatrixIntroProps> = ({
  phase,
  username = "Username",
  onGlitchStart,
  onCrackStart,
  onShatterStart,
  onShatterComplete,
  onSkip,
}) => {
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const [introPhase, setIntroPhase] = useState<"typing" | "rain">("typing");
  const [messages] = useState(() => prepareMessages(username));

  // Matrix rain effect
  const { sceneRef, cameraRef, rendererRef, textureRef } = useMatrixRain({
    containerRef: threeContainerRef,
    isActive: introPhase === "rain",
    phase,
  });

  // Typing effect
  const handleTypingComplete = useCallback(() => {
    setIntroPhase("rain");
  }, []);

  const { typingText, showCursor } = useTypingEffect({
    messages,
    isActive: introPhase === "typing",
    onComplete: handleTypingComplete,
  });

  // Shatter animation
  useShatterAnimation({
    sceneRef,
    cameraRef,
    rendererRef,
    textureRef,
    isActive: phase === "shatter",
    onComplete: onShatterComplete,
  });

  // Phase transitions
  useEffect(() => {
    if (introPhase === "rain") {
      const timer = setTimeout(onGlitchStart, 4000);
      return () => clearTimeout(timer);
    }
  }, [introPhase, onGlitchStart]);

  useEffect(() => {
    if (phase === "glitch") {
      const timer = setTimeout(onCrackStart, 1500);
      return () => clearTimeout(timer);
    }
    if (phase === "crack") {
      const timer = setTimeout(onShatterStart, 150);
      return () => clearTimeout(timer);
    }
  }, [phase, onCrackStart, onShatterStart]);

  if (phase === "complete") return null;

  return (
    <Box className="matrix-intro matrix-intro--bg-black">
      <Box ref={threeContainerRef} className={getContainerClass(phase)} />

      {phase === "crack" && <CrackOverlay />}

      {introPhase === "typing" && (
        <TypingOverlay text={typingText} showCursor={showCursor} />
      )}

      <SkipButton onClick={onSkip} />
    </Box>
  );
};

export default MatrixIntro;
