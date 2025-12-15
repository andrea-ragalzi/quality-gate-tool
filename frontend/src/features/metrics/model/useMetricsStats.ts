import { useMemo } from "react";
import { Finding } from "./types";

// ==========================================
// TYPES
// ==========================================

export interface MetricsStats {
  totalErrors: number;
  totalWarnings: number;
  lastFinding: number | null;
  trendData: number[];
}

// ==========================================
// PURE FUNCTIONS
// ==========================================

/**
 * Count findings by type (case-insensitive)
 */
export function countByType(findings: Finding[], type: string): number {
  return findings.filter((f) => f.type.toLowerCase() === type.toLowerCase())
    .length;
}

/**
 * Get latest timestamp from findings
 */
export function getLatestTimestamp(findings: Finding[]): number | null {
  if (findings.length === 0) return null;
  return Math.max(...findings.map((f) => f.timestamp));
}

/**
 * Calculate trend data for sparkline visualization
 * Distributes findings into time buckets
 */
export function calculateTrendData(
  findings: Finding[],
  buckets: number = 20,
): number[] {
  if (findings.length === 0) return [];

  const timestamps = findings.map((f) => f.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);

  if (maxTime <= minTime) return [];

  const step = (maxTime - minTime) / buckets;
  const trendData = new Array(buckets).fill(0);

  timestamps.forEach((t) => {
    const bucketIndex = Math.min(Math.floor((t - minTime) / step), buckets - 1);
    trendData[bucketIndex]++;
  });

  return trendData;
}

/**
 * Calculate all metrics stats from findings
 */
export function calculateMetricsStats(findings: Finding[]): MetricsStats {
  return {
    totalErrors: countByType(findings, "error"),
    totalWarnings: countByType(findings, "warning"),
    lastFinding: getLatestTimestamp(findings),
    trendData: calculateTrendData(findings),
  };
}

// ==========================================
// HOOK
// ==========================================

export interface UseMetricsStatsOptions {
  findings: Finding[];
}

export function useMetricsStats({
  findings,
}: UseMetricsStatsOptions): MetricsStats {
  return useMemo(() => calculateMetricsStats(findings), [findings]);
}
