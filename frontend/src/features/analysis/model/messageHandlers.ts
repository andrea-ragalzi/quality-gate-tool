import { AnalysisState, ModuleLogs } from "../types";

// ==========================================
// TYPES
// ==========================================

export interface WebSocketMessage {
  type: string;
  module?: string;
  moduleId?: string;
  module_id?: string;
  message?: string;
  data?: string;
  error?: string;
  status?: string;
  summary?: string;
  encoding?: string;
}

export interface ModuleLogState {
  logs: string[];
  fullLog: string;
  status: string;
  summary?: string;
  metrics?: unknown;
}

export interface MessageHandlerContext {
  state: AnalysisState & {
    setLastSystemMessage: (message: string) => void;
    updateModuleLog: (
      moduleId: string,
      update: Partial<ModuleLogState>,
    ) => void;
    resetLogs: () => void;
    setIsAnalyzing: (isAnalyzing: boolean) => void;
    setOverallStatus: (status: string) => void;
  };
  getCurrentModuleLog: (moduleId: string) => ModuleLogState;
}

// ==========================================
// PURE FUNCTIONS
// ==========================================

/**
 * Extract module ID from message (supports multiple field names)
 */
export function extractModuleId(data: WebSocketMessage): string | undefined {
  return data.module || data.moduleId || data.module_id;
}

/**
 * Create default module log state
 */
export function createDefaultModuleLog(): ModuleLogState {
  return {
    logs: [],
    fullLog: "",
    status: "PENDING",
  };
}

/**
 * Format log line with timestamp
 */
export function formatLogLine(message: string): string {
  const timestamp = new Date().toLocaleTimeString();
  return `[${timestamp}] ${message}`;
}

/**
 * Append log to module state (keeping last 10)
 */
export function appendLog(
  currentLog: ModuleLogState,
  logLine: string,
): Partial<ModuleLogState> {
  return {
    logs: [...currentLog.logs, logLine].slice(-10),
    fullLog: currentLog.fullLog + logLine + "\n",
  };
}

/**
 * Append stream data to module state
 */
export function appendStreamData(
  currentLog: ModuleLogState,
  data: string,
): Partial<ModuleLogState> {
  const currentLogs = [...currentLog.logs];

  if (
    currentLogs.length > 0 &&
    !currentLogs[currentLogs.length - 1].endsWith("\n")
  ) {
    currentLogs[currentLogs.length - 1] += data;
  } else {
    currentLogs.push(data);
  }

  return {
    fullLog: currentLog.fullLog + data,
    logs: currentLogs.slice(-10),
  };
}

/**
 * Check if message is a global system log
 */
export function isGlobalSystemLog(data: WebSocketMessage): boolean {
  return (
    data.type === "LOG" && !data.module && !data.moduleId && !data.module_id
  );
}

/**
 * Check if message is a global init event
 */
export function isGlobalInit(
  data: WebSocketMessage,
  moduleId?: string,
): boolean {
  return data.type === "GLOBAL_INIT" || (data.type === "INIT" && !moduleId);
}

/**
 * Map message status to overall status
 */
export function mapToOverallStatus(status: string): string {
  return status === "PASS" ? "SUCCESS" : "FAILURE";
}

/**
 * Map message status to module status
 */
export function mapToModuleStatus(status: string): string {
  return status === "PASS" ? "PASS" : "FAIL";
}

// ==========================================
// MESSAGE HANDLERS
// ==========================================

/**
 * Handle LOG or ERROR type messages
 */
export function handleLogMessage(
  data: WebSocketMessage,
  moduleId: string,
  currentLog: ModuleLogState,
): Partial<ModuleLogState> {
  const msg = data.data || data.message || data.error || "";
  const logLine = formatLogLine(msg);
  return appendLog(currentLog, logLine);
}

/**
 * Handle STREAM type messages (without compression)
 */
export function handleStreamMessage(
  data: WebSocketMessage,
  currentLog: ModuleLogState,
): Partial<ModuleLogState> {
  const msg = data.data || data.message || "";
  return appendStreamData(currentLog, msg);
}

/**
 * Handle INIT type messages
 */
export function handleInitMessage(): Partial<ModuleLogState> {
  return {
    status: "RUNNING",
    logs: ["Analysis started..."],
    fullLog: "Analysis started...\n",
    metrics: undefined,
  };
}

/**
 * Handle END type messages
 */
export function handleEndMessage(
  data: WebSocketMessage,
): Partial<ModuleLogState> {
  return {
    status: mapToModuleStatus(data.status || ""),
    summary: data.summary,
  };
}

/**
 * Handle METRICS type messages
 */
export function handleMetricsMessage(
  data: WebSocketMessage,
): Partial<ModuleLogState> {
  return { metrics: data.data };
}

// ==========================================
// DECOMPRESSION HANDLER (Async)
// ==========================================

/**
 * Decompress gzip base64 encoded data
 */
export async function decompressGzipBase64(encoded: string): Promise<string> {
  const binaryString = atob(encoded);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const stream = new Response(bytes).body?.pipeThrough(
    new DecompressionStream("gzip"),
  );

  if (!stream) {
    throw new Error("Failed to create decompression stream");
  }

  return new Response(stream).text();
}

/**
 * Handle compressed STREAM messages
 */
export async function handleCompressedStream(
  data: WebSocketMessage,
  moduleId: string,
  getCurrentModuleLog: (id: string) => ModuleLogState,
  updateModuleLog: (id: string, update: Partial<ModuleLogState>) => void,
): Promise<boolean> {
  if (data.encoding !== "gzip_base64" || !data.data) {
    return false;
  }

  try {
    const decompressed = await decompressGzipBase64(data.data);
    const currentLog = getCurrentModuleLog(moduleId);
    const update = appendStreamData(currentLog, decompressed);
    updateModuleLog(moduleId, update);
    return true;
  } catch (e) {
    console.error("Decompression failed", e);
    const currentLog = getCurrentModuleLog(moduleId);
    updateModuleLog(
      moduleId,
      appendStreamData(currentLog, "[Decompression Error]"),
    );
    return true; // Still handled, even if error
  }
}

// ==========================================
// MAIN MESSAGE PROCESSOR
// ==========================================

/**
 * Process incoming WebSocket message
 * Returns true if message was handled
 */
export function processWebSocketMessage(
  rawData: string,
  context: MessageHandlerContext,
): boolean {
  try {
    const data: WebSocketMessage = JSON.parse(rawData);
    const { state, getCurrentModuleLog } = context;

    // 1. Global System Logs
    if (isGlobalSystemLog(data)) {
      state.setLastSystemMessage(data.message || data.data || "");
    }

    // 2. Module-specific updates
    const moduleId = extractModuleId(data);
    if (moduleId) {
      const currentLog = getCurrentModuleLog(moduleId);

      switch (data.type) {
        case "LOG":
        case "ERROR":
          state.updateModuleLog(
            moduleId,
            handleLogMessage(data, moduleId, currentLog),
          );
          break;

        case "STREAM":
          // Handle compression asynchronously if needed
          if (data.encoding === "gzip_base64") {
            handleCompressedStream(
              data,
              moduleId,
              getCurrentModuleLog,
              state.updateModuleLog,
            );
          } else {
            state.updateModuleLog(
              moduleId,
              handleStreamMessage(data, currentLog),
            );
          }
          break;

        case "INIT":
          state.updateModuleLog(moduleId, handleInitMessage());
          break;

        case "END":
          state.updateModuleLog(moduleId, handleEndMessage(data));
          break;

        case "METRICS":
          state.updateModuleLog(moduleId, handleMetricsMessage(data));
          break;
      }
    }

    // 3. Global state updates
    if (isGlobalInit(data, moduleId)) {
      state.resetLogs();
      state.setIsAnalyzing(true);
      state.setOverallStatus("RUNNING");
    } else if (data.type === "GLOBAL_END") {
      state.setIsAnalyzing(false);
      state.setOverallStatus(mapToOverallStatus(data.status || ""));
    }

    return true;
  } catch (e) {
    console.error("Failed to parse WebSocket message", e);
    return false;
  }
}
