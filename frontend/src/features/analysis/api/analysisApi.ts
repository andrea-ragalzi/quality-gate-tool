import { ModuleConfig } from "@/entities/analysis";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const fetchTools = async (): Promise<ModuleConfig[]> => {
  const response = await fetch(`${API_BASE_URL}/api/tools`);
  if (!response.ok) {
    throw new Error("Failed to fetch tools");
  }
  return response.json();
};
