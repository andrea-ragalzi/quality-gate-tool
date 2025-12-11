import { Project } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const fetchProjects = async (): Promise<Project[]> => {
  console.log(`Fetching projects from: ${API_BASE_URL}/api/v1/projects/`);
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/`);
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  return response.json();
};

export const createProject = async (
  name: string,
  path: string,
): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, path }),
  });
  if (!response.ok) {
    throw new Error("Failed to create project");
  }
  return response.json();
};
