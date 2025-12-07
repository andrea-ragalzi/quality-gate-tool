import { FileSystemItem } from "./types";
import { DirectoryListResponseSchema } from "@/schemas/filesystem";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class FilesystemRepository {
  private baseUrl: string;
  private ignoredNames = [
    ".git",
    "node_modules",
    "__pycache__",
    ".DS_Store",
    "venv",
    ".env",
  ];

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async listDirectory(path: string): Promise<FileSystemItem[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/fs/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list directory: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate with Zod (Data Access Layer responsibility)
    const parsed = DirectoryListResponseSchema.parse(data);

    // Map to UI Model
    return parsed.directories
      .filter(
        (item) =>
          !this.ignoredNames.includes(item.name) && !item.name.startsWith("."),
      )
      .map((item) => ({
        name: item.name,
        path: item.path,
        isDirectory: item.is_dir,
        size: item.size,
        modified: item.modified,
      }));
  }
}
