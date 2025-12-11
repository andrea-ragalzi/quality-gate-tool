"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AppShell,
  Title,
  Text,
  Button,
  TextInput,
  Stack,
  Group,
  Modal,
  Checkbox,
  Select,
} from "@mantine/core";
import {
  IconFolder,
  IconPlayerPlay,
  IconPlayerStop,
  IconSettings,
  IconHistory,
  IconChartBar,
} from "@tabler/icons-react";
import ModuleCard from "@/components/ModuleCard";
import LogModal from "@/components/LogModal";
import LoadingModal from "@/components/LoadingModal";
import MatrixIntro from "@/components/MatrixIntro";
import { useUIStore } from "@/stores/useUIStore";
import { useAnalysisStore } from "@/features/analysis/stores/useAnalysisStore";
import { useAnalysisMutations } from "@/features/analysis/hooks/useAnalysisMutations";
import {
  useProjects,
  useCreateProject,
} from "@/features/projects/hooks/useProjects";
import { useTools } from "@/features/analysis/hooks/useTools";

const FileSystem3D = dynamic(() => import("@/components/FileSystem3D"), {
  ssr: false,
});

export default function Home() {
  // Tools Data (TanStack Query)
  const { data: tools = [], isLoading: toolsLoading } = useTools();

  // Matrix Intro Logic (Zustand)
  const { isMatrixActive, matrixPhase, setMatrixPhase, completeMatrixIntro } =
    useUIStore();

  // Analysis Store (Zustand)
  const {
    moduleLogs,
    overallStatus,
    isAnalyzing,
    isWatching,
    lastSystemMessage,
    projectPath,
    setProjectPath,
    // connect, // Moved to ConnectionManager
    // disconnect // Moved to ConnectionManager
  } = useAnalysisStore();

  // Analysis Mutations (TanStack Query)
  const { startAnalysis, stopWatch } = useAnalysisMutations();

  // Project Data (TanStack Query)
  const { data: projects = [] } = useProjects();
  const { mutate: createProject } = useCreateProject();

  // Connect WebSocket on mount - REMOVED (Handled globally)
  /*
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);
  */

  // Force stop if no project selected on mount (Safety)
  useEffect(() => {
    if (!projectPath && !isWatching) {
      stopWatch.mutate({ project_path: "", project_id: "default_session" });
    }
  }, []);

  // Local UI State
  const [timestamp, setTimestamp] = useState("");
  const [workspacePath, setWorkspacePath] = useState("/home");
  const [selectedDirectory, setSelectedDirectory] = useState<string>("");
  const [numColumns, setNumColumns] = useState(1);

  // Modals
  const [modalOpened, setModalOpened] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [projectModalOpened, setProjectModalOpened] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Initialize selected tools when tools data is loaded
  useEffect(() => {
    if (tools && tools.length > 0 && selectedTools.length === 0) {
      setSelectedTools(tools.map((m) => m.id));
    }
  }, [tools]);

  // Responsive Columns Logic
  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1400) setNumColumns(4);
      else if (window.innerWidth >= 768) setNumColumns(2);
      else setNumColumns(1);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Distribute modules into columns
  const activeModules = tools.filter((m) => selectedTools.includes(m.id));
  const columns = Array.from({ length: numColumns }, (_, i) =>
    activeModules.filter((_, index) => index % numColumns === i),
  );

  // Handlers
  const handleStartWatch = async () => {
    if (!projectPath.trim()) return; // Prevent start if no project selected
    if (isAnalyzing || isWatching) return;
    startAnalysis.mutate({
      project_path: projectPath,
      mode: "watch",
      selected_tools: selectedTools,
      project_id: "default_session",
    });
  };

  const handleStopWatch = async () => {
    if (stopWatch.isPending) return;
    stopWatch.mutate({
      project_path: projectPath,
      project_id: "default_session",
    });
  };

  const openProjectBrowser = () => {
    setProjectModalOpened(true);
  };

  // View Full Log
  const viewFullLog = (moduleId: string) => {
    const mod = tools.find((m) => m.id === moduleId);
    const log = moduleLogs[moduleId];

    if (mod && log) {
      setModalTitle(`SYSTEM_LOG // ${mod.title.toUpperCase()}`);
      setModalContent(log.fullLog);
      setModalOpened(true);
    }
  };

  const getStatusText = () => {
    if (isAnalyzing) return "ANALYSIS IN PROGRESS...";
    if (isWatching) return "LIVE WATCH ACTIVE";

    switch (overallStatus) {
      case "WATCHING":
        return "LIVE WATCH MODE ACTIVE...";
      case "RUNNING":
        return "ANALYSIS IN PROGRESS...";
      case "STARTING":
        return "INITIALIZING...";
      case "SUCCESS":
        return "SCAN COMPLETE: SUCCESS";
      case "FAILURE":
        return "SCAN COMPLETE: FAILURE";
      case "ERROR":
        return "ERROR OCCURRED";
      default:
        return "SYSTEM READY";
    }
  };

  // Effects
  useEffect(() => {
    setTimestamp(new Date().toLocaleString());
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {isMatrixActive && (
        <MatrixIntro
          phase={matrixPhase}
          onGlitchStart={() => setMatrixPhase("glitch")}
          onCrackStart={() => setMatrixPhase("crack")}
          onShatterStart={() => setMatrixPhase("shatter")}
          onShatterComplete={completeMatrixIntro}
          onSkip={completeMatrixIntro}
        />
      )}
      <AppShell
        aside={{
          width: { base: 250, md: 300, lg: 320, xl: 350 },
          breakpoint: "sm",
          collapsed: { mobile: true },
        }}
        style={{
          zIndex: 1000,
          transform:
            matrixPhase === "complete" || !isMatrixActive
              ? "none"
              : matrixPhase === "shatter"
                ? "perspective(2000px) translateZ(0) rotateX(0deg)"
                : "perspective(2000px) translateZ(-10000px) rotateX(30deg)",
          opacity:
            matrixPhase === "shatter" ||
            matrixPhase === "complete" ||
            !isMatrixActive
              ? 1
              : 0,
          transition:
            matrixPhase === "shatter"
              ? "transform 3s cubic-bezier(0.16, 1, 0.3, 1), opacity 2s ease-in"
              : "none",
          transformOrigin: "center center",
        }}
        classNames={{
          main: "app-shell__main",
          aside: "app-shell__aside",
        }}
      >
        {/* Sidebar */}
        <AppShell.Aside p="md">
          <Stack gap="xl" h="100%">
            <Stack gap="md">
              <Title order={3} className="dashboard__panel-title">
                CONTROL PANEL
              </Title>
              <Text
                size="xs"
                className="dashboard__panel-text"
                suppressHydrationWarning
              >
                {timestamp || "Loading..."}
              </Text>
            </Stack>

            {/* Status Box */}
            <div className="dashboard__status-box">
              <Text size="md" className="dashboard__status-box--text">
                {getStatusText()}
              </Text>
              {lastSystemMessage && (
                <Text
                  size="xs"
                  c="dimmed"
                  mt={4}
                  style={{ fontFamily: "monospace", opacity: 0.7 }}
                >
                  {">"} {lastSystemMessage}
                </Text>
              )}
            </div>

            {/* Project Path */}
            <Stack gap="xs">
              <Text
                size="xs"
                className="dashboard__panel-text"
                fw={600}
                tt="uppercase"
              >
                📁 Project Path
              </Text>
              <TextInput
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                disabled={isWatching}
                placeholder="/projects/quality-gate-test-project"
                size="sm"
                classNames={{ input: "dashboard__input" }}
              />
              <Button
                onClick={openProjectBrowser}
                disabled={isWatching}
                leftSection={<IconFolder size={16} />}
                size="sm"
                fullWidth
              >
                Browse
              </Button>
              <Button
                onClick={() => setSettingsOpened(true)}
                disabled={isWatching}
                leftSection={<IconSettings size={16} />}
                size="sm"
                variant="outline"
                fullWidth
                color="gray"
              >
                Settings
              </Button>
              <Button
                component={Link}
                href="/metrics"
                leftSection={<IconChartBar size={16} />}
                size="sm"
                variant="outline"
                fullWidth
                color="green"
              >
                Metrics Dashboard
              </Button>

              {/* Recent Projects */}
              {projects.length > 0 && (
                <Select
                  label={
                    <Group gap={5}>
                      <IconHistory size={14} />
                      <Text size="xs" fw={600} tt="uppercase">
                        Recent Projects
                      </Text>
                    </Group>
                  }
                  placeholder="Select a recent project"
                  data={projects.map((p) => ({ value: p.path, label: p.name }))}
                  onChange={(value) => {
                    if (value) {
                      setProjectPath(value);
                      setSelectedDirectory(value.split("/").pop() || "");
                    }
                  }}
                  disabled={isWatching}
                  size="sm"
                  classNames={{ input: "dashboard__input" }}
                />
              )}

              {selectedDirectory && (
                <Text size="xs" className="text-matrix">
                  Selected: {selectedDirectory}
                </Text>
              )}
            </Stack>

            {/* Watch Controls */}
            <Stack gap="md" style={{ marginTop: "auto" }}>
              {!isWatching ? (
                <Button
                  onClick={handleStartWatch}
                  disabled={!projectPath?.trim() || isAnalyzing}
                  loading={startAnalysis.isPending}
                  size="lg"
                  fullWidth
                  color="green"
                  leftSection={<IconPlayerPlay size={20} />}
                >
                  START WATCH
                </Button>
              ) : (
                <Button
                  onClick={handleStopWatch}
                  loading={stopWatch.isPending}
                  size="lg"
                  fullWidth
                  color="red"
                  leftSection={<IconPlayerStop size={20} />}
                >
                  STOP WATCH
                </Button>
              )}

              <Text
                size="xs"
                className="text-matrix"
                ta="center"
                style={{ opacity: 0.7 }}
              >
                {isWatching ? "👁️  Monitoring filesystem..." : "💤 Idle"}
              </Text>
            </Stack>
          </Stack>
        </AppShell.Aside>

        {/* Main Content */}
        <AppShell.Main>
          <div className="dashboard__grid">
            <Stack gap="xl">
              {/* Header */}
              <Stack align="center" gap="sm">
                <Title
                  order={1}
                  className="dashboard__title glitch"
                  size="2.5rem"
                  fw={900}
                  ta="center"
                  data-text="Quality Gate Terminal"
                >
                  Quality Gate Terminal
                </Title>
              </Stack>

              <div className="dashboard__status-box">
                <Text size="xl" fw={900} tt="uppercase" ta="center" c="#b8860b">
                  [STATUS: {getStatusText()}]
                </Text>
              </div>

              {/* Active Modules Section */}
              <div>
                {toolsLoading ? (
                  <Text c="dimmed" ta="center" size="sm" mt="xl">
                    LOADING MODULES...
                  </Text>
                ) : (
                  <div className="modules-grid">
                    {columns.map((colModules, colIndex) => (
                      <div key={colIndex} className="modules-column">
                        {colModules.map((module) => (
                          <ModuleCard
                            key={module.id}
                            moduleId={module.id}
                            title={module.title}
                            subtitle={module.subtitle}
                            icon={module.icon}
                            status={moduleLogs[module.id]?.status || "PENDING"}
                            logs={moduleLogs[module.id]?.logs || []}
                            summary={moduleLogs[module.id]?.summary}
                            metrics={moduleLogs[module.id]?.metrics}
                            onViewLog={() => viewFullLog(module.id)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Stack>
          </div>
        </AppShell.Main>

        {/* Log Modal */}
        <LogModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title={modalTitle}
          logContent={modalContent}
        />

        {/* Project Selection Modal */}
        <Modal
          opened={projectModalOpened}
          onClose={() => setProjectModalOpened(false)}
          fullScreen
          withCloseButton={false}
          styles={{
            body: { padding: 0, background: "black", height: "100vh" },
          }}
        >
          <FileSystem3D
            initialPath={workspacePath}
            onSelect={(path: string) => {
              setProjectPath(path);
              const name = path.split("/").pop() || "Untitled Project";
              setSelectedDirectory(name);
              createProject({ name, path });
              setProjectModalOpened(false);
            }}
            onClose={() => setProjectModalOpened(false)}
          />
        </Modal>

        {/* Settings Modal */}
        <Modal
          opened={settingsOpened}
          onClose={() => setSettingsOpened(false)}
          title="SYSTEM CONFIGURATION"
          size="lg"
          centered
          styles={{
            header: {
              background: "#000",
              color: "#00ff41",
              borderBottom: "1px solid #00ff41",
            },
            body: { background: "#000", color: "#00ff41", padding: "20px" },
            title: { fontFamily: "monospace", fontWeight: 700 },
          }}
        >
          <Stack>
            <Text size="sm" c="dimmed" mb="sm">
              Select active analysis modules:
            </Text>

            <Stack gap="xs">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                Modules
              </Text>
              {tools.map((module) => (
                <Checkbox
                  key={module.id}
                  label={module.title}
                  description={module.subtitle}
                  checked={selectedTools.includes(module.id)}
                  onChange={(event) => {
                    if (event.currentTarget.checked) {
                      setSelectedTools([...selectedTools, module.id]);
                    } else {
                      setSelectedTools(
                        selectedTools.filter((id) => id !== module.id),
                      );
                    }
                  }}
                  color="green"
                  styles={{
                    label: { color: "#00ff41", fontFamily: "monospace" },
                    description: { color: "#00aa2c" },
                  }}
                />
              ))}
            </Stack>

            <Group justify="flex-end" mt="xl">
              <Button
                variant="outline"
                color="green"
                onClick={() => setSettingsOpened(false)}
              >
                SAVE CONFIGURATION
              </Button>
            </Group>
          </Stack>
        </Modal>

        <LoadingModal
          opened={startAnalysis.isPending}
          message="Starting watch mode..."
        />
      </AppShell>
    </>
  );
}
