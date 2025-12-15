import React, { useCallback } from "react";
import { Box } from "@mantine/core";
import { LogModal } from "@/shared";
import { DashboardProps } from "../model/types";
import { useDashboardUI } from "../model/useDashboardUI";
import { DashboardHeader } from "./DashboardHeader";
import { LeftSidebar, RightSidebar } from "./DashboardSidebars";
import { ModulesSection } from "./ModulesSection";
import { ViewTabs, ContentArea } from "./DashboardContent";

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  tools,
  filteredFindings,
  moduleLogs,
  projectPath,
  isWatching,
  isAnalyzing,
  selectedTools,
  selectedTypes,
  query,
  onStartWatch,
  onStopWatch,
  onProjectPathChange,
  onOpenProjectModal,
  onToolFilterChange,
  onTypeFilterChange,
  onQueryChange,
  onModuleToggle,
}) => {
  const {
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
  } = useDashboardUI(tools);

  const handleViewLogForModule = useCallback(
    (moduleId: string) => handleViewLog(moduleId, tools, moduleLogs),
    [handleViewLog, tools, moduleLogs],
  );

  const handleModuleToggleForModule = useCallback(
    (moduleId: string, checked: boolean) =>
      handleModuleToggle(moduleId, checked, onModuleToggle),
    [handleModuleToggle, onModuleToggle],
  );

  return (
    <Box className="dashboard">
      {/* Scanlines overlay */}
      <Box className="scanlines" />

      <DashboardHeader
        metrics={metrics}
        projectPath={projectPath}
        isWatching={isWatching}
        isAnalyzing={isAnalyzing}
        onStartWatch={onStartWatch}
        onStopWatch={onStopWatch}
        onToggleSettings={toggleRightSidebar}
      />

      <Box className="layout-container">
        <LeftSidebar
          isOpen={leftSidebarOpen}
          onToggle={toggleLeftSidebar}
          tools={tools}
          selectedTools={selectedTools}
          selectedTypes={selectedTypes}
          query={query}
          onToolFilterChange={onToolFilterChange}
          onTypeFilterChange={onTypeFilterChange}
          onQueryChange={onQueryChange}
        />

        <Box component="main" className="main-content">
          <ModulesSection
            tools={tools}
            enabledModules={enabledModules}
            moduleLogs={moduleLogs}
            isExpanded={modulesExpanded}
            onToggleExpand={toggleModulesExpanded}
            onViewLog={handleViewLogForModule}
          />

          <ViewTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <ContentArea
            activeTab={activeTab}
            filteredFindings={filteredFindings}
          />
        </Box>

        <RightSidebar
          isOpen={rightSidebarOpen}
          onToggle={toggleRightSidebar}
          isWatching={isWatching}
          projectPath={projectPath}
          tools={tools}
          enabledModules={enabledModules}
          onProjectPathChange={onProjectPathChange}
          onOpenProjectModal={onOpenProjectModal}
          onModuleToggle={handleModuleToggleForModule}
        />
      </Box>

      <LogModal
        opened={logModal.opened}
        onClose={closeLogModal}
        title={logModal.title}
        logContent={logModal.content}
      />
    </Box>
  );
};

export default Dashboard;
