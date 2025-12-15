// shared/index.ts - Public API for shared layer
// Model
export { useUIStore, type MatrixPhase } from "./model";

// Lib
export { queryClient } from "./lib";

// Data
export { MATRIX_MESSAGES, type MatrixMessage } from "./data";

// UI
export { default as ErrorBoundary } from "./ui/ErrorBoundary";
export { default as LoadingModal } from "./ui/LoadingModal";
export { default as LogModal } from "./ui/LogModal";
export { MatrixEditor } from "./ui/MatrixEditor";
export { NotFoundPage } from "./ui/NotFoundPage";
export { Sparkline } from "./ui/Sparkline";
export { Typewriter } from "./ui/Typewriter";
