export interface ModuleConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface ModuleLog {
  logs: string[];
  fullLog: string;
  status: "PENDING" | "RUNNING" | "PASS" | "FAIL";
  summary?: string;
}

export type ModuleLogs = Record<string, ModuleLog>;

export type OverallStatus =
  | "IDLE"
  | "STARTING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILURE"
  | "ERROR"
  | "WATCHING";
