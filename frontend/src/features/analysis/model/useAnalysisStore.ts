import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AnalysisState, ModuleLogs, OverallStatus } from "../types";
import {
  processWebSocketMessage,
  createDefaultModuleLog,
  MessageHandlerContext,
} from "./messageHandlers";

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

  // WebSocket Connection
  connect: () => void;
  disconnect: () => void;

  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => {
      let ws: WebSocket | null = null;

      /**
       * Create message handler context for the current state
       */
      const createMessageContext = (): MessageHandlerContext => {
        const state = get();
        return {
          state: {
            ...state,
            setLastSystemMessage: state.setLastSystemMessage,
            updateModuleLog: state.updateModuleLog,
            resetLogs: state.resetLogs,
            setIsAnalyzing: state.setIsAnalyzing,
            setOverallStatus: (status: string) =>
              state.setOverallStatus(status as OverallStatus),
          },
          getCurrentModuleLog: (moduleId: string) => {
            const log = state.moduleLogs[moduleId];
            return log
              ? { ...log, status: log.status || "PENDING" }
              : createDefaultModuleLog();
          },
        };
      };

      return {
        overallStatus: "IDLE",
        moduleLogs: {},
        isAnalyzing: false,
        isWatching: false,
        lastSystemMessage: "",
        projectPath: "",
        _hasHydrated: false,

        setOverallStatus: (status) => set({ overallStatus: status }),
        setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
        setIsWatching: (isWatching) => set({ isWatching }),
        setLastSystemMessage: (message) => set({ lastSystemMessage: message }),
        setProjectPath: (path) => set({ projectPath: path }),
        setHasHydrated: (state) => set({ _hasHydrated: state }),

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

        resetLogs: () => set({ moduleLogs: {} }),

        connect: () => {
          if (ws) return;
          ws = new WebSocket(`${WS_URL}/api/ws/analysis`);

          ws.onopen = () => console.log("WebSocket Connected");

          ws.onmessage = (event) => {
            const context = createMessageContext();
            processWebSocketMessage(event.data, context);
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
            if (!ws || event.target !== ws) return;

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
            ws.onclose = null;
            ws.close();
            ws = null;
          }
        },
      };
    },
    {
      name: "analysis-storage",
      partialize: (state) => ({
        projectPath: state.projectPath,
        isWatching: state.isWatching,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
