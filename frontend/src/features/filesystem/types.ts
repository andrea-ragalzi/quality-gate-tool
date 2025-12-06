export interface FileSystemItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: number;
}

export interface FileSystemState {
  currentPath: string;
  items: FileSystemItem[];
  isLoading: boolean;
  error: string | null;
}
