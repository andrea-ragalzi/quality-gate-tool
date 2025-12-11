import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProjects, createProject } from "../api/projectApi";
import { useEffect, useState } from "react";
import { Project } from "../types";

export const useProjects = () => {
  // 1. Load initial data from localStorage (Client-side only)
  const [initialData, setInitialData] = useState<Project[] | undefined>(
    undefined,
  );

  useEffect(() => {
    const cached = localStorage.getItem("cached_projects");
    if (cached) {
      try {
        setInitialData(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached projects", e);
      }
    }
  }, []);

  // 2. Query with side-effect to update cache
  const query = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const data = await fetchProjects();
      localStorage.setItem("cached_projects", JSON.stringify(data));
      return data;
    },
    initialData: initialData,
  });

  return query;
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, path }: { name: string; path: string }) =>
      createProject(name, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
