import { useMetricsStore } from "../stores/useMetricsStore";
import { ModuleLogs, ModuleConfig } from "@/types/analysis";

export const useMetrics = (
  moduleLogs?: ModuleLogs,
  availableTools?: ModuleConfig[],
) => {
  const { filteredFindings, filters, sortOrder, setFilters, setSortOrder } =
    useMetricsStore();

  // Note: Log parsing and synchronization is now handled by useMetricsSync in Providers.tsx

  return {
    filteredFindings,
    selectedTools: filters.tools,
    setSelectedTools: (tools: string[]) => setFilters({ tools }),
    selectedTypes: filters.types,
    setSelectedTypes: (types: string[]) => setFilters({ types }),
    sortOrder,
    setSortOrder,
    dateRange: filters.dateRange,
    setDateRange: (dateRange: any) => setFilters({ dateRange }),
  };
};
