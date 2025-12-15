import { useState, useCallback } from "react";
import { Tool, ModuleLogData, ViewTab } from "./types";

export interface UseDashboardUIReturn {
  // Layout state
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  modulesExpanded: boolean;
  activeTab: ViewTab;
  enabledModules: string[];

  // Modal state
  logModal: { opened: boolean; title: string; content: string };

  // Actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleModulesExpanded: () => void;
  setActiveTab: (tab: ViewTab) => void;
  handleModuleToggle: (
    moduleId: string,
    checked: boolean,
    onModuleToggle: (id: string, checked: boolean) => void,
  ) => void;
  handleViewLog: (
    moduleId: string,
    tools: Tool[],
    moduleLogs: Record<string, ModuleLogData>,
  ) => void;
  closeLogModal: () => void;
}

export function useDashboardUI(tools: Tool[]): UseDashboardUIReturn {
  // Layout state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [modulesExpanded, setModulesExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>("TABLE");
  const [enabledModules, setEnabledModules] = useState<string[]>(() =>
    tools.map((t) => t.id),
  );

  // Modal state
  const [logModal, setLogModal] = useState({
    opened: false,
    title: "",
    content: "",
  });

  // Actions
  const toggleLeftSidebar = useCallback(() => {
    setLeftSidebarOpen((prev) => !prev);
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setRightSidebarOpen((prev) => !prev);
  }, []);

  const toggleModulesExpanded = useCallback(() => {
    setModulesExpanded((prev) => !prev);
  }, []);

  const handleModuleToggle = useCallback(
    (
      moduleId: string,
      checked: boolean,
      onModuleToggle: (id: string, checked: boolean) => void,
    ) => {
      setEnabledModules((prev) =>
        checked ? [...prev, moduleId] : prev.filter((id) => id !== moduleId),
      );
      onModuleToggle(moduleId, checked);
    },
    [],
  );

  const handleViewLog = useCallback(
    (
      moduleId: string,
      tools: Tool[],
      moduleLogs: Record<string, ModuleLogData>,
    ) => {
      const toolItem = tools.find((t) => t.id === moduleId);
      const logs = moduleLogs[moduleId]?.logs || [];
      setLogModal({
        opened: true,
        title: `${toolItem?.title || moduleId} Logs`,
        content: logs.join("\n"),
      });
    },
    [],
  );

  const closeLogModal = useCallback(() => {
    setLogModal((prev) => ({ ...prev, opened: false }));
  }, []);

  return {
    leftSidebarOpen,
    rightSidebarOpen,
    modulesExpanded,
    activeTab,
    enabledModules,
    logModal,
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleModulesExpanded,
    setActiveTab,
    handleModuleToggle,
    handleViewLog,
    closeLogModal,
  };
}
