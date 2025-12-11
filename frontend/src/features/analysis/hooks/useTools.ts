import { useQuery } from "@tanstack/react-query";
import { fetchTools } from "../api/analysisApi";

export const useTools = () => {
  return useQuery({
    queryKey: ["tools"],
    queryFn: fetchTools,
  });
};
