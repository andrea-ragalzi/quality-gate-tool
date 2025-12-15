import { useMutation } from "@tanstack/react-query";
import { StartAnalysisPayload } from "./types";
import { useAnalysisStore } from "./useAnalysisStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const startAnalysisApi = async (payload: StartAnalysisPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/run-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(`Failed to start analysis: ${response.statusText}`);
};

const stopAnalysisApi = async (payload: {
  project_path: string;
  project_id: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/api/stop-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(`Failed to stop analysis: ${response.statusText}`);
};

const stopWatchApi = async (payload: {
  project_path: string;
  project_id: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/api/stop-watch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(`Failed to stop watch: ${response.statusText}`);
};

export const useAnalysisMutations = () => {
  const { setIsAnalyzing, setOverallStatus, setIsWatching } =
    useAnalysisStore();

  const startAnalysis = useMutation({
    mutationFn: startAnalysisApi,
    onMutate: (variables) => {
      setIsAnalyzing(true);
      setOverallStatus("STARTING");
      if (variables.mode === "watch") {
        setIsWatching(true);
        setOverallStatus("WATCHING");
      }
    },
    onError: () => {
      setIsAnalyzing(false);
      setOverallStatus("ERROR");
    },
  });

  const stopAnalysis = useMutation({
    mutationFn: stopAnalysisApi,
    onSuccess: () => {
      setIsAnalyzing(false);
      setOverallStatus("IDLE");
    },
  });

  const stopWatch = useMutation({
    mutationFn: stopWatchApi,
    onSuccess: () => {
      setIsWatching(false);
      setIsAnalyzing(false);
      setOverallStatus("IDLE");
    },
  });

  return { startAnalysis, stopAnalysis, stopWatch };
};
