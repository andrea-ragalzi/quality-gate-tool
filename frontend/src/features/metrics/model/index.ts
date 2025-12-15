// features/metrics/model - Public API
export { useMetrics } from "./useMetrics";
// Note: useMetricsSync moved to app/_providers (orchestrates multiple features)
export { useMetricsStore } from "./useMetricsStore";
export type { Finding } from "./types";

// DataGrid logic (CCN refactor)
export {
  useDataGrid,
  filterFindings,
  sortFindings,
  clusterFindings,
  processFindings,
  getNextSortDirection,
} from "./useDataGrid";
export type {
  SortDirection,
  SortConfig,
  ClusteredFinding,
  UseDataGridOptions,
  UseDataGridReturn,
} from "./useDataGrid";

// Metrics stats (CCN refactor)
export {
  useMetricsStats,
  countByType,
  getLatestTimestamp,
  calculateTrendData,
  calculateMetricsStats,
} from "./useMetricsStats";
export type { MetricsStats, UseMetricsStatsOptions } from "./useMetricsStats";
