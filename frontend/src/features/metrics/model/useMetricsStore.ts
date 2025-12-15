import { create } from "zustand";
import { Finding, SortOrder, DateRange, METRIC_TYPES } from "./types";

interface MetricsState {
  allFindings: Finding[];
  filteredFindings: Finding[];
  availableTools: string[]; // Dynamic list of tools
  filters: {
    tools: string[];
    types: string[];
    dateRange: DateRange;
    query: string;
  };
  sortOrder: SortOrder;

  // Actions
  setFindings: (findings: Finding[]) => void;
  setAvailableTools: (tools: string[]) => void;
  setFilters: (filters: Partial<MetricsState["filters"]>) => void;
  setSortOrder: (order: SortOrder) => void;
  resetFilters: () => void;
}

// Helper to apply filters and sort
const processFindings = (
  findings: Finding[],
  filters: MetricsState["filters"],
  sortOrder: SortOrder,
): Finding[] => {
  let result = [...findings];

  // Filter by Tool
  // If filters.tools is empty, we assume NO tools selected (or maybe ALL? Logic depends on UI).
  // In the previous implementation, it checked if included.
  // If we want "empty means all", we should change this.
  // But usually MultiSelect "empty" means "nothing selected".
  // However, the default was "All Tools Selected".
  if (filters.tools.length > 0) {
    result = result.filter((f) => filters.tools.includes(f.tool));
  } else {
    // If no tools selected, show nothing? Or show all?
    // Let's assume show nothing to be consistent with "filter".
    // But wait, if I uncheck everything, I expect to see nothing.
    // So this logic is correct.
  }

  // Filter by Type
  if (filters.types.length > 0) {
    result = result.filter((f) => filters.types.includes(f.type));
  }

  // Filter by free-text query (filepath/message)
  const q = filters.query.trim().toLowerCase();
  if (q) {
    result = result.filter((f) => {
      const haystack = `${f.filepath} ${f.message}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  // Filter by Date
  if (filters.dateRange.start && filters.dateRange.end) {
    const start = new Date(filters.dateRange.start).getTime();
    const end = new Date(filters.dateRange.end).getTime();
    result = result.filter((f) => f.timestamp >= start && f.timestamp <= end);
  }

  // Sort
  result.sort((a, b) => {
    switch (sortOrder) {
      case "type_desc":
        return METRIC_TYPES.indexOf(a.type) - METRIC_TYPES.indexOf(b.type);
      case "type_asc":
        return METRIC_TYPES.indexOf(b.type) - METRIC_TYPES.indexOf(a.type);
      case "newest":
        return b.timestamp - a.timestamp;
      case "oldest":
        return a.timestamp - b.timestamp;
      default:
        return 0;
    }
  });

  return result;
};

export const useMetricsStore = create<MetricsState>((set, get) => ({
  allFindings: [],
  filteredFindings: [],
  availableTools: [],
  filters: {
    tools: [], // Initially empty, will be populated when tools are fetched
    types: [...METRIC_TYPES],
    dateRange: { start: null, end: null },
    query: "",
  },
  sortOrder: "type_desc",

  setFindings: (findings) => {
    const { filters, sortOrder } = get();
    set({
      allFindings: findings,
      filteredFindings: processFindings(findings, filters, sortOrder),
    });
  },

  setAvailableTools: (tools) => {
    const {
      availableTools: currentTools,
      filters,
      allFindings,
      sortOrder,
    } = get();

    // Prevent unnecessary updates if tools haven't changed
    if (JSON.stringify(tools) === JSON.stringify(currentTools)) {
      return;
    }

    // If tools filter is empty (initial state), select all new tools
    const newToolsFilter = filters.tools.length === 0 ? tools : filters.tools;

    const newFilters = { ...filters, tools: newToolsFilter };

    set({
      availableTools: tools,
      filters: newFilters,
      filteredFindings: processFindings(allFindings, newFilters, sortOrder),
    });
  },

  setFilters: (newFilters) => {
    const { allFindings, filters, sortOrder } = get();
    const updatedFilters = { ...filters, ...newFilters };
    set({
      filters: updatedFilters,
      filteredFindings: processFindings(allFindings, updatedFilters, sortOrder),
    });
  },

  setSortOrder: (sortOrder) => {
    const { allFindings, filters } = get();
    set({
      sortOrder,
      filteredFindings: processFindings(allFindings, filters, sortOrder),
    });
  },

  resetFilters: () => {
    const { availableTools } = get();
    const defaultFilters = {
      tools: [...availableTools],
      types: [...METRIC_TYPES],
      dateRange: { start: null, end: null },
      query: "",
    };
    const { allFindings, sortOrder } = get();
    set({
      filters: defaultFilters,
      filteredFindings: processFindings(allFindings, defaultFilters, sortOrder),
    });
  },
}));
