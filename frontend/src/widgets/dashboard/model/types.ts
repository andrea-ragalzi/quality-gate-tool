import { Finding } from "@/features/metrics";

// ==========================================
// DASHBOARD TYPES
// ==========================================

export interface MetricsSummary {
  Error: number;
  Warning: number;
  Info: number;
  Complexity: number;
}

export interface Tool {
  id: string;
  title: string;
}

export interface ModuleLogData {
  status?: string;
  logs?: string[];
  summary?: string;
}

export type ViewTab = "TABLE" | "JSON" | "YAML" | "TOON";

// ==========================================
// COMPONENT PROPS
// ==========================================

export interface DashboardProps {
  // Data
  metrics: MetricsSummary;
  tools: Tool[];
  filteredFindings: Finding[];
  moduleLogs: Record<string, ModuleLogData>;

  // State
  projectPath: string;
  isWatching: boolean;
  isAnalyzing: boolean;

  // Filters
  selectedTools: string[];
  selectedTypes: string[];
  query: string;

  // Actions
  onStartWatch: () => void;
  onStopWatch: () => void;
  onProjectPathChange: (path: string) => void;
  onOpenProjectModal: () => void;
  onToolFilterChange: (tools: string[]) => void;
  onTypeFilterChange: (types: string[]) => void;
  onQueryChange: (query: string) => void;
  onModuleToggle: (moduleId: string, checked: boolean) => void;
}

export interface DashboardHeaderProps {
  metrics: MetricsSummary;
  projectPath: string;
  isWatching: boolean;
  isAnalyzing: boolean;
  onStartWatch: () => void;
  onStopWatch: () => void;
  onToggleSettings: () => void;
}

export interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  tools: Tool[];
  selectedTools: string[];
  selectedTypes: string[];
  query: string;
  onToolFilterChange: (tools: string[]) => void;
  onTypeFilterChange: (types: string[]) => void;
  onQueryChange: (query: string) => void;
}

export interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isWatching: boolean;
  projectPath: string;
  tools: Tool[];
  enabledModules: string[];
  onProjectPathChange: (path: string) => void;
  onOpenProjectModal: () => void;
  onModuleToggle: (moduleId: string, checked: boolean) => void;
}

export interface ModuleCardProps {
  module: Tool;
  logData: ModuleLogData;
  onClick: () => void;
}

export interface FindingsTableProps {
  findings: Finding[];
}

export interface ModulesSectionProps {
  tools: Tool[];
  enabledModules: string[];
  moduleLogs: Record<string, ModuleLogData>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewLog: (moduleId: string) => void;
}

export interface ContentAreaProps {
  activeTab: ViewTab;
  filteredFindings: Finding[];
}

export interface ViewTabsProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}
