import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../page";
import { MantineProvider } from "@mantine/core";

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
vi.mock("@/features/analysis/hooks/useTools", () => ({
  useTools: () => ({ data: [] }),
}));
vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({
    isMatrixActive: false,
    matrixPhase: "complete",
    setMatrixPhase: vi.fn(),
    completeMatrixIntro: vi.fn(),
  }),
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
};

vi.mock("@/features/analysis/stores/useAnalysisStore", () => ({
  useAnalysisStore: () => mockAnalysisState,
}));

vi.mock("@/features/analysis/hooks/useAnalysisMutations", () => ({
  useAnalysisMutations: () => ({
    startAnalysis: { isPending: false, mutate: vi.fn() },
    stopWatch: { isPending: false, mutate: vi.fn() },
  }),
}));
vi.mock("@/features/projects/hooks/useProjects", () => ({
  useProjects: () => ({ data: [] }),
  useCreateProject: () => ({ mutate: vi.fn() }),
}));

// Mock next/dynamic
vi.mock("next/dynamic", () => ({
  default: () =>
    function MockComponent() {
      return <div>MockFileSystem3D</div>;
    },
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("P-UNIT-003: Guard: Button Status Based on State", () => {
  const testCases = [
    {
      description: "No project, Not analyzing -> Disabled",
      projectPath: "",
      isAnalyzing: false,
      expectedDisabled: true,
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
        const input = screen.getByPlaceholderText(
          "/projects/quality-gate-test-project",
        );
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
