import { useQuery } from "@tanstack/react-query";
import { fetchTools } from "../api/analysisApi";
import { DEFAULT_MODULES } from "../constants";

export const useTools = () => {
  return useQuery({
    queryKey: ["tools"],
    queryFn: fetchTools,
    initialData: DEFAULT_MODULES,
    staleTime: 1000 * 60 * 60, // Consider static data fresh for 1 hour
  });
};
