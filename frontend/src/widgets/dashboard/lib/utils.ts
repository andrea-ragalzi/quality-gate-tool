import { MetricsSummary } from "../model/types";

/**
 * Calculate metrics summary from findings
 */
export const calculateMetricsCounts = (
  findings: { type: string }[],
): MetricsSummary => {
  return findings.reduce(
    (acc, f) => {
      if (f.type === "Error") acc.Error++;
      else if (f.type === "Warning") acc.Warning++;
      else if (f.type === "Info") acc.Info++;
      return acc;
    },
    { Error: 0, Warning: 0, Info: 0, Complexity: 0 },
  );
};

/**
 * Get module status class for styling
 */
export const getModuleStatusClass = (status: string): string => {
  if (status === "FAIL") return "fail";
  if (status === "PASS") return "pass";
  return "pending";
};

/**
 * Get module summary text
 */
export const getModuleSummaryText = (
  status: string,
  logs: string[],
): string => {
  if (status === "RUNNING") return "RUNNING...";
  const errorCount = logs.filter((l) =>
    l.toLowerCase().includes("error"),
  ).length;
  return errorCount > 0 ? `${errorCount} ERR` : "CLEAN";
};

/**
 * Extract recent errors from logs
 */
export const extractRecentErrors = (logs: string[], maxCount = 2): string[] => {
  return logs
    .filter((l) => l.toLowerCase().includes("error") && l.includes(":"))
    .slice(0, maxCount)
    .map((l) => {
      const match = l.match(/([^\s/]+:\d+)/);
      return match ? `> ${match[1]}` : null;
    })
    .filter((err): err is string => err !== null);
};

/**
 * Get severity display info
 */
export const getSeverityInfo = (
  type: string,
): { className: string; label: string } => {
  switch (type) {
    case "Error":
      return { className: "severity-error", label: "[ERROR]" };
    case "Warning":
      return { className: "severity-warning", label: "[WARN]" };
    default:
      return { className: "severity-info", label: "[INFO]" };
  }
};

export const getWatchStatus = (
  isWatching: boolean,
): {
  dotVariantClass: "watching" | "ready";
  text: "WATCHING" | "SYSTEM READY";
} => {
  return isWatching
    ? { dotVariantClass: "watching", text: "WATCHING" }
    : { dotVariantClass: "ready", text: "SYSTEM READY" };
};
