import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useMetricsStore } from "../model/useMetricsStore";
import { METRIC_TYPES, Finding, SortOrder } from "../model/types";

describe("useMetricsStore Parameterized Tests", () => {
  const mockFindings: Finding[] = [
    {
      id: "1",
      tool: "ESLint",
      type: "Error",
      message: "Err1",
      filepath: "a.ts",
      line: 1,
      timestamp: 1000,
    },
    {
      id: "2",
      tool: "Ruff",
      type: "Warning",
      message: "Warn1",
      filepath: "b.py",
      line: 1,
      timestamp: 2000,
    },
    {
      id: "3",
      tool: "ESLint",
      type: "Info",
      message: "Info1",
      filepath: "c.ts",
      line: 1,
      timestamp: 3000,
    },
    {
      id: "4",
      tool: "Ruff",
      type: "Error",
      message: "Err2",
      filepath: "d.py",
      line: 1,
      timestamp: 4000,
    },
  ];

  beforeEach(() => {
    useMetricsStore.setState({
      allFindings: mockFindings,
      filteredFindings: mockFindings,
      availableTools: ["ESLint", "Ruff"],
      filters: {
        tools: ["ESLint", "Ruff"],
        types: [...METRIC_TYPES],
        dateRange: { start: null, end: null },
        query: "",
      },
      sortOrder: "type_desc",
    });
  });

  describe("P-UNIT-002-A: Filter: Severity Levels", () => {
    it.each(METRIC_TYPES)("should filter by severity level: %s", (severity) => {
      act(() => {
        useMetricsStore.getState().setFilters({ types: [severity] });
      });

      const state = useMetricsStore.getState();
      const expectedFindings = mockFindings.filter((f) => f.type === severity);

      expect(state.filteredFindings.length).toBe(expectedFindings.length);
      expect(state.filteredFindings.map((f) => f.id).sort()).toEqual(
        expectedFindings.map((f) => f.id).sort(),
      );

      // Verify that all returned findings indeed have the correct type
      state.filteredFindings.forEach((f) => {
        expect(f.type).toBe(severity);
      });
    });
  });

  describe("P-UNIT-002-B: Filter: Sorting Criteria", () => {
    const sortTestCases: { sortOrder: SortOrder; expectedIds: string[] }[] = [
      {
        sortOrder: "type_desc",
        expectedIds: ["1", "4", "2", "3"], // Error, Error, Warning, Info
      },
      {
        sortOrder: "type_asc",
        expectedIds: ["3", "2", "1", "4"], // Info, Warning, Error, Error
      },
      {
        sortOrder: "newest",
        expectedIds: ["4", "3", "2", "1"],
      },
      {
        sortOrder: "oldest",
        expectedIds: ["1", "2", "3", "4"],
      },
    ];

    it.each(sortTestCases)(
      "should sort by %s",
      ({ sortOrder, expectedIds }) => {
        act(() => {
          useMetricsStore.getState().setSortOrder(sortOrder);
        });

        const state = useMetricsStore.getState();
        const actualIds = state.filteredFindings.map((f) => f.id);

        if (sortOrder.includes("type")) {
          const actualTypes = state.filteredFindings.map((f) => f.type);
          const expectedTypes = expectedIds.map(
            (id) => mockFindings.find((f) => f.id === id)!.type,
          );
          expect(actualTypes).toEqual(expectedTypes);
        } else {
          expect(actualIds).toEqual(expectedIds);
        }
      },
    );
  });

  describe("P-UNIT-002-C: Filter: Tools", () => {
    const toolTestCases = [
      { tools: ["ESLint"], expectedCount: 2 },
      { tools: ["Ruff"], expectedCount: 2 },
      { tools: ["ESLint", "Ruff"], expectedCount: 4 },
      { tools: [], expectedCount: 4 }, // Empty filter means "Show All"
    ];

    it.each(toolTestCases)(
      "should filter by tools: %s",
      ({ tools, expectedCount }) => {
        act(() => {
          useMetricsStore.getState().setFilters({ tools });
        });
        const state = useMetricsStore.getState();
        expect(state.filteredFindings.length).toBe(expectedCount);
        if (tools.length > 0) {
          state.filteredFindings.forEach((f) => {
            expect(tools).toContain(f.tool);
          });
        }
      },
    );
  });

  describe("P-UNIT-002-D: Filter: Free-text query", () => {
    it("should filter findings by query against filepath/message", () => {
      act(() => {
        useMetricsStore.getState().setFilters({ query: "b.py" });
      });

      const state = useMetricsStore.getState();
      expect(state.filteredFindings.map((f) => f.id)).toEqual(["2"]);
    });
  });
});
