import { create } from "zustand";
import { AnalysisState, ModuleLogs, OverallStatus } from "../types";

interface AnalysisStore extends AnalysisState {
  // Actions
  setOverallStatus: (status: OverallStatus) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setIsWatching: (isWatching: boolean) => void;
  setLastSystemMessage: (message: string) => void;
  setProjectPath: (path: string) => void;
  updateModuleLog: (
    moduleId: string,
    update: Partial<ModuleLogs[string]>,
  ) => void;
  resetLogs: () => void;

  // WebSocket Connection Logic (could be moved to a separate hook/middleware if complex)
  connect: () => void;
  disconnect: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export const useAnalysisStore = create<AnalysisStore>((set, get) => {
  let ws: WebSocket | null = null;

  return {
    overallStatus: "IDLE",
    moduleLogs: {},
    isAnalyzing: false,
    isWatching: false,
    lastSystemMessage: "",
    projectPath: "",

    setOverallStatus: (status) => set({ overallStatus: status }),
    setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
    setIsWatching: (isWatching) => set({ isWatching }),
    setLastSystemMessage: (message) => set({ lastSystemMessage: message }),
    setProjectPath: (path) => set({ projectPath: path }),

    updateModuleLog: (moduleId, update) =>
      set((state) => {
        const existing = state.moduleLogs[moduleId] || {
          logs: [],
          fullLog: "",
          status: "PENDING",
        };
        return {
          moduleLogs: {
            ...state.moduleLogs,
            [moduleId]: { ...existing, ...update },
          },
        };
      }),

    resetLogs: () => {
      set({ moduleLogs: {} });
    },

    connect: () => {
      if (ws) return;
      ws = new WebSocket(`${WS_URL}/api/ws/analysis`);

      ws.onopen = () => console.log("WebSocket Connected");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const state = get();

          // 0. Global System Logs
          if (
            data.type === "LOG" &&
            !data.module &&
            !data.moduleId &&
            !data.module_id
          ) {
            state.setLastSystemMessage(data.message || data.data);
          }

          // 1. Module Specific Updates
          const moduleId = data.module || data.moduleId || data.module_id;
          if (moduleId) {
            const currentLog = state.moduleLogs[moduleId] || {
              logs: [],
              fullLog: "",
              status: "PENDING",
            };

            if (data.type === "LOG" || data.type === "ERROR") {
              const msg = data.data || data.message || data.error;
              const timestamp = new Date().toLocaleTimeString();
              const logLine = `[${timestamp}] ${msg}`;
              state.updateModuleLog(moduleId, {
                logs: [...currentLog.logs, logLine].slice(-10),
                fullLog: currentLog.fullLog + logLine + "\n",
              });
            } else if (data.type === "STREAM") {
              const msg = data.data || data.message;
              // Simple stream appending logic
              const currentLogs = [...currentLog.logs];
              if (
                currentLogs.length > 0 &&
                !currentLogs[currentLogs.length - 1].endsWith("\n")
              ) {
                currentLogs[currentLogs.length - 1] += msg;
              } else {
                currentLogs.push(msg);
              }
              state.updateModuleLog(moduleId, {
                fullLog: currentLog.fullLog + msg,
                logs: currentLogs.slice(-10),
              });
            } else if (data.type === "INIT") {
              state.updateModuleLog(moduleId, {
                status: "RUNNING",
                logs: ["Analysis started..."],
                fullLog: "Analysis started...\n",
                metrics: undefined,
              });
            } else if (data.type === "END") {
              state.updateModuleLog(moduleId, {
                status: data.status === "PASS" ? "PASS" : "FAIL",
                summary: data.summary,
              });
            } else if (data.type === "METRICS") {
              state.updateModuleLog(moduleId, { metrics: data.data });
            }
          }

          // 2. Global Updates
          if (
            data.type === "GLOBAL_INIT" ||
            (data.type === "INIT" && !moduleId)
          ) {
            state.resetLogs(); // Clear logs on new analysis
            state.setIsAnalyzing(true);
            state.setOverallStatus("RUNNING");
          } else if (data.type === "GLOBAL_END") {
            state.setIsAnalyzing(false);
            state.setOverallStatus(
              data.status === "PASS" ? "SUCCESS" : "FAILURE",
            );
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message", e);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket Disconnected", event.code, event.reason);
        ws = null;

        // Auto-reconnect
        setTimeout(() => {
          console.log("Attempting to reconnect...");
          get().connect();
        }, 3000);
      };

      ws.onerror = (event: Event) => {
        // Ignore errors if we explicitly disconnected (ws is null) or if this event is from an old socket
        if (!ws || event.target !== ws) return;

        // Only set error state if we were expecting a connection
        if (
          ws.readyState !== WebSocket.CLOSED &&
          ws.readyState !== WebSocket.CLOSING
        ) {
          console.error("WebSocket Error", event);
          set({
            overallStatus: "ERROR",
            isAnalyzing: false,
            isWatching: false,
          });
        }
      };
    },

    disconnect: () => {
      if (ws) {
        console.log("Closing WebSocket connection...");
        ws.onclose = null; // Prevent auto-reconnect
        ws.close();
        ws = null;
      }
    },
  };
});
