import { render, screen } from "@testing-library/react";
import MetricsPage from "./page";
import { useAnalysisStore } from "@/features/analysis/stores/useAnalysisStore";
import { vi } from "vitest";
import { MantineProvider } from "@mantine/core";

// Mock the store
vi.mock("@/features/analysis/stores/useAnalysisStore");

// Mock useTools
vi.mock("@/features/analysis/hooks/useTools", () => ({
  useTools: () => ({ data: [] }),
}));

// Mock useMetrics
vi.mock("../../features/metrics/hooks/useMetrics", () => ({
  useMetrics: () => ({
    filteredFindings: [],
    selectedTools: [],
    setSelectedTools: vi.fn(),
    selectedTypes: [],
    setSelectedTypes: vi.fn(),
    sortOrder: "asc",
    setSortOrder: vi.fn(),
    dateRange: [null, null],
    setDateRange: vi.fn(),
  }),
}));

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

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Metrics Dashboard", () => {
  const renderWithProviders = (component: React.ReactNode) => {
    return render(<MantineProvider>{component}</MantineProvider>);
  };

  it("should display live logs from the current analysis", () => {
    // Setup mock state
    const mockLogs = {
      "module-1": {
        logs: ["[10:00:00] Log message 1", "[10:00:01] Log message 2"],
        fullLog: "",
        status: "RUNNING",
      },
    };

    (useAnalysisStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      moduleLogs: mockLogs,
      overallStatus: "RUNNING",
    });

    renderWithProviders(<MetricsPage />);

    // Check if logs are displayed
    expect(screen.getByText(/Log message 1/)).toBeTruthy();
    expect(screen.getByText(/Log message 2/)).toBeTruthy();
  });

  it("should display 'No logs available' when there are no logs", () => {
    (useAnalysisStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      moduleLogs: {},
      overallStatus: "IDLE",
    });

    renderWithProviders(<MetricsPage />);

    expect(screen.getByText(/No logs available/i)).toBeTruthy();
  });
});
