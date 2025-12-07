import { renderHook, act } from "@testing-library/react";
import { useAnalysisViewModel } from "./useAnalysisViewModel";
import { AnalysisRepository } from "./repository";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("./repository");

describe("useAnalysisViewModel", () => {
  let mockConnect: any;
  let mockDisconnect: any;
  let mockStartAnalysis: any;
  let mockStopWatch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect = vi.fn();
    mockDisconnect = vi.fn();
    mockStartAnalysis = vi.fn();
    mockStopWatch = vi.fn();

    AnalysisRepository.prototype.connect = mockConnect;
    AnalysisRepository.prototype.disconnect = mockDisconnect;
    AnalysisRepository.prototype.startAnalysis = mockStartAnalysis;
    AnalysisRepository.prototype.stopWatch = mockStopWatch;
  });

  it("should connect to websocket on mount", () => {
    renderHook(() => useAnalysisViewModel());
    expect(mockConnect).toHaveBeenCalled();
  });

  it("should transition state correctly (State Stuck Bug Prevention)", () => {
    const { result } = renderHook(() => useAnalysisViewModel());
    const onMessage = mockConnect.mock.calls[0][0];

    // Start Analysis
    act(() => {
      onMessage({ type: "GLOBAL_INIT" });
    });
    expect(result.current.isAnalyzing).toBe(true);
    expect(result.current.overallStatus).toBe("RUNNING");

    // End Analysis
    act(() => {
      onMessage({ type: "GLOBAL_END", status: "PASS" });
    });
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.overallStatus).toBe("SUCCESS");
  });

  it("should aggregate logs correctly (Aggregation Bug Prevention)", () => {
    const { result } = renderHook(() => useAnalysisViewModel());
    const onMessage = mockConnect.mock.calls[0][0];

    // Use a real module ID from config
    const moduleId = "F_TypeScript";

    // Initialize module
    act(() => {
      onMessage({ type: "INIT", moduleId: moduleId });
    });

    // Add first log
    act(() => {
      onMessage({ type: "LOG", moduleId: moduleId, message: "Log 1" });
    });

    // Verify first log
    const module1 = result.current.moduleLogs[moduleId];
    // INIT adds "Analysis started...", LOG adds "Log 1" -> Total 2
    expect(module1?.logs).toHaveLength(2);
    expect(module1?.logs[1]).toContain("Log 1");

    // Add second log
    act(() => {
      onMessage({ type: "LOG", moduleId: moduleId, message: "Log 2" });
    });

    // Verify aggregation (should have 3 logs, not reset)
    const module2 = result.current.moduleLogs[moduleId];
    expect(module2?.logs).toHaveLength(3);
    expect(module2?.logs[1]).toContain("Log 1");
    expect(module2?.logs[2]).toContain("Log 2");
  });

  it("should update module status", () => {
    const { result } = renderHook(() => useAnalysisViewModel());
    const onMessage = mockConnect.mock.calls[0][0];
    const moduleId = "B_Ruff";

    act(() => {
      onMessage({ type: "INIT", moduleId: moduleId });
    });

    const module1 = result.current.moduleLogs[moduleId];
    expect(module1?.status).toBe("RUNNING");

    act(() => {
      onMessage({ type: "END", moduleId: moduleId, status: "PASS" });
    });

    const module2 = result.current.moduleLogs[moduleId];
    expect(module2?.status).toBe("PASS");
  });
  it("should update module status", () => {
    const { result } = renderHook(() => useAnalysisViewModel());
    const onMessage = mockConnect.mock.calls[0][0];

    act(() => {
      onMessage({ type: "INIT", moduleId: "tests" });
    });

    const module1 = result.current.moduleLogs["tests"];
    expect(module1?.status).toBe("RUNNING");

    act(() => {
      onMessage({ type: "END", moduleId: "tests", status: "PASS" });
    });

    const module2 = result.current.moduleLogs["tests"];
    expect(module2?.status).toBe("PASS");
  });
  it("should handle global completion", () => {
    const { result } = renderHook(() => useAnalysisViewModel());
    const onMessage = mockConnect.mock.calls[0][0];

    act(() => {
      onMessage({ type: "GLOBAL_END", status: "PASS" });
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.overallStatus).toBe("SUCCESS");
  });

  it("should handle start analysis", async () => {
    const { result } = renderHook(() => useAnalysisViewModel());

    await act(async () => {
      await result.current.startAnalysis({
        project_path: "/test",
        mode: "watch",
        selected_tools: [],
      });
    });

    expect(mockStartAnalysis).toHaveBeenCalled();
    expect(result.current.isAnalyzing).toBe(true);
  });
});
