import { Project } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ProjectRepository {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async listProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/projects/`);

    if (!response.ok) {
      throw new Error(`Failed to list projects: ${response.statusText}`);
    }

    return await response.json();
  }

  async createProject(name: string, path: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/v1/projects/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, path }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.statusText}`);
    }

    return await response.json();
  }
}
