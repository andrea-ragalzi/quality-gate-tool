import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../page";
import { Box, MantineProvider } from "@mantine/core";

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mocks
vi.mock("@/features/analysis", () => ({
  useTools: () => ({ data: [] }),
  useAnalysisStore: () => mockAnalysisState,
  useAnalysisMutations: () => ({
    startAnalysis: { isPending: false, mutate: vi.fn() },
    stopWatch: { isPending: false, mutate: vi.fn() },
  }),
}));
vi.mock("@/shared", () => ({
  useUIStore: () => ({
    isMatrixActive: false,
    matrixPhase: "complete",
    setMatrixPhase: vi.fn(),
    completeMatrixIntro: vi.fn(),
  }),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  MatrixEditor: ({ value }: { value: string }) => (
    <Box data-testid="matrix-editor">{value}</Box>
  ),
  LogModal: () => <Box>MockLogModal</Box>,
}));
// Mutable mock state
let mockAnalysisState = {
  moduleLogs: {},
  overallStatus: "IDLE",
  isAnalyzing: false,
  isWatching: false,
  lastSystemMessage: "",
  projectPath: "",
  setProjectPath: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  _hasHydrated: true,
};

vi.mock("@/features/projects", () => ({
  useProjects: () => ({ data: [] }),
  useCreateProject: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/features/metrics", () => ({
  useMetrics: () => ({
    filteredFindings: [],
    selectedTools: [],
    setSelectedTools: vi.fn(),
    selectedTypes: [],
    setSelectedTypes: vi.fn(),
    query: "",
    setQuery: vi.fn(),
    sortOrder: "newest",
    setSortOrder: vi.fn(),
    dateRange: { start: null, end: null },
    setDateRange: vi.fn(),
  }),
  MetricsFilterSidebar: () => <Box>MockMetricsFilterSidebar</Box>,
  DataGrid: () => <Box>MockDataGrid</Box>,
  serializeJSON: () => "{}",
  serializeYAML: () => "",
  serializeTOON: () => "",
}));

// Mock next/dynamic
vi.mock("next/dynamic", () => ({
  default: () =>
    function MockComponent() {
      return <Box>MockFileSystemBrowser</Box>;
    },
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <Box>{children}</Box>
  ),
}));

describe("P-UNIT-003: Guard: Button Status Based on State", () => {
  const testCases = [
    {
      description: "No project, Not analyzing -> Disabled",
      projectPath: "",
      isAnalyzing: false,
      expectedDisabled: true, // Changed: button should be disabled when no project path is set
    },
    {
      description: "Has project, Not analyzing -> Enabled",
      projectPath: "/tmp/test",
      isAnalyzing: false,
      expectedDisabled: false,
    },
    {
      description: "Has project, Analyzing -> Disabled",
      projectPath: "/tmp/test",
      isAnalyzing: true,
      expectedDisabled: true,
    },
    {
      description: "No project, Analyzing -> Disabled",
      projectPath: "",
      isAnalyzing: true,
      expectedDisabled: true,
    },
  ];

  it.each(testCases)(
    "$description",
    ({ projectPath, isAnalyzing, expectedDisabled }) => {
      // Update mock state
      mockAnalysisState = {
        ...mockAnalysisState,
        isAnalyzing,
        projectPath,
      };

      render(
        <MantineProvider>
          <Home />
        </MantineProvider>,
      );

      // Input change is not strictly necessary if we pre-seed the state,
      // but we keep it to simulate user interaction if the test relied on it.
      // However, since our mock doesn't auto-update on setProjectPath, pre-seeding is key.
      if (projectPath) {
        const input = screen.getByPlaceholderText("/path/to/project");
        fireEvent.change(input, { target: { value: projectPath } });
      }

      const startButton = screen.getByRole("button", { name: /START WATCH/i });
      if (expectedDisabled) {
        expect(startButton).toBeDisabled();
      } else {
        expect(startButton).not.toBeDisabled();
      }
    },
  );
});
