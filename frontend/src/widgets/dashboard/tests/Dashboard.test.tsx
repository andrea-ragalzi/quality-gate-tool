import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { Dashboard } from "../ui/Dashboard";
import { Box, MantineProvider } from "@mantine/core";

// Mock resize observer
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock("@/shared", () => ({
  MatrixEditor: ({ value }: { value: string }) => (
    <Box data-testid="matrix-editor">{value}</Box>
  ),
  LogModal: ({ opened }: { opened: boolean }) =>
    opened ? <Box data-testid="log-modal">Log Modal</Box> : null,
}));

vi.mock("@/features/metrics", () => ({
  serializeJSON: vi.fn(() => "{}"),
  serializeYAML: vi.fn(() => ""),
  serializeTOON: vi.fn(() => ""),
}));

const defaultProps = {
  metrics: { Error: 2, Warning: 1, Info: 0, Complexity: 5.5 },
  tools: [
    { id: "eslint", title: "ESLint" },
    { id: "tsc", title: "TypeScript" },
  ],
  filteredFindings: [
    {
      id: "1",
      type: "Error" as const,
      tool: "ESLint",
      message: "Error 1",
      filepath: "/test.ts",
      line: 10,
      timestamp: 1234567890,
    },
    {
      id: "2",
      type: "Error" as const,
      tool: "ESLint",
      message: "Error 2",
      filepath: "/test2.ts",
      line: 20,
      timestamp: 1234567891,
    },
    {
      id: "3",
      type: "Warning" as const,
      tool: "TypeScript",
      message: "Warning 1",
      filepath: "/test3.ts",
      line: 30,
      timestamp: 1234567892,
    },
  ],
  moduleLogs: {},
  projectPath: "/test/project",
  isWatching: false,
  isAnalyzing: false,
  selectedTools: [],
  selectedTypes: [],
  query: "",
  onStartWatch: vi.fn(),
  onStopWatch: vi.fn(),
  onProjectPathChange: vi.fn(),
  onOpenProjectModal: vi.fn(),
  onToolFilterChange: vi.fn(),
  onTypeFilterChange: vi.fn(),
  onQueryChange: vi.fn(),
  onModuleToggle: vi.fn(),
};

describe("Dashboard", () => {
  it("renders the main title", () => {
    render(
      <MantineProvider>
        <Dashboard {...defaultProps} />
      </MantineProvider>,
    );
    expect(screen.getByText("Quality Gate")).toBeInTheDocument();
    expect(screen.getByText("TERMINAL v2.0")).toBeInTheDocument();
  });

  it("renders metrics summary", () => {
    render(
      <MantineProvider>
        <Dashboard {...defaultProps} />
      </MantineProvider>,
    );

    expect(screen.getByText("ERRORS")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("WARNINGS")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders view tabs", () => {
    render(
      <MantineProvider>
        <Dashboard {...defaultProps} />
      </MantineProvider>,
    );
    expect(screen.getByText("TABLE")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.getByText("YAML")).toBeInTheDocument();
    expect(screen.getByText("TOON")).toBeInTheDocument();
  });

  it("renders the findings table by default", () => {
    render(
      <MantineProvider>
        <Dashboard {...defaultProps} />
      </MantineProvider>,
    );
    // Use getAllByText for SEVERITY because it exists both in sidebar filter and table header
    expect(screen.getAllByText("SEVERITY").length).toBeGreaterThan(0);
    expect(screen.getByText("TOOL")).toBeInTheDocument();
    expect(screen.getByText("FILE")).toBeInTheDocument();
    expect(screen.getByText("MESSAGE")).toBeInTheDocument();
    expect(screen.getByText("LINE")).toBeInTheDocument();
  });

  it("renders START WATCH button when not watching", () => {
    render(
      <MantineProvider>
        <Dashboard {...defaultProps} />
      </MantineProvider>,
    );
    expect(screen.getByText("START WATCH")).toBeInTheDocument();
  });

  it("renders STOP WATCH button when watching", () => {
    render(
      <MantineProvider>
        <Dashboard {...defaultProps} isWatching={true} />
      </MantineProvider>,
    );
    expect(screen.getByText("STOP WATCH")).toBeInTheDocument();
  });

  it("renders module cards", () => {
    render(
      <MantineProvider>
        <Dashboard {...defaultProps} />
      </MantineProvider>,
    );
    expect(screen.getByText("ESLINT")).toBeInTheDocument();
    expect(screen.getByText("TYPESCRIPT")).toBeInTheDocument();
  });

  it("renders findings in table", () => {
    render(
      <MantineProvider>
        <Dashboard {...defaultProps} />
      </MantineProvider>,
    );
    expect(screen.getAllByText("[ERROR]").length).toBeGreaterThan(0);
    expect(screen.getByText("Error 1")).toBeInTheDocument();
  });
});
