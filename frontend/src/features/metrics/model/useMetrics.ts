import { useMetricsStore } from "./useMetricsStore";
import { ModuleConfig } from "@/entities/analysis";

export const useMetrics = (availableTools?: ModuleConfig[]) => {
  const { filteredFindings, filters, sortOrder, setFilters, setSortOrder } =
    useMetricsStore();

  // Note: Log parsing and synchronization is now handled by useMetricsSync in Providers.tsx

  return {
    filteredFindings,
    selectedTools: filters.tools,
    setSelectedTools: (tools: string[]) => setFilters({ tools }),
    selectedTypes: filters.types,
    setSelectedTypes: (types: string[]) => setFilters({ types }),
    query: filters.query,
    setQuery: (query: string) => setFilters({ query }),
    sortOrder,
    setSortOrder,
    dateRange: filters.dateRange,
    setDateRange: (dateRange: any) => setFilters({ dateRange }),
  };
};
