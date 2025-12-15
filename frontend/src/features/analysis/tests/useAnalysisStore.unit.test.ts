import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useAnalysisStore } from "../model/useAnalysisStore";

describe("UNIT-001: useAnalysisStore Clean Initialization", () => {
  beforeEach(() => {
    useAnalysisStore.setState({
      overallStatus: "IDLE",
      moduleLogs: {},
      isAnalyzing: false,
      isWatching: false,
      lastSystemMessage: "",
    });
  });

  it("should initialize with clean state", () => {
    const state = useAnalysisStore.getState();

    expect(state.overallStatus).toBe("IDLE");
    expect(state.moduleLogs).toEqual({});
    expect(state.isAnalyzing).toBe(false);
    expect(state.isWatching).toBe(false);
    expect(state.lastSystemMessage).toBe("");
  });
});
