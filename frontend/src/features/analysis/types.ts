export type ModuleStatus = "PENDING" | "RUNNING" | "PASS" | "FAIL";
export type OverallStatus =
  | "IDLE"
  | "STARTING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILURE"
  | "ERROR"
  | "WATCHING";

export interface ModuleLog {
  logs: string[];
  fullLog: string;
  status: ModuleStatus;
  summary?: string;
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
