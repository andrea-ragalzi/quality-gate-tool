import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "@testing-library/react";
import { useAnalysisStore } from "../stores/useAnalysisStore";

describe("useAnalysisStore State Integrity", () => {
  beforeEach(() => {
    useAnalysisStore.setState({
      overallStatus: "IDLE",
      moduleLogs: {},
      isAnalyzing: false,
      isWatching: false,
      lastSystemMessage: "",
    });
  });

  it("should update module logs correctly", () => {
    const { updateModuleLog } = useAnalysisStore.getState();

    act(() => {
      updateModuleLog("test-module", {
        status: "RUNNING",
        logs: ["Log 1"],
      });
    });

    const state = useAnalysisStore.getState();
    expect(state.moduleLogs["test-module"].status).toBe("RUNNING");
    expect(state.moduleLogs["test-module"].logs).toContain("Log 1");
  });

  it("should reset logs completely", () => {
    const { updateModuleLog, resetLogs } = useAnalysisStore.getState();

    act(() => {
      updateModuleLog("test-module", { logs: ["Log 1"] });
      updateModuleLog("test-module-2", { logs: ["Log 2"] });
    });

    expect(Object.keys(useAnalysisStore.getState().moduleLogs)).toHaveLength(2);

    act(() => {
      resetLogs();
    });

    expect(useAnalysisStore.getState().moduleLogs).toEqual({});
  });

  it("should set overall status", () => {
    const { setOverallStatus } = useAnalysisStore.getState();

    act(() => {
      setOverallStatus("RUNNING");
    });

    expect(useAnalysisStore.getState().overallStatus).toBe("RUNNING");
  });
});
