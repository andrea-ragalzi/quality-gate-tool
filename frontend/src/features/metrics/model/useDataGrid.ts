import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Finding } from "./types";

// ==========================================
// TYPES
// ==========================================

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  key: keyof Finding | null;
  direction: SortDirection;
}

export interface ClusteredFinding extends Finding {
  count?: number;
}

export interface UseDataGridOptions {
  data: Finding[];
}

export interface UseDataGridReturn {
  // State
  sortConfig: SortConfig;
  filters: Record<string, string>;
  clusterView: boolean;
  expandedFinding: Finding | null;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // Data
  processedData: ClusteredFinding[];

  // Actions
  handleSort: (key: keyof Finding) => void;
  handleFilterChange: (key: string, value: string) => void;
  setClusterView: (value: boolean) => void;
  setExpandedFinding: (finding: Finding | null) => void;
}

// ==========================================
// PURE FUNCTIONS (Business Logic)
// ==========================================

/**
 * Filter findings based on filter criteria
 */
export function filterFindings(
  data: Finding[],
  filters: Record<string, string>,
): Finding[] {
  let result = [...data];

  Object.keys(filters).forEach((key) => {
    const filterValue = filters[key].toLowerCase();
    if (filterValue) {
      result = result.filter((item) => {
        const itemValue = String(
          item[key as keyof Finding] || "",
        ).toLowerCase();
        return itemValue.includes(filterValue);
      });
    }
  });

  return result;
}

/**
 * Sort findings based on sort configuration
 */
export function sortFindings(
  data: Finding[],
  sortConfig: SortConfig,
): Finding[] {
  if (!sortConfig.key) return data;

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof Finding];
    const bValue = b[sortConfig.key as keyof Finding];

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const comparison = aValue < bValue ? -1 : 1;
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });
}

/**
 * Cluster findings by type, tool, and message
 */
export function clusterFindings(data: Finding[]): ClusteredFinding[] {
  const groups = new Map<string, ClusteredFinding>();

  data.forEach((item) => {
    const key = `${item.type}-${item.tool}-${item.message}`;

    if (groups.has(key)) {
      const existing = groups.get(key)!;
      existing.count = (existing.count || 1) + 1;
      // Keep the most recent timestamp
      if (item.timestamp > existing.timestamp) {
        existing.timestamp = item.timestamp;
      }
    } else {
      groups.set(key, { ...item, count: 1 });
    }
  });

  return Array.from(groups.values());
}

/**
 * Process findings: filter → sort → cluster
 */
export function processFindings(
  data: Finding[],
  filters: Record<string, string>,
  sortConfig: SortConfig,
  clusterView: boolean,
): ClusteredFinding[] {
  let result = filterFindings(data, filters);
  result = sortFindings(result, sortConfig);

  if (clusterView) {
    return clusterFindings(result);
  }

  return result;
}

/**
 * Calculate next sort direction
 */
export function getNextSortDirection(
  currentKey: keyof Finding | null,
  newKey: keyof Finding,
  currentDirection: SortDirection,
): SortDirection {
  if (currentKey === newKey && currentDirection === "asc") {
    return "desc";
  }
  return "asc";
}

// ==========================================
// HOOK
// ==========================================

export function useDataGrid({ data }: UseDataGridOptions): UseDataGridReturn {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [clusterView, setClusterView] = useState(false);
  const [expandedFinding, setExpandedFinding] = useState<Finding | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!isInput) {
        if (e.key === "j") {
          window.scrollBy({ top: 100, behavior: "smooth" });
        } else if (e.key === "k") {
          window.scrollBy({ top: -100, behavior: "smooth" });
        }
      }

      if (e.key === "Escape") {
        setExpandedFinding(null);
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSort = useCallback((key: keyof Finding) => {
    setSortConfig((prev) => ({
      key,
      direction: getNextSortDirection(prev.key, key, prev.direction),
    }));
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const processedData = useMemo(
    () => processFindings(data, filters, sortConfig, clusterView),
    [data, filters, sortConfig, clusterView],
  );

  return {
    sortConfig,
    filters,
    clusterView,
    expandedFinding,
    searchInputRef,
    processedData,
    handleSort,
    handleFilterChange,
    setClusterView,
    setExpandedFinding,
  };
}
