export { useMatrixIntro, type MatrixPhase } from "./useMatrixIntro";

// Matrix effects (CCN refactor)
export {
  useMatrixRain,
  useTypingEffect,
  useShatterAnimation,
  // Pure functions
  initializeDrops,
  updateDrop,
  getRandomChar,
  calculatePlaneDimensions,
  createFragmentVelocity,
  createRotationVelocity,
  calculateShatterProgress,
} from "./matrixEffects";
export type {
  MatrixRainConfig,
  ShatterFragment,
  UseMatrixRainOptions,
  UseMatrixRainReturn,
  UseTypingEffectOptions,
  UseTypingEffectReturn,
  UseShatterAnimationOptions,
} from "./matrixEffects";
