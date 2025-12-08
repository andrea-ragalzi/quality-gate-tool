export type ModuleStatus = "PENDING" | "RUNNING" | "PASS" | "FAIL";
export type OverallStatus =
  | "IDLE"
  | "STARTING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILURE"
  | "ERROR"
  | "WATCHING";

export interface Metrics {
  total_issues: {
    ERROR: number;
    WARNING: number;
    INFO: number;
    COMPLEXITY: number;
  };
  modules: Array<{
    file: string;
    metrics: {
      ERROR: number;
      WARNING: number;
      INFO: number;
    };
    complexity_metrics: {
      COMPLEXITY: number;
      MAX_CCN: number;
    };
  }>;
}

export interface ModuleLog {
  logs: string[];
  fullLog: string;
  status: ModuleStatus;
  summary?: string;
  metrics?: Metrics;
}

export type ModuleLogs = Record<string, ModuleLog>;

export interface AnalysisState {
  overallStatus: OverallStatus;
  moduleLogs: ModuleLogs;
  isAnalyzing: boolean;
  isWatching: boolean;
  lastSystemMessage?: string;
}

export interface StartAnalysisPayload {
  project_path: string;
  mode: "full" | "incremental" | "watch";
  selected_tools?: string[];
}
