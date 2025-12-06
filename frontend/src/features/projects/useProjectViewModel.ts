import { useState, useEffect, useCallback } from "react";
import { ProjectRepository } from "./repository";
import { Project } from "./types";

export const useProjectViewModel = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repository = new ProjectRepository();

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await repository.listProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = async (name: string, path: string) => {
    setIsLoading(true);
    try {
      await repository.createProject(name, path);
      await loadProjects(); // Refresh list
    } catch (err) {
      console.error(err);
      setError("Failed to create project.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    projects,
    isLoading,
    error,
    refreshProjects: loadProjects,
    createProject,
  };
};
