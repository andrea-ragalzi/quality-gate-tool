import { useEffect, useMemo } from "react";
import { useMetricsStore } from "../stores/useMetricsStore";
import { useAnalysisStore } from "@/features/analysis/stores/useAnalysisStore";
import { useTools } from "@/features/analysis/hooks/useTools";
import { parseFindingsFromLogs } from "../logParser";
import { Finding } from "../types";

/**
 * Synchronizes analysis logs with metrics store.
 * Should be mounted once at the app root.
 */
export const useMetricsSync = () => {
  const { moduleLogs } = useAnalysisStore();
  const { data: tools } = useTools();
  const { setFindings, setAvailableTools } = useMetricsStore();

  // Update available tools
  useEffect(() => {
    if (tools && tools.length > 0) {
      setAvailableTools(tools.map((t) => t.title));
    }
  }, [tools, setAvailableTools]);

  // Tool Map
  const toolMap = useMemo(() => {
    if (!tools) return {};
    return tools.reduce(
      (acc, tool) => {
        acc[tool.id] = tool.title;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [tools]);

  // Sync Logs to Findings
  useEffect(() => {
    if (moduleLogs && Object.keys(moduleLogs).length > 0) {
      let parsedFindings: Finding[] = [];
      Object.entries(moduleLogs).forEach(([moduleId, data]) => {
        if (data.fullLog) {
          const findings = parseFindingsFromLogs(
            moduleId,
            data.fullLog,
            toolMap,
          );
          parsedFindings = [...parsedFindings, ...findings];
        }
      });
      setFindings(parsedFindings);
    } else {
      setFindings([]);
    }
  }, [moduleLogs, setFindings, toolMap]);
};
