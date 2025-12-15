import React, { useMemo, useCallback, useState } from "react";
import {
  Box,
  Modal,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import dynamic from "next/dynamic";
import { useMetrics } from "@/features/metrics";
import {
  useAnalysisStore,
  useAnalysisMutations,
  useTools,
} from "@/features/analysis";
import { useCreateProject } from "@/features/projects";
import { Dashboard } from "./ui/Dashboard";
import { MetricsSummary } from "./model/types";
import { calculateMetricsCounts } from "./lib";

const FileSystemBrowser = dynamic(
  () => import("@/features/filesystem").then((mod) => mod.FileSystemBrowser),
  { ssr: false },
);

export const DashboardContainer: React.FC = () => {
  // External data
  const { data: tools = [] } = useTools();
  const {
    filteredFindings,
    selectedTools,
    setSelectedTools,
    selectedTypes,
    setSelectedTypes,
    query,
    setQuery,
  } = useMetrics(tools);
  const { isWatching, isAnalyzing, projectPath, moduleLogs, setProjectPath } =
    useAnalysisStore();
  const { startAnalysis, stopWatch } = useAnalysisMutations();
  const { mutate: createProject } = useCreateProject();

  // Local state for project modal
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [workspacePath, setWorkspacePath] = useState("/home");

  // Analysis handlers
  const handleStartWatch = useCallback(() => {
    if (projectPath) {
      startAnalysis.mutate({
        project_path: projectPath,
        project_id: "default_session",
        mode: "watch",
      });
    } else {
      setProjectModalOpen(true);
    }
  }, [projectPath, startAnalysis]);

  const handleStopWatch = useCallback(() => {
    stopWatch.mutate({
      project_path: projectPath || "",
      project_id: "default_session",
    });
  }, [projectPath, stopWatch]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleModuleToggle = useCallback(
    (_moduleId: string, _checked: boolean) => {
      // Module toggle logic - could be expanded
    },
    [],
  );

  const handleSaveProject = useCallback(() => {
    if (projectPath) {
      createProject({
        path: projectPath,
        name: projectPath.split("/").pop() || projectPath,
      });
      setProjectModalOpen(false);
    }
  }, [projectPath, createProject]);

  // Derived data
  const metrics = useMemo<MetricsSummary>(
    () => calculateMetricsCounts(filteredFindings),
    [filteredFindings],
  );

  return (
    <>
      <Dashboard
        metrics={metrics}
        tools={tools}
        filteredFindings={filteredFindings}
        moduleLogs={moduleLogs}
        projectPath={projectPath}
        isWatching={isWatching}
        isAnalyzing={isAnalyzing}
        selectedTools={selectedTools}
        selectedTypes={selectedTypes}
        query={query}
        onStartWatch={handleStartWatch}
        onStopWatch={handleStopWatch}
        onProjectPathChange={setProjectPath}
        onOpenProjectModal={() => setProjectModalOpen(true)}
        onToolFilterChange={setSelectedTools}
        onTypeFilterChange={setSelectedTypes}
        onQueryChange={setQuery}
        onModuleToggle={handleModuleToggle}
      />

      {/* Project Selection Modal */}
      <Modal
        opened={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        fullScreen
        withCloseButton={false}
        title=""
        className="project-modal"
      >
        <Box className="project-modal-content">
          <Box component="header" className="project-modal-header">
            <Title order={2} className="project-modal-title">
              SELECT PROJECT
            </Title>
            <UnstyledButton
              className="btn"
              onClick={() => setProjectModalOpen(false)}
              type="button"
            >
              CLOSE
            </UnstyledButton>
          </Box>

          <Box className="project-modal-form">
            <Box className="filter-group">
              <TextInput
                label="WORKSPACE PATH"
                classNames={{ label: "filter-label", input: "input" }}
                value={workspacePath}
                onChange={(e) => setWorkspacePath(e.currentTarget.value)}
              />
            </Box>
          </Box>

          <Box className="project-modal-browser">
            <FileSystemBrowser
              initialPath={workspacePath}
              onSelect={setProjectPath}
              onClose={() => setProjectModalOpen(false)}
            />
          </Box>

          <Box component="footer" className="project-modal-footer">
            <UnstyledButton
              className="btn"
              onClick={handleSaveProject}
              type="button"
            >
              SAVE & USE
            </UnstyledButton>
            <UnstyledButton
              className="btn btn-danger"
              onClick={() => setProjectModalOpen(false)}
              type="button"
            >
              CANCEL
            </UnstyledButton>
          </Box>

          {!projectPath ? (
            <Text c="dimmed" size="sm" mt="sm">
              Select a project path to enable saving.
            </Text>
          ) : null}
        </Box>
      </Modal>
    </>
  );
};

export default DashboardContainer;
