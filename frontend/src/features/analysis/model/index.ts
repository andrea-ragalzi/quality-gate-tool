// features/analysis/model - Public API for analysis model segment
export { useAnalysisStore } from "./useAnalysisStore";
export { useAnalysisMutations } from "./useAnalysisMutations";
export { useTools } from "./useTools";
export type { StartAnalysisPayload } from "./types";

// Message handlers (CCN refactor)
export {
  processWebSocketMessage,
  // Pure functions
  extractModuleId,
  createDefaultModuleLog,
  formatLogLine,
  appendLog,
  appendStreamData,
  isGlobalSystemLog,
  isGlobalInit,
  mapToOverallStatus,
  mapToModuleStatus,
  handleLogMessage,
  handleStreamMessage,
  handleInitMessage,
  handleEndMessage,
  handleMetricsMessage,
  decompressGzipBase64,
  handleCompressedStream,
} from "./messageHandlers";
export type {
  WebSocketMessage,
  ModuleLogState,
  MessageHandlerContext,
} from "./messageHandlers";
