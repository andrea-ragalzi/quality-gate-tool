import { useState, useEffect, useCallback, useRef } from "react";
import { AnalysisRepository } from "./repository";
import {
  AnalysisState,
  ModuleLogs,
  StartAnalysisPayload,
  OverallStatus,
} from "./types";
import { MODULES_CONFIG } from "@/config/modules";

export const useAnalysisViewModel = () => {
  const [state, setState] = useState<AnalysisState>({
    overallStatus: "IDLE",
    moduleLogs: {},
    isAnalyzing: false,
    isWatching: false,
  });

  // Initialize logs
  useEffect(() => {
    const initialLogs: ModuleLogs = {};
    MODULES_CONFIG.forEach((m) => {
      initialLogs[m.id] = {
        logs: [],
        fullLog: "",
        status: "PENDING",
      };
    });
    setState((prev) => ({ ...prev, moduleLogs: initialLogs }));
  }, []);

  const repositoryRef = useRef(new AnalysisRepository());

  const handleMessage = useCallback((data: any) => {
    setState((prev) => {
      const newState = { ...prev };

      // 1. Module Specific Updates
      if (data.module || data.moduleId || data.module_id) {
        const moduleId = data.module || data.moduleId || data.module_id;
        const existingModule = newState.moduleLogs[moduleId] || {
          logs: [],
          fullLog: "",
          status: "PENDING",
        };
        const module = { ...existingModule };

        if (data.type === "LOG" || data.type === "ERROR") {
          const msg = data.data || data.message || data.error;
          const timestamp = new Date().toLocaleTimeString();
          const logLine = `[${timestamp}] ${msg}`;
          module.logs = [...module.logs, logLine].slice(-10);
          module.fullLog += logLine + "\n";
        } else if (data.type === "STREAM") {
          const msg = data.data || data.message;
          module.fullLog += msg;
          // Simple stream appending logic for logs array
          const currentLogs = [...module.logs];
          if (
            currentLogs.length > 0 &&
            !currentLogs[currentLogs.length - 1].endsWith("\n")
          ) {
            currentLogs[currentLogs.length - 1] += msg;
          } else {
            currentLogs.push(msg);
          }
          module.logs = currentLogs.slice(-10);
        } else if (data.type === "INIT") {
          module.status = "RUNNING";
          module.logs = ["Analysis started..."];
          module.fullLog = "Analysis started...\n";
        } else if (data.type === "END") {
          module.status = data.status === "PASS" ? "PASS" : "FAIL";
          module.summary = data.summary;
        }

        newState.moduleLogs = { ...newState.moduleLogs, [moduleId]: module };
      }

      // 2. Global Updates
      if (
        data.type === "GLOBAL_INIT" ||
        (data.type === "INIT" && !data.module)
      ) {
        newState.isAnalyzing = true;
        newState.overallStatus = "RUNNING";
        // Reset logs? Maybe not if incremental
      } else if (data.type === "GLOBAL_END") {
        newState.isAnalyzing = false;
        newState.overallStatus = data.status === "PASS" ? "PASS" : "FAIL";
      }

      return newState;
    });
  }, []);

  const handleWebSocketError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      overallStatus: "ERROR",
      isAnalyzing: false,
      isWatching: false,
    }));
  }, []);

  const handleWebSocketClose = useCallback(() => {
    console.log("WebSocket closed");
  }, []);

  useEffect(() => {
    const repo = repositoryRef.current;
    repo.connect(handleMessage, handleWebSocketError, handleWebSocketClose);
    return () => {
      repo.disconnect();
    };
  }, [handleMessage, handleWebSocketError, handleWebSocketClose]);

  const startAnalysis = async (payload: StartAnalysisPayload) => {
    try {
      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        overallStatus: "STARTING",
      }));
      if (payload.mode === "watch") {
        setState((prev) => ({
          ...prev,
          isWatching: true,
          overallStatus: "WATCHING",
        }));
      }
      await repositoryRef.current.startAnalysis(payload);
    } catch (error) {
      console.error(error);
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        overallStatus: "ERROR",
      }));
    }
  };

  const stopAnalysis = async () => {
    try {
      await repositoryRef.current.stopAnalysis();
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        overallStatus: "IDLE",
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const stopWatch = async () => {
    try {
      await repositoryRef.current.stopWatch();
      setState((prev) => ({
        ...prev,
        isWatching: false,
        isAnalyzing: false,
        overallStatus: "IDLE",
      }));
    } catch (error) {
      console.error(error);
    }
  };

  return {
    ...state,
    startAnalysis,
    stopAnalysis,
    stopWatch,
  };
};
