export interface Project {
  id: string;
  name: string;
  path: string;
  created_at?: string;
}

export interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}
